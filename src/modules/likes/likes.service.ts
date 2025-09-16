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

type TopLikedItem = {
  system: {
    id: string;
    title: string;
    galaxy_id: string;
    owner_id: string;
    created_at: Date;
    updated_at: Date;
  };
  like_count: number;
  planet_count: number;
  rank: number;
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
  /**
   * 내가 좋아요 누른 항성계 개수 조회
   */
  async countMyLikedSystems(userId: string): Promise<number> {
    return this.prisma.like.count({ where: { user_id: userId } });
  }

  /**
   * 내가 좋아요 한 항성계 목록 조회 (+ planet_count)
   */
  async getMyLikes(
    userId: string,
    dto: PaginationDto
  ): Promise<
    PaginatedResponse<{
      system: {
        id: string;
        title: string;
        galaxy_id: string;
        owner_id: string;
        created_by_id: string;
        created_at: Date;
        updated_at: Date;
      };
      planet_count: number; 
      liked_at: Date;
    }>
  > {
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
              owner_id: true,
              created_by_id: true,
              created_at: true,
              updated_at: true,
              _count: { select: { planets: true } },
            },
          },
          created_at: true,
        },
      }),
      this.prisma.like.count({ where: { user_id: userId } }),
    ]);

    const data = rows.map(row => {
      const sys = row.system as any;
      return {
        system: {
          id: sys.id,
          title: sys.title,
          galaxy_id: sys.galaxy_id,
          owner_id: sys.owner_id,
          created_by_id: sys.created_by_id,
          created_at: sys.created_at,
          updated_at: sys.updated_at,
        },
        planet_count: sys._count?.planets ?? 0,
        liked_at: row.created_at,
      };
    });

    return { data, meta: buildPaginationMeta(total, dto) };
  }

  /**
   * 특정 시스템을 좋아요한 사용자 목록 (원 구조 유지)
   * 반환: PaginatedResponse<{ user: {id, username, image}, liked_at: Date }>
   */
  async getSystemLikers(
    systemId: string,
    dto: PaginationDto
  ): Promise<
    PaginatedResponse<{
      user: { id: string; username: string | null; image: string | null };
      liked_at: Date;
    }>
  > {
    await this.assertSystemExists(systemId);

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.like.findMany({
        where: { system_id: systemId },
        orderBy: { created_at: 'desc' },
        skip: dto.skip,
        take: dto.take,
        select: {
          user: { select: { id: true, username: true, image: true } },
          created_at: true,
        },
      }),
      this.prisma.like.count({ where: { system_id: systemId } }),
    ]);

    return {
      data: rows.map(r => ({ user: r.user, liked_at: r.created_at })),
      meta: buildPaginationMeta(total, dto),
    };
  }

  /**
   * 주/월/년: 기간 좋아요수 랭킹, 랜덤: 무작위 (+ planet_count)
   */
  async getLikeRankings(
    dto: PaginationDto & { rangk_type?: RangkType }
  ): Promise<
    PaginatedResponse<{
      system: {
        id: string;
        title: string;
        galaxy_id: string;
        owner_id: string;
        created_at: Date;
        updated_at: Date;
      };
      like_count: number;
      planet_count: number; 
      rank: number;
    }>
  > {
    // 0) 안전한 페이지/리밋 계산
    const rawPage = Number((dto as any).page ?? 1);
    const rawLimit = Number((dto as any).limit ?? 20);
    const page =
      Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
    const limit =
      Number.isFinite(rawLimit) && rawLimit > 0 ? Math.floor(rawLimit) : 20;
    const skip = (page - 1) * limit;
    const take = limit;

    // 1) 기간 필터
    let likeWhere: any = {};
    if (dto.rangk_type && dto.rangk_type !== RangkType.RANDOM) {
      const { gte, lte } = getKstRangeUTC(dto.rangk_type);
      likeWhere = { created_at: { gte, lte } };
    }

    let rankings: { system_id: string; like_count: number }[] = [];
    let total = 0;

    if (dto.rangk_type === RangkType.RANDOM) {
      // 2-A) RANDOM: 시스템을 랜덤으로 슬라이스
      const totalSystems = await this.prisma.stellarSystem.count();
      if (totalSystems === 0) {
        return {
          data: [],
          meta: buildPaginationMeta(0, {
            ...dto,
            page,
            limit,
            skip,
            take,
          } as any),
        };
      }

      const safeTake = Math.min(Math.max(take, 1), totalSystems);
      const maxOffset = Math.max(totalSystems - safeTake, 0);
      const randSkip =
        maxOffset > 0 ? Math.floor(Math.random() * (maxOffset + 1)) : 0;

      const randomSystems = await this.prisma.stellarSystem.findMany({
        select: { id: true },
        orderBy: { created_at: 'asc' },
        skip: randSkip,
        take: safeTake,
      });
      const systemIds = randomSystems.map(s => s.id);

      const likeCounts = await this.prisma.like.groupBy({
        by: ['system_id'],
        where: { system_id: { in: systemIds } }, // 누적(기간 X)
        _count: { system_id: true },
      });

      const countMap = new Map(
        likeCounts.map(lc => [lc.system_id, lc._count.system_id])
      );
      rankings = systemIds.map(id => ({
        system_id: id,
        like_count: countMap.get(id) ?? 0,
      }));
      total = rankings.length; // 랜덤은 요청 묶음 크기
    } else {
      // 2-B) 기간 랭킹
      const allGroups = await this.prisma.like.groupBy({
        by: ['system_id'],
        where: likeWhere,
        _count: { system_id: true },
      });
      total = allGroups.length;

      const pageGroups = await this.prisma.like.groupBy({
        by: ['system_id'],
        where: likeWhere,
        _count: { system_id: true },
        orderBy: { _count: { system_id: 'desc' } },
        skip,
        take,
      });

      rankings = pageGroups.map(g => ({
        system_id: g.system_id,
        like_count: g._count.system_id,
      }));
    }

    // 3) 시스템 정보 + planet_count 가져오기
    const systemIds = rankings.map(r => r.system_id);
    if (systemIds.length === 0) {
      return {
        data: [],
        meta: buildPaginationMeta(total, {
          ...dto,
          page,
          limit,
          skip,
          take,
        } as any),
      };
    }

    const systems = await this.prisma.stellarSystem.findMany({
      where: { id: { in: systemIds } },
      select: {
        id: true,
        title: true,
        galaxy_id: true,
        owner_id: true,
        created_at: true,
        updated_at: true,
        _count: { select: { planets: true } }, // ★ planet_count 소스
      },
    });
    const systemMap = new Map(systems.map(s => [s.id, s]));

    const data = rankings
      .map((r, idx) => {
        const sys = systemMap.get(r.system_id);
        if (!sys) return null;
        return {
          system: {
            id: sys.id,
            title: sys.title,
            galaxy_id: sys.galaxy_id,
            owner_id: sys.owner_id,
            created_at: sys.created_at,
            updated_at: sys.updated_at,
          },
          like_count: r.like_count,
          planet_count: sys._count?.planets ?? 0,
          rank: dto.rangk_type === RangkType.RANDOM ? idx + 1 : skip + idx + 1,
        };
      })
      .filter(Boolean) as Array<{
      system: {
        id: string;
        title: string;
        galaxy_id: string;
        owner_id: string;
        created_at: Date;
        updated_at: Date;
      };
      like_count: number;
      planet_count: number;
      rank: number;
    }>;

    return {
      data,
      meta: buildPaginationMeta(total, {
        ...dto,
        page,
        limit,
        skip,
        take,
      } as any),
    };
  }

  async getTopLikedSystems(
    dto: PaginationDto 
  ): Promise<PaginatedResponse<TopLikedItem>> {
    // 1) 안전한 페이지/리밋 (문자일 수 있으니 파싱)
    const rawPage = Number((dto as any).page ?? 1);
    const rawLimit = Number((dto as any).limit ?? 20);
    const page =
      Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
    const limit =
      Number.isFinite(rawLimit) && rawLimit > 0 ? Math.floor(rawLimit) : 20;
    const skip = (page - 1) * limit;
    const take = limit;

    // 2) 총 “집계 대상 시스템 수” (DISTINCT system_id) — groupBy로 집계
    const totalGroups = await this.prisma.like.groupBy({
      by: ['system_id'],
      _count: { system_id: true },
    });
    const total = totalGroups.length;

    if (total === 0) {
      return {
        data: [],
        meta: buildPaginationMeta(0, {
          ...dto,
          page,
          limit,
          skip,
          take,
        } as any),
      };
    }

    // 3) 페이지 구간의 상위 시스템들 (전체 기간: where 조건 없음)
    const pageGroups = await this.prisma.like.groupBy({
      by: ['system_id'],
      _count: { system_id: true },
      orderBy: { _count: { system_id: 'desc' } },
      skip,
      take,
    });

    // 4) 시스템 상세 + planet_count 동반 조회
    const systemIds = pageGroups.map(g => g.system_id);
    const systems = await this.prisma.stellarSystem.findMany({
      where: { id: { in: systemIds } },
      select: {
        id: true,
        title: true,
        galaxy_id: true,
        owner_id: true,
        created_at: true,
        updated_at: true,
        _count: { select: { planets: true } }, // ← 행성 수
      },
    });
    const systemMap = new Map(systems.map(s => [s.id, s]));

    // 5) 응답 매핑 (요청 페이지 내 순번을 rank로)
    const data: TopLikedItem[] = pageGroups.map((g, idx) => {
      const sys = systemMap.get(g.system_id)!; // 가드 필요하면 체크
      return {
        system: {
          id: sys.id,
          title: sys.title,
          galaxy_id: sys.galaxy_id,
          owner_id: sys.owner_id,
          created_at: sys.created_at,
          updated_at: sys.updated_at,
        },
        like_count: g._count.system_id,
        planet_count: sys._count?.planets ?? 0,
        rank: skip + idx + 1,
      };
    });

    return {
      data,
      meta: buildPaginationMeta(total, {
        ...dto,
        page,
        limit,
        skip,
        take,
      } as any),
    };
  }
}
