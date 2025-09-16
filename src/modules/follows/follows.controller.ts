import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FollowsService } from './follows.service';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CreateFollowDto, DeleteFollowDto } from './dto/follows.dto';
import { User } from '../../auth/decorator/user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('팔로우 정보 관리')
@Controller('follows')
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  /*
   * 팔로우 생성
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '팔로우 생성' })
  @ApiBody({
    type: CreateFollowDto,
    examples: {
      normal: { value: { targetUserId: 'cmg_user_002' } },
    },
  })
  @ApiCreatedResponse({
    description: '성공 시 대상 유저의 최신 팔로잉/팔로워 통계',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            userId: { type: 'string', example: 'cmg_user_002' },
            followersCount: { type: 'integer', example: 12 },
            followingsCount: { type: 'integer', example: 8 },
          },
        },
        example: {
          userId: 'cmg_user_002',
          followersCount: 12,
          followingsCount: 8,
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: '자기 자신 팔로우',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            statusCode: { type: 'integer' },
            message: { type: 'string' },
            error: { type: 'string' },
          },
        },
        example: {
          statusCode: 400,
          message: '자기 자신을 팔로우할 수 없습니다.',
          error: 'Bad Request',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: '인증 실패',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            statusCode: { type: 'integer' },
            message: { type: 'string' },
            error: { type: 'string' },
          },
        },
        example: {
          statusCode: 401,
          message: '인증이 필요합니다.',
          error: 'Unauthorized',
        },
      },
    },
  })
  @ApiConflictResponse({
    description: '이미 팔로우 중',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            statusCode: { type: 'integer' },
            message: { type: 'string' },
            error: { type: 'string' },
          },
        },
        example: {
          statusCode: 409,
          message: '이미 팔로우 중입니다.',
          error: 'Conflict',
        },
      },
    },
  })
  async createFollow(
    @User('id') currentUserId: string,
    @Body() createFollowDto: CreateFollowDto
  ) {
    return this.followsService.createFollow(
      currentUserId,
      createFollowDto.targetUserId
    );
  }

  /*
   * 언 팔로우
   */
  @Delete()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '언 팔로우' })
  @ApiBody({
    type: DeleteFollowDto,
    examples: {
      normal: { value: { targetUserId: 'cmg_user_002' } },
    },
  })
  @ApiOkResponse({
    description: '성공 시 대상 유저의 최신 팔로잉/팔로워 통계',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            userId: { type: 'string', example: 'cmg_user_002' },
            followersCount: { type: 'integer', example: 11 },
            followingsCount: { type: 'integer', example: 8 },
          },
        },
        example: {
          userId: 'cmg_user_002',
          followersCount: 11,
          followingsCount: 8,
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: '자기 자신 언팔로우(의미 없음)',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            statusCode: { type: 'integer' },
            message: { type: 'string' },
            error: { type: 'string' },
          },
        },
        example: {
          statusCode: 400,
          message: '자기 자신을 팔로우할 수 없습니다.',
          error: 'Bad Request',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: '인증 실패',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            statusCode: { type: 'integer' },
            message: { type: 'string' },
            error: { type: 'string' },
          },
        },
        example: {
          statusCode: 401,
          message: '인증이 필요합니다.',
          error: 'Unauthorized',
        },
      },
    },
  })
  @ApiConflictResponse({
    description: '팔로우하지 않은 사용자 언팔로우',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            statusCode: { type: 'integer' },
            message: { type: 'string' },
            error: { type: 'string' },
          },
        },
        example: {
          statusCode: 409,
          message: '팔로우 관계가 존재하지 않습니다.',
          error: 'Conflict',
        },
      },
    },
  })
  async unfollow(
    @User('id') currentUserId: string,
    @Body() deleteFollowDto: DeleteFollowDto
  ) {
    return this.followsService.unfollow(
      currentUserId,
      deleteFollowDto.targetUserId
    );
  }

  /*
   * 본인 팔로우/팔로어 통계
   */
  @Get('me/count')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 팔로우/팔로어 통계' })
  @ApiOkResponse({
    description: '조회 성공',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            userId: { type: 'string', example: 'cmf_me_001' },
            followersCount: { type: 'integer', example: 5 },
            followingsCount: { type: 'integer', example: 7 },
          },
        },
        example: {
          userId: 'cmf_me_001',
          followersCount: 5,
          followingsCount: 7,
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: '인증 실패',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            statusCode: { type: 'integer' },
            message: { type: 'string' },
            error: { type: 'string' },
          },
        },
        example: {
          statusCode: 401,
          message: '인증이 필요합니다.',
          error: 'Unauthorized',
        },
      },
    },
  })
  async getMyStats(@User('id') currentUserId: string) {
    return this.followsService.getStats(currentUserId);
  }

  /*
   * 특정 사용자 팔로우/팔로어 통계
   */
  @Get(':userId/count')
  @ApiOperation({ summary: '특정 사용자 팔로우/팔로어 통계' })
  @ApiOkResponse({
    description: '조회 성공',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            userId: { type: 'string', example: 'cmg_user_002' },
            followersCount: { type: 'integer', example: 12 },
            followingsCount: { type: 'integer', example: 8 },
          },
        },
        example: {
          userId: 'cmg_user_002',
          followersCount: 12,
          followingsCount: 8,
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: '사용자 없음',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            statusCode: { type: 'integer' },
            message: { type: 'string' },
            error: { type: 'string' },
          },
        },
        example: {
          statusCode: 404,
          message: '사용자를 찾을 수 없습니다.',
          error: 'Not Found',
        },
      },
    },
  })
  async getUserStats(@Param('userId') userId: string) {
    return this.followsService.getStats(userId);
  }

  /*
   * 나를 팔로우하는 사람들 (팔로워 목록)
   */
  @Get('me/followers')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '나를 팔로워 목록' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: '페이지 번호',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '페이지당 항목 수',
    example: 20,
  })
  @ApiOkResponse({
    description: '조회 성공',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            meta: {
              type: 'object',
              properties: {
                page: { type: 'integer', example: 1 },
                limit: { type: 'integer', example: 20 },
                total: { type: 'integer', example: 132 },
              },
            },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'cmf_user_010' },
                  username: { type: 'string', example: 'yuna' },
                  email: { type: 'string', example: 'yuna@example.com' },
                  about: {
                    type: 'string',
                    nullable: true,
                    example: '안녕하세요',
                  },
                  created_at: {
                    type: 'string',
                    format: 'date-time',
                    example: '2025-09-12T09:10:11.000Z',
                  },
                  isMutual: { type: 'boolean', example: true },
                },
              },
            },
          },
        },
        examples: {
          normal: {
            summary: '정상 목록',
            value: {
              meta: { page: 1, limit: 20, total: 132 },
              items: [
                {
                  id: 'cmf_user_010',
                  username: 'yuna',
                  email: 'yuna@example.com',
                  about: '안녕하세요',
                  created_at: '2025-09-12T09:10:11.000Z',
                  isMutual: true,
                },
              ],
            },
          },
          empty: {
            summary: '빈 결과',
            value: { meta: { page: 1, limit: 20, total: 0 }, items: [] },
          },
        },
      },
    },
  })
  async getMyFollowers(@User('id') me: string, @Query() q: PaginationDto) {
    return this.followsService.getFollowers(me, q);
  }

  /*
   * 내가 팔로우하는 사람들 (팔로잉 목록)
   */
  @Get('me/followings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내가 팔로잉하는 사람들 목록' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: '페이지 번호',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '페이지당 항목 수',
    example: 20,
  })
  @ApiOkResponse({
    description: '조회 성공',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            meta: {
              type: 'object',
              properties: {
                page: { type: 'integer', example: 1 },
                limit: { type: 'integer', example: 20 },
                total: { type: 'integer', example: 25 },
              },
            },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'cmg_user_002' },
                  username: { type: 'string', example: 'geo' },
                  email: { type: 'string', example: 'geo@example.com' },
                  about: { type: 'string', nullable: true, example: null },
                  created_at: {
                    type: 'string',
                    format: 'date-time',
                    example: '2025-09-10T12:34:56.000Z',
                  },
                  isMutual: { type: 'boolean', example: false },
                },
              },
            },
          },
        },
        examples: {
          normal: {
            summary: '정상 목록',
            value: {
              meta: { page: 1, limit: 20, total: 25 },
              items: [
                {
                  id: 'cmg_user_002',
                  username: 'geo',
                  email: 'geo@example.com',
                  about: null,
                  created_at: '2025-09-10T12:34:56.000Z',
                  isMutual: false,
                },
              ],
            },
          },
          empty: {
            summary: '빈 결과',
            value: { meta: { page: 1, limit: 20, total: 0 }, items: [] },
          },
        },
      },
    },
  })
  async getMyFollowings(@User('id') me: string, @Query() q: PaginationDto) {
    return this.followsService.getFollowings(me, q);
  }

  /*
   * 특정 사용자 팔로워 목록
   */
  @Get(':userId/followers')
  @ApiOperation({ summary: '특정 사용자 팔로워 목록' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: '페이지 번호',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '페이지당 항목 수',
    example: 20,
  })
  @ApiOkResponse({
    description: '조회 성공',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            meta: {
              type: 'object',
              properties: {
                page: { type: 'integer', example: 1 },
                limit: { type: 'integer', example: 20 },
                total: { type: 'integer', example: 7 },
              },
            },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'cmf_user_003' },
                  username: { type: 'string', example: 'alice' },
                  email: { type: 'string', example: 'alice@example.com' },
                  about: { type: 'string', nullable: true, example: null },
                  created_at: {
                    type: 'string',
                    format: 'date-time',
                    example: '2025-09-13T08:00:00.000Z',
                  },
                  isMutual: { type: 'boolean', example: false },
                },
              },
            },
          },
        },
        example: {
          meta: { page: 1, limit: 20, total: 7 },
          items: [
            {
              id: 'cmf_user_003',
              username: 'alice',
              email: 'alice@example.com',
              about: null,
              created_at: '2025-09-13T08:00:00.000Z',
              isMutual: false,
            },
          ],
        },
      },
    },
  })
  async getUserFollowers(
    @Param('userId') userId: string,
    @Query() q: PaginationDto
  ) {
    return this.followsService.getFollowers(userId, q);
  }

  /*
   * 특정 사용자가 팔로잉하는 사람들 목록
   */
  @Get(':userId/followings')
  @ApiOperation({ summary: '특정 사용자 팔로잉 목록' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: '페이지 번호',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '페이지당 항목 수',
    example: 20,
  })
  @ApiOkResponse({
    description: '조회 성공',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            meta: {
              type: 'object',
              properties: {
                page: { type: 'integer', example: 1 },
                limit: { type: 'integer', example: 20 },
                total: { type: 'integer', example: 3 },
              },
            },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'cmh_user_099' },
                  username: { type: 'string', example: 'bob' },
                  email: { type: 'string', example: 'bob@example.com' },
                  about: {
                    type: 'string',
                    nullable: true,
                    example: '노래 좋아해요',
                  },
                  created_at: {
                    type: 'string',
                    format: 'date-time',
                    example: '2025-09-11T10:20:00.000Z',
                  },
                  isMutual: { type: 'boolean', example: true },
                },
              },
            },
          },
        },
        example: {
          meta: { page: 1, limit: 20, total: 3 },
          items: [
            {
              id: 'cmh_user_099',
              username: 'bob',
              email: 'bob@example.com',
              about: '노래 좋아해요',
              created_at: '2025-09-11T10:20:00.000Z',
              isMutual: true,
            },
          ],
        },
      },
    },
  })
  async getUserFollowings(
    @Param('userId') userId: string,
    @Query() q: PaginationDto
  ) {
    return this.followsService.getFollowings(userId, q);
  }
}
