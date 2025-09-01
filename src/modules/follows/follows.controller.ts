import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { FollowsService } from './follows.service';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { CreateFollowDto, DeleteFollowDto } from './dto/follows.dto';
import { User } from 'src/auth/decorator/user.decorator';

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
  @ApiResponse({
    status: 400,
    description: '자기 자신 팔로우',
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
  @ApiResponse({
    status: 400,
    description: '자기 자신 언팔로우',
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
   * 팔로우 팔로어 통계
   */
  @Get('stats')
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
  async getStats(@User('id') currentUserId: string) {
    return this.followsService.getStats(currentUserId);
  }
}
