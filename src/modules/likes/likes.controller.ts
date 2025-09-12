import { Body, Controller, Delete, Get, Post, Query } from '@nestjs/common';
import { LikesService } from './likes.service';
import {
  ApiBearerAuth,
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
  @ApiResponse({ status: 201, description: '성공' })
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
  @ApiResponse({ status: 200, description: '성공' })
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
  @ApiResponse({ status: 200, description: '성공' })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
    type: ErrorResponseDto,
  })
  async getMyLikedSystems(
    @User('id') userId: string,
    @Body() pagination: PaginationDto
  ) {
    return this.likesService.getMyLikes(userId, pagination);
  }

  /**
   * 특정 사용자가 좋아요 누른 항성계 목록 조회
   */
  @Get(':userId')
  @ApiOperation({ summary: '특정 사용자가 좋아요 누른 항성계 목록 조회' })
  @ApiResponse({ status: 200, description: '성공' })
  @ApiResponse({
    status: 404,
    description: '사용자 없음',
    type: ErrorResponseDto,
  })
  async getUserLikedSystems(
    @User('id') currentUserId: string,
    @Body() pagination: PaginationDto
  ) {
    return this.likesService.getSystemLikers(currentUserId, pagination);
  }

  /** 내가 좋아요 한 항성계 개수 조회 */
  @Get('me/count')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내가 좋아요 한 항성계 개수 조회' })
  @ApiResponse({ status: 200, description: '성공' })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
    type: ErrorResponseDto,
  })
  async getMyLikedSystemsCount(@User('id') userId: string) {
    return this.likesService.countMyLikedSystems(userId);
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
  async getLikeRankings(
    @Query() dto: PaginationDto & { rangk_type?: RangkType }
  ) {
    return this.likesService.getLikeRankings(dto);
  }
}
