import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';

type FollowUserSummary = {
  id: string;
  username: string;
 
  // 로그인 사용자(viewer) 기준 플래그
  viewer_is_following?: boolean; // viewer → user
  viewer_is_followed_by?: boolean; // user → viewer
  isMutual?: boolean; // 위 두 개 모두 true
};

function makeMeta(total: number, page: number, limit: number) {
  return { page, limit, total };
}

@Injectable()
export class FollowsService {
  constructor(private readonly prisma: PrismaService) {}

  /*
   * 팔로우 생성
   */
  async createFollow(currentUserId: string, targetUserId: string) {
    // 자기 자신을 팔로우할 수 없음
    if (currentUserId === targetUserId) {
      throw new BadRequestException('자기 자신을 팔로우할 수 없습니다.');
    }

    //중복 여부 확인 (이미 팔로우 중인지)
    const existsingFollow = await this.prisma.follow.findUnique({
      where: {
        follower_id_followee_id: {
          follower_id: currentUserId,
          followee_id: targetUserId,
        },
      },
    });

    if (existsingFollow) {
      throw new ConflictException('이미 팔로우 중입니다.');
    }

    await this.prisma.follow.create({
      data: {
        follower_id: currentUserId,
        followee_id: targetUserId,
      },
    });

    // 통계 리턴해주면 프론트에서 바로 갱신
    return this.getStats(targetUserId);
  }

  /*
   * 언 팔로우
   */
  async unfollow(currentUserId: string, targetUserId: string) {
    if (currentUserId === targetUserId) {
      throw new BadRequestException('자기 자신을 팔로우할 수 없습니다.');
    }
    try {
      await this.prisma.follow.delete({
        where: {
          follower_id_followee_id: {
            follower_id: currentUserId,
            followee_id: targetUserId,
          },
        },
      });
    } catch (error) {
      throw new ConflictException('팔로우 관계가 존재하지 않습니다.');
    }
    return this.getStats(targetUserId);
  }

  async getFollowersOf(
    targetUserId: string,
    q: PaginationDto,
    viewerUserId?: string,
    fillWhenAnonymous = true
  ) {
    const page = Math.max(1, Number(q.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(q.limit) || 20));
    const skip = (page - 1) * limit;

    // 1) 프라미스들을 먼저 만들고(병렬 시작)
    const listP = this.prisma.follow.findMany({
      where: { followee_id: targetUserId },
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    const countP = this.prisma.follow.count({
      where: { followee_id: targetUserId },
    });

    const viewerFollowingsP = viewerUserId
      ? this.prisma.follow.findMany({
          where: { follower_id: viewerUserId },
          select: { followee_id: true },
        })
      : Promise.resolve([] as { followee_id: string }[]);

    const viewerFollowersP = viewerUserId
      ? this.prisma.follow.findMany({
          where: { followee_id: viewerUserId },
          select: { follower_id: true },
        })
      : Promise.resolve([] as { follower_id: string }[]);

    // 2) 개별 await → 타입 안전
    const edges = await listP;
    const total = await countP;
    const viewerFollowings = await viewerFollowingsP;
    const viewerFollowers = await viewerFollowersP;

    const viewerFollowingSet = new Set(
      viewerFollowings.map(f => f.followee_id)
    );
    const viewerFollowerSet = new Set(viewerFollowers.map(f => f.follower_id));

    const toFlags = (userId: string) => {
      if (!viewerUserId) {
        return fillWhenAnonymous
          ? {
              viewer_is_following: false,
              viewer_is_followed_by: false,
              isMutual: false,
            }
          : {
              viewer_is_following: undefined,
              viewer_is_followed_by: undefined,
              isMutual: undefined,
            };
      }
      const vf = viewerFollowingSet.has(userId);
      const vb = viewerFollowerSet.has(userId);
      return {
        viewer_is_following: vf,
        viewer_is_followed_by: vb,
        isMutual: vf && vb,
      };
    };

    const items: FollowUserSummary[] = edges.map(e => {
      const u = e.follower;
      return {
        id: u.id,
        username: u.username,
        ...toFlags(u.id),
      };
    });

    return {
      meta: makeMeta(total, page, limit),
      items,
    };
  }

  async getFollowingsOf(
    targetUserId: string,
    q: PaginationDto,
    viewerUserId?: string, // 비로그인 허용
    fillWhenAnonymous: boolean = true // 비로그인 시 false로 채울지(undefined로 숨길지)
  ) {
    const page = Math.max(1, Number(q.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(q.limit) || 20));
    const skip = (page - 1) * limit;

    // 1) 병렬 실행할 프라미스들 준비
    const listP = this.prisma.follow.findMany({
      where: { follower_id: targetUserId }, // target이 팔로우하는 사람들
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        followee: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    const countP = this.prisma.follow.count({
      where: { follower_id: targetUserId },
    });

    const viewerFollowingsP = viewerUserId
      ? this.prisma.follow.findMany({
          where: { follower_id: viewerUserId }, // viewer → X
          select: { followee_id: true },
        })
      : Promise.resolve([] as { followee_id: string }[]);

    const viewerFollowersP = viewerUserId
      ? this.prisma.follow.findMany({
          where: { followee_id: viewerUserId }, // X → viewer
          select: { follower_id: true },
        })
      : Promise.resolve([] as { follower_id: string }[]);

    // 2) 개별 await (타입 안정)
    const edges = await listP;
    const total = await countP;
    const viewerFollowings = await viewerFollowingsP;
    const viewerFollowers = await viewerFollowersP;

    // 3) viewer 기준 플래그 계산용 Set
    const viewerFollowingSet = new Set(
      viewerFollowings.map(f => f.followee_id)
    ); // viewer →
    const viewerFollowerSet = new Set(viewerFollowers.map(f => f.follower_id)); // → viewer

    const toFlags = (userId: string) => {
      if (!viewerUserId) {
        return fillWhenAnonymous
          ? {
              viewer_is_following: false,
              viewer_is_followed_by: false,
              isMutual: false,
            }
          : {
              viewer_is_following: undefined,
              viewer_is_followed_by: undefined,
              isMutual: undefined,
            };
      }
      const vf = viewerFollowingSet.has(userId); // viewer → user
      const vb = viewerFollowerSet.has(userId); // user → viewer
      return {
        viewer_is_following: vf,
        viewer_is_followed_by: vb,
        isMutual: vf && vb,
      };
    };

    // 4) 매핑
    const items: FollowUserSummary[] = edges.map(e => {
      const u = e.followee;
      return {
        id: u.id,
        username: u.username,
        ...toFlags(u.id),
      };
    });

    return {
      meta: makeMeta(total, page, limit),
      items,
    };
  }
  /*
   * 특정 유저의 팔로워/팔로잉 수 통계
   */
  async getStats(userId: string) {
    const [followersCount, followingsCount] = await this.prisma.$transaction([
      this.prisma.follow.count({ where: { followee_id: userId } }),
      this.prisma.follow.count({ where: { follower_id: userId } }),
    ]);
    return { userId, followersCount, followingsCount };
  }
}
