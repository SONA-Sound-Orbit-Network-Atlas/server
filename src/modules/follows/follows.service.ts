import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { buildPaginationMeta } from '../../common/utils/pagination.util';

type FollowUserSummary = {
  id: string;
  username: string;
  email: string;
  about: string;
  created_at: Date;
  isMutual: boolean;
};


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
    try {
      if (currentUserId === targetUserId) {
        throw new BadRequestException('자기 자신을 팔로우할 수 없습니다.');
      }

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

  /*
   * 팔로워 목록 (나를 팔로우하는 사람들)
   * - followee_id = userId
   */
  async getFollowers(userId: string, pagenationDto: PaginationDto) {
    const page = Math.max(1, Number(pagenationDto.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(pagenationDto.limit) || 20));
    const skip = (page - 1) * limit;

    const [followers, myFollowings] = await this.prisma.$transaction([
      this.prisma.follow.findMany({
        where: { followee_id: userId },
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          follower: {
            select: {
              id: true,
              username: true,
              email: true,
              about: true,
              created_at: true,
            },
          },
        },
      }),
      // 내가 팔로우한 대상들(id) → 맞팔 판단용
      this.prisma.follow.findMany({
        where: { follower_id: userId },
        select: { followee_id: true },
      }),
    ]);

    const myFollowingSet = new Set(myFollowings.map(f => f.followee_id));

    const items: FollowUserSummary[] = followers.map(f => ({
      ...f.follower,
      isMutual: myFollowingSet.has(f.follower.id),
    }));

    const total = await this.prisma.follow.count({
      where: { followee_id: userId },
    });

    return {
      meta: buildPaginationMeta(total, pagenationDto),
      items,
    };
  }

  /*
   * 팔로잉 목록 (내가 팔로우하는 사람들)
   * - follower_id = userId
   */
  async getFollowings(userId: string, pagenationDto: PaginationDto) {
    const page = Math.max(1, Number(pagenationDto.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(pagenationDto.limit) || 20));
    const skip = (page - 1) * limit;

    const [followings, followersOfMe] = await this.prisma.$transaction([
      this.prisma.follow.findMany({
        where: { follower_id: userId },
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          followee: {
            select: {
              id: true,
              username: true,
              email: true,
              about: true,
              created_at: true,
            },
          },
        },
      }),
      // 내가 팔로우 하는 사람들 (id) -> 맞팔 판단용
      this.prisma.follow.findMany({
        where: { followee_id: userId },
        select: { follower_id: true },
      }),
    ]);

    const followersOfMeSet = new Set(followersOfMe.map(f => f.follower_id));

    const items: FollowUserSummary[] = followings.map(f => ({
      ...f.followee,
      isMutual: followersOfMeSet.has(f.followee.id),
    }));

    const total = await this.prisma.follow.count({
      where: { follower_id: userId },
    });

    return {
      meta: buildPaginationMeta(total, pagenationDto),
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
