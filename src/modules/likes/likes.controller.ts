import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { LikesService } from './likes.service';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { User } from '../../auth/decorator/user.decorator';
import { LikeTargetDto, RangkType } from './dto/likes.dto';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('좋아요 정보 관리')
@Controller('likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  /** 좋아요 생성 */
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '좋아요 생성' })
  @ApiCreatedResponse({
    description: '성공',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: { type: 'string', example: '좋아요가 생성되었습니다.' },
            like: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'like_01HZXA...' },
                user_id: { type: 'string', example: 'usr_me_001' },
                system_id: { type: 'string', example: 'sys_123' },
                created_at: {
                  type: 'string',
                  format: 'date-time',
                  example: '2025-09-16T12:00:00.000Z',
                },
              },
            },
          },
        },
        example: {
          message: '좋아요가 생성되었습니다.',
          like: {
            id: 'like_01HZXA...',
            user_id: 'usr_me_001',
            system_id: 'sys_123',
            created_at: '2025-09-16T12:00:00.000Z',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '대상 시스템을 찾을 수 없음',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: '이미 좋아요를 눌렀음',
    type: ErrorResponseDto,
  })
  async likeSystem(@User('id') userId: string, @Body() dto: LikeTargetDto) {
    return this.likesService.likeSystem(userId, dto);
  }

  /** 좋아요 취소 */
  @Delete()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '좋아요 취소' })
  @ApiOkResponse({
    description: '성공',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: { type: 'string', example: '좋아요가 삭제되었습니다.' },
          },
        },
        example: { message: '좋아요가 삭제되었습니다.' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '대상 시스템을 찾을 수 없음',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: '아직 좋아요를 누르지 않음',
    type: ErrorResponseDto,
  })
  async unlikeSystem(@User('id') userId: string, @Body() dto: LikeTargetDto) {
    return this.likesService.unlikeSystem(userId, dto);
  }

  /** 내가 좋아요 한 항성계 목록 조회 */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내가 좋아요 한 항성계 목록 조회' })
  @ApiOkResponse({
    description: '조회 성공',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  system: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', example: 'sys_123' },
                      title: {
                        type: 'string',
                        example: '켄타우루스 자리 알파',
                      },
                      galaxy_id: { type: 'string', example: 'gal_001' },
                      owner_id: { type: 'string', example: 'usr_owner_01' },
                      created_by_id: {
                        type: 'string',
                        example: 'usr_owner_01',
                      },
                      created_at: {
                        type: 'string',
                        format: 'date-time',
                        example: '2025-09-10T08:30:00.000Z',
                      },
                      updated_at: {
                        type: 'string',
                        format: 'date-time',
                        example: '2025-09-12T15:45:00.000Z',
                      },
                    },
                  },
                  planet_count: { type: 'integer', example: 5 },
                  liked_at: {
                    type: 'string',
                    format: 'date-time',
                    example: '2025-09-16T12:03:22.000Z',
                  },
                },
              },
            },
            meta: {
              type: 'object',
              properties: {
                page: { type: 'integer', example: 1 },
                limit: { type: 'integer', example: 20 },
                total: { type: 'integer', example: 132 },
              },
            },
          },
        },
        examples: {
          normal: {
            summary: '정상 목록',
            value: {
              data: [
                {
                  system: {
                    id: 'sys_123',
                    title: '켄타우루스 자리 알파',
                    galaxy_id: 'gal_001',
                    owner_id: 'usr_owner_01',
                    created_by_id: 'usr_owner_01',
                    created_at: '2025-09-10T08:30:00.000Z',
                    updated_at: '2025-09-12T15:45:00.000Z',
                  },
                  planet_count: 5,
                  liked_at: '2025-09-16T12:03:22.000Z',
                },
              ],
              meta: { page: 1, limit: 20, total: 132 },
            },
          },
          empty: {
            summary: '빈 결과',
            value: { data: [], meta: { page: 1, limit: 20, total: 0 } },
          },
        },
      },
    },
  })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
    description: '페이지 번호',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 20,
    description: '페이지당 항목 수',
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
    type: ErrorResponseDto,
  })
  async getMyLikedSystems(
    @User('id') userId: string,
    @Query() pagination: PaginationDto
  ) {
    return this.likesService.getMyLikes(userId, pagination);
  }

  /**
   * 좋아요 랭킹 (이번 주/이번 달/올해/랜덤)
   * - 비로그인도 호출 가능
   * - rank_type: week|month|year|random
   * - page/limit: PaginationDto 공통 규격
   */
  @Get('rankings')
  @ApiOperation({
    summary: '좋아요 랭킹 조회 (주/월/년/랜덤)',
    description:
      'KST 달력 기준으로 집계. rank_type이 random이면 무작위 시스템을 반환.',
  })
  @ApiQuery({
    name: 'rangk_type',
    required: false,
    enum: RangkType,
    example: RangkType.WEEK,
    description: '랭킹 유형 (week | month | year | random)',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiOkResponse({
    description: '조회 성공',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  system: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', example: 'sys_987' },
                      title: { type: 'string', example: '안드로메다-7' },
                      galaxy_id: { type: 'string', example: 'gal_777' },
                      owner_id: { type: 'string', example: 'usr_999' },
                      created_at: {
                        type: 'string',
                        format: 'date-time',
                        example: '2025-08-01T00:00:00.000Z',
                      },
                      updated_at: {
                        type: 'string',
                        format: 'date-time',
                        example: '2025-09-10T00:00:00.000Z',
                      },
                    },
                  },
                  like_count: { type: 'integer', example: 42 },
                  planet_count: { type: 'integer', example: 9 },
                  rank: { type: 'integer', example: 1 },
                },
              },
            },
            meta: {
              type: 'object',
              properties: {
                page: { type: 'integer', example: 1 },
                limit: { type: 'integer', example: 20 },
                total: { type: 'integer', example: 250 },
              },
            },
          },
        },
        example: {
          data: [
            {
              system: {
                id: 'sys_987',
                title: '안드로메다-7',
                galaxy_id: 'gal_777',
                owner_id: 'usr_999',
                created_at: '2025-08-01T00:00:00.000Z',
                updated_at: '2025-09-10T00:00:00.000Z',
              },
              like_count: 42,
              planet_count: 9,
              rank: 1,
            },
            {
              system: {
                id: 'sys_654',
                title: '페가수스-3',
                galaxy_id: 'gal_222',
                owner_id: 'usr_555',
                created_at: '2025-07-11T00:00:00.000Z',
                updated_at: '2025-09-09T00:00:00.000Z',
              },
              like_count: 37,
              planet_count: 6,
              rank: 2,
            },
          ],
          meta: { page: 1, limit: 20, total: 250 },
        },
      },
    },
  })
  async getLikeRankings(
    @Query() dto: PaginationDto & { rangk_type?: RangkType }
  ) {
    return this.likesService.getLikeRankings(dto);
  }

  /** 내가 좋아요 한 항성계 개수 조회 */
  @Get('me/count')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내가 좋아요 한 항성계 개수 조회' })
  @ApiOkResponse({
    description: '내가 좋아요 한 항성계 수',
    content: {
      'application/json': {
        schema: { type: 'integer', example: 17 },
        example: 17,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
    type: ErrorResponseDto,
  })
  async getMyLikedSystemsCount(@User('id') userId: string) {
    return this.likesService.countMyLikedSystems(userId);
  }

  /** 좋아요 랭킹  */
  @Get('rankings-top')
  @ApiOperation({ summary: '전체(올타임) 좋아요 Top 랭킹' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiOkResponse({
    description: '조회 성공',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  system: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', example: 'sys_TOP1' },
                      title: { type: 'string', example: '오리온-프라임' },
                      galaxy_id: { type: 'string', example: 'gal_TOP' },
                      owner_id: { type: 'string', example: 'usr_AAA' },
                      created_at: {
                        type: 'string',
                        format: 'date-time',
                        example: '2025-01-01T00:00:00.000Z',
                      },
                      updated_at: {
                        type: 'string',
                        format: 'date-time',
                        example: '2025-09-14T00:00:00.000Z',
                      },
                    },
                  },
                  like_count: { type: 'integer', example: 1234 },
                  planet_count: { type: 'integer', example: 12 },
                  rank: { type: 'integer', example: 1 },
                },
              },
            },
            meta: {
              type: 'object',
              properties: {
                page: { type: 'integer', example: 1 },
                limit: { type: 'integer', example: 20 },
                total: { type: 'integer', example: 1000 },
              },
            },
          },
        },
        example: {
          data: [
            {
              system: {
                id: 'sys_TOP1',
                title: '오리온-프라임',
                galaxy_id: 'gal_TOP',
                owner_id: 'usr_AAA',
                created_at: '2025-01-01T00:00:00.000Z',
                updated_at: '2025-09-14T00:00:00.000Z',
              },
              like_count: 1234,
              planet_count: 12,
              rank: 1,
            },
          ],
          meta: { page: 1, limit: 20, total: 1000 },
        },
      },
    },
  })
  async getTopLiked(@Query() dto: PaginationDto) {
    return this.likesService.getTopLikedSystems(dto);
  }

  /**
   * 특정 사용자가 좋아요 누른 항성계 목록 조회
   */
  @Get(':userId')
  @ApiOperation({ summary: '특정 사용자가 좋아요 누른 항성계 목록 조회' })
  @ApiOkResponse({
    description: '조회 성공',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  system: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', example: 'sys_777' },
                      title: { type: 'string', example: '카시오페이아-β' },
                      galaxy_id: { type: 'string', example: 'gal_900' },
                      owner_id: { type: 'string', example: 'usr_XYZ' },
                      created_by_id: { type: 'string', example: 'usr_XYZ' },
                      created_at: {
                        type: 'string',
                        format: 'date-time',
                        example: '2025-05-01T00:00:00.000Z',
                      },
                      updated_at: {
                        type: 'string',
                        format: 'date-time',
                        example: '2025-08-31T00:00:00.000Z',
                      },
                    },
                  },
                  planet_count: { type: 'integer', example: 3 },
                  liked_at: {
                    type: 'string',
                    format: 'date-time',
                    example: '2025-09-15T04:12:34.000Z',
                  },
                },
              },
            },
            meta: {
              type: 'object',
              properties: {
                page: { type: 'integer', example: 1 },
                limit: { type: 'integer', example: 20 },
                total: { type: 'integer', example: 12 },
              },
            },
          },
        },
        example: {
          data: [
            {
              system: {
                id: 'sys_777',
                title: '카시오페이아-β',
                galaxy_id: 'gal_900',
                owner_id: 'usr_XYZ',
                created_by_id: 'usr_XYZ',
                created_at: '2025-05-01T00:00:00.000Z',
                updated_at: '2025-08-31T00:00:00.000Z',
              },
              planet_count: 3,
              liked_at: '2025-09-15T04:12:34.000Z',
            },
          ],
          meta: { page: 1, limit: 20, total: 12 },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '사용자 없음',
    type: ErrorResponseDto,
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  async getUserLikedSystems(
    @Param('userId') userId: string,
    @Query() pagination: PaginationDto
  ) {
    return this.likesService.getMyLikes(userId, pagination);
  }
}
