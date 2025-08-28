import { Body, Controller, Post, UseGuards } from '@nestjs/common';
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
import { create } from 'domain';

@ApiTags('팔로우 정보 관리')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('follows')
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  /*
   * 팔로우 생성
   */
  @Post()
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
  @ApiOperation({ summary: '언 팔로우' })
  @ApiBadRequestResponse({
    description: '자기 자신 언팔로우',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
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
}
