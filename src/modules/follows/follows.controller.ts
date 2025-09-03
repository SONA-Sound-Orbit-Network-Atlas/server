import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FollowsService } from './follows.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { CreateFollowDto, DeleteFollowDto } from './dto/follows.dto';
import { User } from 'src/auth/decorator/user.decorator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@ApiTags('팔로우 정보 관리')
@ApiBearerAuth()
@Controller('follows')
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  /*
   * 팔로우 생성
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '팔로우 생성' })
  @ApiResponse({ status: 201, description: '성공' })
  @ApiResponse({
    status: 400,
    description: '자기 자신 팔로우',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: '이미 팔로우 중',
    type: ErrorResponseDto,
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
  @Post('unfollow')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '언 팔로우' })
  @ApiResponse({ status: 200, description: '성공' })
  @ApiResponse({
    status: 400,
    description: '자기 자신 언팔로우',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: '팔로우하지 않은 사용자 언팔로우',
    type: ErrorResponseDto,
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
   * 본인 팔로우 팔로어 통계
   */
  @Get('me/stats')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '팔로우 팔로어 통계' })
  @ApiResponse({ status: 200, description: '성공' })
  @ApiResponse({
    status: 404,
    description: '사용자 없음',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: '서버 오류',
    type: ErrorResponseDto,
  })
  async getMyStats(@User('id') currentUserId: string) {
    return this.followsService.getStats(currentUserId);
  }

  /*
   * 특정 사용자 팔로우 팔로어 통계
   */
  @Get(':userId/stats')
  @ApiOperation({ summary: '특정 사용자 팔로우 팔로어 통계' })
  @ApiResponse({ status: 200, description: '성공' })
  @ApiResponse({
    status: 404,
    description: '사용자 없음',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: '서버 오류',
    type: ErrorResponseDto,
  })
  async getUserStats(@Param('userId') userId: string) {
    return this.followsService.getStats(userId);
  }

  /*
   * 나를 팔로어 목록
   */
  @Get('me/followers')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '나를 팔로워 목록' })
  @ApiResponse({ status: 200, description: '성공' })
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
  @ApiResponse({
    status: 500,
    description: '서버 오류',
    type: ErrorResponseDto,
  })
  async getMyFollowers(@User('id') me: string, @Query() q: PaginationDto) {
    return this.followsService.getFollowers(me, q);
  }

  /*
   * 내가 팔로잉하는 사람들 목록
   */
  @Get('me/followings')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '내가 팔로잉하는 사람들 목록' })
  @ApiResponse({ status: 200, description: '성공' })
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
  @ApiResponse({
    status: 500,
    description: '서버 오류',
    type: ErrorResponseDto,
  })
  async getMyFollowings(@User('id') me: string, @Query() q: PaginationDto) {
    return this.followsService.getFollowings(me, q);
  }

  /*
   * 특정 사용자 팔로어 목록
   */
  @Get(':userId/followers')
  @ApiOperation({ summary: '특정 사용자 팔로워 목록' })
  @ApiResponse({ status: 200, description: '성공' })
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
  @ApiResponse({
    status: 500,
    description: '서버 오류',
    type: ErrorResponseDto,
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
  @ApiResponse({ status: 200, description: '성공' })
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
  @ApiResponse({
    status: 500,
    description: '서버 오류',
    type: ErrorResponseDto,
  })
  async getUserFollowings(
    @Param('userId') userId: string,
    @Query() q: PaginationDto
  ) {
    return this.followsService.getFollowings(userId, q);
  }

  /*
   * UI 상태 결정을 빠르고 싸게 하기 위해 (Follow 버튼, 토글)
   * 리스트 기반 확인의 한계(페이지네이션/오버페치) 회피
   * 레이스 컨디션 최소화(팔로우/언팔 사이에 상태 틀어짐 방지, 단건 조회가 안정적)
   * (옵션) 관리/추천 등 서버 로직에서 두 사람 관계를 즉시 확인
   */
  @Get('me/relationship/:targetId')
  @UseGuards(JwtAuthGuard)
  async getMyRelationship(
    @User('id') me: string,
    @Param('targetId') targetId: string
  ) {
    const [following, followedBy] = await Promise.all([
      this.followsService.isFollowing(me, targetId), // me -> target
      this.followsService.isFollowing(targetId, me), // target -> me
    ]);
    return {
      following: following.isFollowing,
      followedBy: followedBy.isFollowing,
    };
  }
}
