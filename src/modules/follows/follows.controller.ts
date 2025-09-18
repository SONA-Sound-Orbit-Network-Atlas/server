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
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import {
  CreateFollowDto,
  DeleteFollowDto,
  FollowersListResponseDto,
  FollowingsListResponseDto,
} from './dto/follows.dto';
import { User } from '../../auth/decorator/user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { OptionalJwtAuthGuard } from '../../auth/optional-jwt.guard';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';

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
  @Get(':targetId/followers')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: '상대 프로필의 팔로워 목록',
    description:
      '프로필 주인(:targetId)을 팔로우하는 사용자 목록을 반환합니다. ' +
      '로그인 사용자(viewer)가 전달되면 각 항목에 viewer 기준 플래그(viewer_is_following, viewer_is_followed_by, isMutual)가 포함됩니다.',
  })
  @ApiParam({
    name: 'targetId',
    description: '프로필 주인의 사용자 ID(예: 상대방 ID)',
    example: 'usr_target_01',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
    description: '페이지 번호(1-base)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 20,
    description: '페이지당 항목 수(최대 100)',
  })
  @ApiOkResponse({
    description: '조회 성공',
    schema: {
      example: {
        meta: { page: 1, limit: 20, total: 2 },
        items: [
          {
            id: 'usr_c',
            username: 'charlie',
            viewer_is_following: true, // 뷰어(A) → charlie 팔로우 중
            viewer_is_followed_by: false, // charlie → 뷰어(A) 팔로우 아님
            isMutual: false,
          },
          {
            id: 'usr_d',
            username: 'diana',
            viewer_is_following: true,
            viewer_is_followed_by: true, // diana → 뷰어(A) 팔로우 중
            isMutual: true, // 맞팔
          },
        ],
      },
    },
    type: FollowersListResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 (page/limit 등 검증 실패)',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '대상 사용자(:targetId) 없음',
    type: ErrorResponseDto,
  })
  getFollowersOf(
    @Param('targetId') targetId: string,
    @User('id') viewerId: string | undefined,
    @Query() q: PaginationDto
  ) {
    return this.followsService.getFollowersOf(targetId, q, viewerId, true); // 비로그인 false로 채움
  }

  @Get(':targetId/followings')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: '상대 프로필의 팔로잉 목록',
    description:
      '프로필 주인(:targetId)이 팔로우하는 사용자 목록을 반환합니다. ' +
      '로그인 사용자(viewer)가 전달되면 각 항목에 viewer 기준 플래그가 포함됩니다.',
  })
  @ApiParam({
    name: 'targetId',
    description: '프로필 주인의 사용자 ID(예: 상대방 ID)',
    example: 'usr_target_01',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
    description: '페이지 번호(1-base)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 20,
    description: '페이지당 항목 수(최대 100)',
  })
  @ApiOkResponse({
    description: '조회 성공',
    schema: {
      example: {
        meta: { page: 1, limit: 20, total: 1 },
        items: [
          {
            id: 'usr_e',
            username: 'edward',
            viewer_is_following: false, // 뷰어(A) → edward 팔로우 아님
            viewer_is_followed_by: true, // edward → 뷰어(A) 팔로우 중
            isMutual: false,
          },
        ],
      },
    },
    type: FollowingsListResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 (page/limit 등 검증 실패)',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '대상 사용자(:targetId) 없음',
    type: ErrorResponseDto,
  })
  getFollowingsOf(
    @Param('targetId') targetId: string,
    @User('id') viewerId: string | undefined,
    @Query() q: PaginationDto
  ) {
    return this.followsService.getFollowingsOf(targetId, q, viewerId, true);
  }
}
