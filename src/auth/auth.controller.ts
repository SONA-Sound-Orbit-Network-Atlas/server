import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, CreateUserDto, LoginResponseDto } from './dto/auth.dto';
import { AuthenticatedUser } from '../auth/interfaces/auth.interface';
import { ErrorResponseDto } from '../common/dto/error-response.dto';

/**
 * 사용자 인증 관련 API 컨트롤러
 */
@ApiTags('인증 정보 관리')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 사용자 회원가입
   */
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '사용자 회원가입' })
  @ApiResponse({
    status: 201,
    description: '회원가입 성공',
  })
  @ApiResponse({
    status: 400,
    description: '회원가입 실패',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: '이메일 또는 사용자명 중복',
    type: ErrorResponseDto,
  })
  async register(
    @Body() body: CreateUserDto
  ): Promise<{ message: string; user: AuthenticatedUser }> {
    try {
      return await this.authService.create(body);
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }

  /**
   * 사용자 로그인
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '사용자 로그인' })
  @ApiResponse({
    status: 200,
    description: '로그인 성공',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: '로그인 실패',
    type: ErrorResponseDto,
  })
  async login(@Body() body: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(body);
  }
}
