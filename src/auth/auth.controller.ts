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
  ApiCreatedResponse,
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
  @ApiCreatedResponse({
    description: '회원가입 성공',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: '회원가입이 완료되었습니다.',
              description: '결과 메시지',
            },
            user: {
              type: 'object',
              description: '생성된 사용자 정보 (비밀번호 제외)',
              properties: {
                id: {
                  type: 'string',
                  example: 'usr_7h3x2k9q',
                  description: '사용자 고유 ID',
                },
                email: {
                  type: 'string',
                  example: 'user@example.com',
                  description: '사용자 이메일',
                },
                username: {
                  type: 'string',
                  example: 'username123',
                  description: '사용자명',
                },
                created_at: {
                  type: 'string',
                  format: 'date-time',
                  example: '2025-09-18T10:00:00.000Z',
                  description: '계정 생성 시각',
                },
                updated_at: {
                  type: 'string',
                  format: 'date-time',
                  example: '2025-09-18T10:00:00.000Z',
                  description: '마지막 수정 시각',
                },
              },
              required: ['id', 'email', 'username', 'created_at', 'updated_at'],
            },
          },
          required: ['message', 'user'],
        },
        example: {
          message: '회원가입이 완료되었습니다.',
          user: {
            id: 'usr_7h3x2k9q',
            email: 'user@example.com',
            username: 'username123',
            created_at: '2025-09-18T10:00:00.000Z',
            updated_at: '2025-09-18T10:00:00.000Z',
          },
        },
      },
    },
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
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 'usr_12345',
          email: 'test@example.com',
          username: 'testuser',
          about: '안녕하세요, 저는 사용자입니다.',
          created_at: '2025-09-18T10:00:00.000Z',
          updated_at: '2025-09-18T10:30:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 (형식 오류)',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: '로그인 실패 (사용자 없음/비밀번호 불일치)',
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
