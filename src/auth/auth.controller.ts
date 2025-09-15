import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, CreateUserDto, LoginResponseDto } from './dto/auth.dto';
import { AuthenticatedUser } from '../auth/interfaces/auth.interface';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

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
    return await this.authService.create(body);
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

  /**
   *로그아웃
   */
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '사용자 로그아웃' })
  @ApiResponse({
    status: 200,
    description: '로그아웃 성공',
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
    type: ErrorResponseDto,
  })
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
  }
}
