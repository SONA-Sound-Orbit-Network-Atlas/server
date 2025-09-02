import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import {
  UserResponseDto,
  UpdateUsernameDto,
  UpdatePasswordDto,
  DeleteAccountDto,
  GetUsersQueryDto,
  CreateAboutDto,
} from './dto/user.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { User } from 'src/auth/decorator/user.decorator';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';

/**
 * 사용자 관리 API 컨트롤러
 */
@ApiTags('사용자 정보 관리')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * 사용자 정보
   */
  @Get('/profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 정보 조회' })
  @ApiParam({
    name: 'id',
    description: '사용자 ID',
    example: 'clp123abc456def',
  })
  @ApiResponse({
    status: 200,
    description: '사용자 조회 성공',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '사용자를 찾을 수 없음',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
    type: ErrorResponseDto,
  })
  async getProfile(@User('id') id: string) {
    return this.usersService.getProfile(id);
  }

  /**
   * 사용자 이름 수정
   */
  @Patch('/username')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '사용자 이름 수정' })
  @ApiParam({
    name: 'id',
    description: '사용자 ID',
    example: 'clp123abc456def',
  })
  @ApiResponse({
    status: 200,
    description: '사용자 정보 수정 성공',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '사용자를 찾을 수 없음',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: '사용자명 중복',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
    type: ErrorResponseDto,
  })
  async update(
    @User('id') id: string,
    @Body() UpdateUsernameDto: UpdateUsernameDto
  ) {
    return this.usersService.updateUsername(id, UpdateUsernameDto);
  }

  /**
   * 비밀번호 변경
   */
  @Patch('/password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '비밀번호 변경' })
  @ApiParam({
    name: 'id',
    description: '사용자 ID',
    example: 'clp123abc456def',
  })
  @ApiResponse({
    status: 200,
    description: '비밀번호 변경 성공',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '사용자를 찾을 수 없음',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: '현재 비밀번호 불일치',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
    type: ErrorResponseDto,
  })
  async updatePassword(
    @User('id') id: string,
    @Body() updatePasswordDto: UpdatePasswordDto
  ) {
    return this.usersService.updatePassword(id, updatePasswordDto);
  }

  /**
   * 사용자 삭제
   */
  @Delete()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '회원 탈퇴' })
  @ApiParam({
    name: 'id',
    description: '사용자 ID',
    example: 'clp123abc456def',
  })
  @ApiResponse({
    status: 204,
    description: '회원 탈퇴 성공',
  })
  @ApiResponse({
    status: 404,
    description: '사용자를 찾을 수 없음',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: '비밀번호 불일치',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
    type: ErrorResponseDto,
  })
  async deleteAccount(
    @User('id') id: string,
    @Body() deleteAccountDto: DeleteAccountDto
  ) {
    return this.usersService.deleteAccount(id, deleteAccountDto);
  }

  /**
   * 특정 사용자 정보 조회
   */
  @Get(':userId/profile')
  @ApiOperation({ summary: '특정 사용자 정보 조회' })
  @ApiResponse({
    status: 200,
    description: '사용자 조회 성공',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '사용자를 찾을 수 없음',
    type: ErrorResponseDto,
  })
  async getUserProfile(@Param('userId') userId: string) {
    return this.usersService.getProfile(userId);
  }

  /*
   * 자기 소개 작성 + 수정
   */
  @Patch('/about')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '자기 소개 작성/수정' })
  @ApiParam({
    name: 'id',
    description: '사용자 ID',
    example: 'clp123abc456def',
  })
  @ApiResponse({
    status: 200,
    description: '자기 소개 작성/수정 성공',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '사용자를 찾을 수 없음',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
    type: ErrorResponseDto,
  })
  async createOrUpdateAbout(
    @User('id') id: string,
    @Body() createAboutDto: CreateAboutDto
  ) {
    return this.usersService.createAbout(id, createAboutDto);
  }

  /**
   * 모든 사용자 조회
   */
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: '사용자 목록 조회' })
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
  @ApiQuery({
    name: 'search',
    required: false,
    description: '사용자명/이메일 검색',
    example: 'john',
  })
  @ApiResponse({
    status: 200,
    description: '사용자 목록 조회 성공',
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
    type: ErrorResponseDto,
  })
  async findAll(@Query() query: GetUsersQueryDto) {
    return this.usersService.findAllUsers(query);
  }
}
