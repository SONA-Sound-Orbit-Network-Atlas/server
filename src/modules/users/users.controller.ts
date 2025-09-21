import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiConsumes,
  ApiBody,
  ApiOkResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import {
  UserResponseDto,
  UpdatePasswordDto,
  DeleteAccountDto,
  GetUsersQueryDto,
  UpdateProfileDto,
} from './dto/user.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { User } from '../../auth/decorator/user.decorator';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { ImageFileParsePipe } from './images/image-file.pipe';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

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
   * 사용자 이름 + 자기소개 변경
   */
  @Put('/profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '프로필 수정(About, Username)' })
  @ApiParam({
    name: 'id',
    description: '사용자 ID',
    example: 'clp123abc456def',
  })
  @ApiOkResponse({
    description: '프로필 수정 성공',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: '프로필이 성공적으로 수정되었습니다.',
        },
        user: { $ref: getSchemaPath(UserResponseDto) },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 (수정할 필드 없음 / 형식 오류)',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: '중복 사용자명',
    type: ErrorResponseDto,
  })
  updateProfile(@User('id') userId: string, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(userId, dto);
  }

  /**
   * 비밀번호 변경
   */
  @Patch('/password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '비밀번호 변경' })
  @ApiOkResponse({
    description: '비밀번호 변경 성공',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: '비밀번호가 변경 되었습니다.' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '검증 실패(형식/길이 등)',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '사용자를 찾을 수 없습니다.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: '현재 비밀번호 불일치',
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
  @ApiBody({ type: DeleteAccountDto })
  @ApiOkResponse({
    description: '회원 탈퇴 성공',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: '회원탈퇴가 정상적으로 처리되었습니다.',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '검증 실패(비밀번호 형식 등)',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
    type: ErrorResponseDto,
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
   * 프로필 이미지 업로드/교체
   */
  @Post('me/img')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '프로필 이미지 업로드/교체' })
  @ApiOkResponse({
    description: '이미지 등록 성공',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: '프로필 이미지가 업데이트되었습니다.',
        },
        image: {
          type: 'string',
          example: 'https://cdn.example.com/users/usr_123/avatar_20250916.png',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
    type: ErrorResponseDto,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { img: { type: 'string', format: 'binary' } },
      required: ['img'],
    },
  })
  @UseInterceptors(FileInterceptor('img', { storage: memoryStorage() }))
  async uploadAvatar(
    @User('id') userId: string,
    @UploadedFile(new ImageFileParsePipe()) file: Express.Multer.File
  ) {
    return this.usersService.uploadImage(userId, file);
  }

  /*
   * 프로필 이미지 삭제
   */
  @Delete('me/img')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '프로필 이미지 삭제' })
  @ApiOkResponse({
    description: '이미지 삭제 성공',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: '프로필 이미지가 삭제되었습니다.' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '사용자를 찾을 수 없음',
    type: ErrorResponseDto,
  })
  async removeImage(@User('id') userId: string) {
    return this.usersService.removeImage(userId);
  }

  /**
   * 모든 사용자 조회
   */
  @Get()
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
  @ApiResponse({
    status: 200,
    description: '사용자 목록 조회 성공',
  })
  async findAll(@Query() query: GetUsersQueryDto) {
    return this.usersService.findAllUsers(query);
  }
}
