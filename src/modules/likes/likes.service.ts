import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LikeTargetDto, RangkType } from './dto/likes.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import {
  PaginatedResponse,
  PaginationDto,
} from '../../common/dto/pagination.dto';
import { buildPaginationMeta } from '../../common/utils/pagination.util';
import { getKstRangeUTC } from '../../common/utils/kst-range.util';
import { Prisma } from '@prisma/client';

type SystemListItem = {
  // 공통(시스템) 필드
  id: string;
  title: string;
  galaxy_id: string;
  creator_id: string;
  created_at: Date;
  updated_at: Date;
  planet_count: number;

  // 상황별 옵션 필드
  like_count?: number;
  liked_at?: Date;
  rank?: number;

  // 현재 조회자(viewer)가 좋아요 눌렀는지
  is_liked?: boolean;
};

@Injectable()
export class LikesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * system_id가 실제로 존재하는지 확인
   */
  private async assertSystemExists(system_id: string) {
    const system = await this.prisma.stellarSystem.findUnique({
      where: { id: system_id },
      select: { id: true },
    });
    if (!system) {
      throw new NotFoundException('대상 시스템을 찾을 수 없습니다.');
    }
  }

  /**
   * 좋아요 생성
   */
  async likeSystem(userId: string, dto: LikeTargetDto) {
    await this.assertSystemExists(dto.system_id);

    try {
      const like = await this.prisma.like.create({
        data: { user_id: userId, system_id: dto.system_id },
        select: { id: true, user_id: true, system_id: true, created_at: true },
      });
      return { message: '좋아요가 생성되었습니다.', like };
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new Error('이미 좋아요를 눌렀습니다.');
      }
      throw error;
    }
  }

  /**
   * 좋아요 삭제
   * - 좋아요가 없으면 에러
   */
  async unlikeSystem(userId: string, dto: LikeTargetDto) {
    await this.assertSystemExists(dto.system_id);

    try {
      await this.prisma.like.delete({
        where: {
          user_id_system_id: { user_id: userId, system_id: dto.system_id },
        },
      });
      return { message: '좋아요가 삭제되었습니다.' };
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new Error('좋아요가 존재하지 않습니다.');
      }
      throw error;
    }
  }

  /** 공통 매핑 유틸: Prisma 결과 → 평평한 SystemListItem */
  private toSystemListItem(
    sys: {
      id: string;
      title: string;
      galaxy_id: string;
      creator_id: string;
      created_at: Date;
      updated_at: Date;
      _count?: { planets?: number };
    },
    extra: Partial<
      Pick<SystemListItem, 'like_count' | 'liked_at' | 'rank' | 'is_liked'>
    > = {}
  ): SystemListItem {
    return {
      id: sys.id,
      title: sys.title,
      galaxy_id: sys.galaxy_id,
      creator_id: sys.creator_id,
      created_at: sys.created_at,
      updated_at: sys.updated_at,
      planet_count: sys._count?.planets ?? 0,
      ...extra,
    };
  }

  /**
   * 내가 좋아요 한 항성계 목록 조회
   * 반환: PaginatedResponse<SystemListItem>  (liked_at, is_liked 포함)
   */
  async getMyLikes(
    userId: string,
    dto: PaginationDto
  ): Promise<PaginatedResponse<SystemListItem>> {
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.like.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
        skip: dto.skip,
        take: dto.take,
        select: {
          system: {
            select: {
              id: true,
              title: true,
              galaxy_id: true,
              creator_id: true,
              created_at: true,
              updated_at: true,
              _count: { select: { planets: true } },
            },
          },
          created_at: true, // liked_at 소스
        },
      }),
      this.prisma.like.count({ where: { user_id: userId } }),
    ]);

    const data: SystemListItem[] = rows.map(row =>
      this.toSystemListItem(row.system as any, {
        liked_at: row.created_at,
        is_liked: true, // 내가 좋아요한 목록이므로 항상 true
      })
    );

    return { data, meta: buildPaginationMeta(total, dto) };
  }

  /**
   * 주/월/년/전체: 기간 좋아요수 랭킹, 랜덤: 무작위
   * 반환: PaginatedResponse<SystemListItem> (like_count, rank, is_liked 포함 가능)
   *
   * @param viewerId 현재 조회자(선택). 전달되면 is_liked 계산.
   */
  // 실제 DB 테이블/컬럼명 상수 (@@map 기준)
  T_STELLAR = Prisma.raw(`"stellar_systems"`);
  T_LIKE = Prisma.raw(`"likes"`);
  C_CREATED_AT = Prisma.raw(`"created_at"`);
  C_SYSTEM_ID = Prisma.raw(`"system_id"`);

  async getLikeRankings(
    dto: PaginationDto & {
      rank_type?: 'total' | 'year' | 'month' | 'week' | 'random';
    },
    viewerId?: string
  ): Promise<PaginatedResponse<SystemListItem>> {
    // 0) 페이지네이션(안전 보정)
    const page = Math.max(1, Math.floor(Number(dto.page ?? 1)));
    const limit = Math.min(
      100,
      Math.max(1, Math.floor(Number(dto.limit ?? 20)))
    );
    const skip = (page - 1) * limit;
    const take = limit;

    const rankType = dto.rank_type ?? 'total';

    // ─────────────────────────────────────────────
    // RANDOM: 0 포함 + 무작위 정렬
    if (rankType === 'random') {
      const rows = await this.prisma.$queryRaw<
        { id: string; like_count: number }[]
      >(
        Prisma.sql`
        SELECT s.id,
               COALESCE(COUNT(l.${this.C_SYSTEM_ID}), 0)::int AS like_count
        FROM ${this.T_STELLAR} AS s
        LEFT JOIN ${this.T_LIKE}    AS l ON l.${this.C_SYSTEM_ID} = s.id
        GROUP BY s.id
        ORDER BY RANDOM()
        OFFSET ${skip} LIMIT ${take};
      `
      );

      const total = await this.prisma.stellarSystem.count(); // 시스템 총 개수 = 페이지네이션 분모

      const systemIds = rows.map(r => r.id);
      const systems = await this.prisma.stellarSystem.findMany({
        where: { id: { in: systemIds } },
        select: {
          id: true,
          title: true,
          galaxy_id: true,
          creator_id: true,
          created_at: true,
          updated_at: true,
          _count: { select: { planets: true } },
        },
      });
      const sysMap = new Map(systems.map(s => [s.id, s]));

      let likedSet = new Set<string>();
      if (viewerId && systemIds.length) {
        const likedRows = await this.prisma.like.findMany({
          where: { user_id: viewerId, system_id: { in: systemIds } },
          select: { system_id: true },
        });
        likedSet = new Set(likedRows.map(r => r.system_id));
      }

      const data: SystemListItem[] = rows
        .map((r, idx) => {
          const s = sysMap.get(r.id);
          if (!s) return null as any;
          return this.toSystemListItem(s, {
            like_count: r.like_count,
            rank: idx + 1,
            is_liked: viewerId ? likedSet.has(s.id) : false,
          });
        })
        .filter(Boolean) as SystemListItem[];

      return {
        data,
        meta: buildPaginationMeta(total, {
          ...dto,
          page,
          limit,
        } as PaginationDto),
      };
    }

    // ─────────────────────────────────────────────
    // TOTAL / YEAR / MONTH / WEEK: 0 포함 + 기간 필터
    const rawRange = getKstRangeUTC(rankType as any) as {
      gte: Date;
      lte: Date;
    } | null;
    const range = rankType === 'total' ? null : rawRange;

    const timeJoinSql = range
      ? Prisma.sql`AND l.${this.C_CREATED_AT} BETWEEN ${range.gte} AND ${range.lte}`
      : Prisma.sql``;

    // (필요 시) 시스템 WHERE 필터 추가
    const whereSql = Prisma.sql``;

    // 1) 페이지 데이터 (좋아요 0 포함)
    const rows = await this.prisma.$queryRaw<
      { id: string; like_count: number }[]
    >(
      Prisma.sql`
      SELECT s.id,
             COALESCE(COUNT(l.${this.C_SYSTEM_ID}), 0)::int AS like_count
      FROM ${this.T_STELLAR} AS s
      LEFT JOIN ${this.T_LIKE}    AS l
        ON l.${this.C_SYSTEM_ID} = s.id
       ${timeJoinSql}
      ${whereSql}
      GROUP BY s.id
      ORDER BY like_count DESC, s.${this.C_CREATED_AT} DESC, s.id ASC
      OFFSET ${skip} LIMIT ${take};
    `
    );

    // 2) 전체 개수(페이지네이션용): 시스템 기준
    const total = await this.prisma
      .$queryRaw<{ total: number }[]>(
        Prisma.sql`
      SELECT COUNT(*)::int AS total
      FROM ${this.T_STELLAR} AS s
      ${whereSql};
    `
      )
      .then(r => r[0]?.total ?? 0);

    if (!rows.length) {
      return {
        data: [],
        meta: buildPaginationMeta(total, {
          ...dto,
          page,
          limit,
        } as PaginationDto),
      };
    }

    // 3) 시스템 메타 + is_liked
    const systemIds = rows.map(r => r.id);
    const systems = await this.prisma.stellarSystem.findMany({
      where: { id: { in: systemIds } },
      select: {
        id: true,
        title: true,
        galaxy_id: true,
        creator_id: true,
        created_at: true,
        updated_at: true,
        _count: { select: { planets: true } }, // like_count는 rows 값 사용
      },
    });
    const systemMap = new Map(systems.map(s => [s.id, s]));

    let likedSet = new Set<string>();
    if (viewerId) {
      const likedRows = await this.prisma.like.findMany({
        where: { user_id: viewerId, system_id: { in: systemIds } },
        select: { system_id: true },
      });
      likedSet = new Set(likedRows.map(r => r.system_id));
    }

    const data: SystemListItem[] = rows
      .map((r, idx) => {
        const s = systemMap.get(r.id);
        if (!s) return null as any;
        return this.toSystemListItem(s, {
          like_count: r.like_count,
          rank: skip + idx + 1,
          is_liked: viewerId ? likedSet.has(s.id) : false,
        });
      })
      .filter(Boolean) as SystemListItem[];

    return {
      data,
      meta: buildPaginationMeta(total, {
        ...dto,
        page,
        limit,
      } as PaginationDto),
    };
  }
  /**
   * 내가 좋아요 누른 항성계 개수 조회
   */
  async countMyLikedSystems(userId: string): Promise<number> {
    return this.prisma.like.count({ where: { user_id: userId } });
  }
}
