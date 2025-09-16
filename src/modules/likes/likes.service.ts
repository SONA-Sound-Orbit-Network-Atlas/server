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

type SystemListItem = {
  // 공통(시스템) 필드
  id: string;
  title: string;
  galaxy_id: string;
  owner_id: string;
  created_by_id?: string; // 일부 쿼리에서 선택하지 않을 수 있으므로 optional
  created_at: Date;
  updated_at: Date;
  planet_count: number;

  // 상황별 옵션 필드
  like_count?: number;
  liked_at?: Date;
  rank?: number;
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

  /** 공통 매핑 유틸: Prisma 결과 → 평평한 SystemListItem */
  private toSystemListItem(
    sys: {
      id: string;
      title: string;
      galaxy_id: string;
      owner_id: string;
      created_by_id?: string;
      created_at: Date;
      updated_at: Date;
      _count?: { planets?: number };
    },
    extra: Partial<
      Pick<SystemListItem, 'like_count' | 'liked_at' | 'rank'>
    > = {}
  ): SystemListItem {
    return {
      id: sys.id,
      title: sys.title,
      galaxy_id: sys.galaxy_id,
      owner_id: sys.owner_id,
      created_by_id: sys.created_by_id,
      created_at: sys.created_at,
      updated_at: sys.updated_at,
      planet_count: sys._count?.planets ?? 0,
      ...extra,
    };
  }

  /**
   * 내가 좋아요 한 항성계 목록 조회
   * 반환: PaginatedResponse<SystemListItem>  (liked_at 포함)
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
              owner_id: true,
              created_by_id: true,
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
      this.toSystemListItem(row.system as any, { liked_at: row.created_at })
    );

    return { data, meta: buildPaginationMeta(total, dto) };
  }

  /**
   * 주/월/년: 기간 좋아요수 랭킹, 랜덤: 무작위
   * 반환: PaginatedResponse<SystemListItem> (like_count, rank 포함)
   */
  async getLikeRankings(
    dto: PaginationDto & { rangk_type?: RangkType }
  ): Promise<PaginatedResponse<SystemListItem>> {
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
        where: { system_id: { in: systemIds } },
        _count: { system_id: true },
      });

      const countMap = new Map(
        likeCounts.map(lc => [lc.system_id, lc._count.system_id])
      );
      rankings = systemIds.map(id => ({
        system_id: id,
        like_count: countMap.get(id) ?? 0,
      }));
      total = rankings.length;
    } else {
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
        created_by_id: true,
        created_at: true,
        updated_at: true,
        _count: { select: { planets: true } },
      },
    });
    const systemMap = new Map(systems.map(s => [s.id, s]));

    const data: SystemListItem[] = rankings
      .map((r, idx) => {
        const sys = systemMap.get(r.system_id);
        if (!sys) return null;
        return this.toSystemListItem(sys, {
          like_count: r.like_count,
          rank: dto.rangk_type === RangkType.RANDOM ? idx + 1 : skip + idx + 1,
        });
      })
      .filter(Boolean) as SystemListItem[];

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

  /**
   * 전체 기간 상위 좋아요 시스템
   * 반환: PaginatedResponse<SystemListItem> (like_count, rank 포함)
   */
  async getTopLikedSystems(
    dto: PaginationDto
  ): Promise<PaginatedResponse<SystemListItem>> {
    const rawPage = Number((dto as any).page ?? 1);
    const rawLimit = Number((dto as any).limit ?? 20);
    const page =
      Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
    const limit =
      Number.isFinite(rawLimit) && rawLimit > 0 ? Math.floor(rawLimit) : 20;
    const skip = (page - 1) * limit;
    const take = limit;

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

    const pageGroups = await this.prisma.like.groupBy({
      by: ['system_id'],
      _count: { system_id: true },
      orderBy: { _count: { system_id: 'desc' } },
      skip,
      take,
    });

    const systemIds = pageGroups.map(g => g.system_id);
    const systems = await this.prisma.stellarSystem.findMany({
      where: { id: { in: systemIds } },
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
    });
    const systemMap = new Map(systems.map(s => [s.id, s]));

    const data: SystemListItem[] = pageGroups
      .map((g, idx) => {
        const sys = systemMap.get(g.system_id);
        if (!sys) return null;
        return this.toSystemListItem(sys, {
          like_count: g._count.system_id,
          rank: skip + idx + 1,
        });
      })
      .filter(Boolean) as SystemListItem[];

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
