import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';

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
    console.log('Creating follow: ', currentUserId, '->', targetUserId);

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

    console.log('Follow created: ', currentUserId, '->', targetUserId);
    // 통계 리턴해주면 프론트에서 바로 갱신
    return this.getStats(targetUserId);
  }

  /*
   * 언 팔로우
   */
  async unfollow(currentUserId: string, targetUserId: string) {
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

  /*
   * 팔로워 목록 (나를 팔로우하는 사람들)
   * - followee_id = userId
   */
  async getFollowers(userId: string, { page = 1, limit = 20 }: PaginationDto) {
    const skip = (page - 1) * limit;
    const total = await this.prisma.$transaction([
      this.prisma.follow.count({ where: { followee_id: userId } }),
      this.prisma.follow.findMany({
        where: { followee_id: userId },
        skip,
        orderBy: { created_at: 'desc' },
        take: limit,
        include: {
          follower: {
            select: {
              id: true,
              username: true,
              email: true,
              created_at: true,
            },
          },
        },
      }),
    ]);

    const items = total[1].map(follow => follow.follower);
    return { total, page, limit, items };
  }

  /*
   * 팔로잉 목록 (내가 팔로우하는 사람들)
   * - follower_id = userId
   */
  async getFollowings(userId: string, { page = 1, limit = 20 }: PaginationDto) {
    const skip = (page - 1) * limit;
    const total = await this.prisma.$transaction([
      this.prisma.follow.count({ where: { follower_id: userId } }),
      this.prisma.follow.findMany({
        where: { follower_id: userId },
        skip,
        orderBy: { created_at: 'desc' },
        take: limit,
        include: {
          followee: {
            select: {
              id: true,
              username: true,
              email: true,
              created_at: true,
            },
          },
        },
      }),
    ]);

    const items = total[1].map(follow => follow.followee);
    return { total, page, limit, items };
  }

  /*
   * 팔로우 여부 확인: current -> target
   */
  async isFollowing(currentUserId: string, targetUserId: string) {
    const found = await this.prisma.follow.findUnique({
      where: {
        follower_id_followee_id: {
          follower_id: currentUserId,
          followee_id: targetUserId,
        },
      },
      select: { follower_id: true },
    });
    return { isFollowing: !!found };
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
