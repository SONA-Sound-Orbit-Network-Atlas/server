import { Controller, Post, Body, HttpCode, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, LoginResponseDto } from './dto/auth.dto';
import { AuthenticatedUser } from '../users/interfaces/user.interface';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';

/**
 * 사용자 인증 관련 API 컨트롤러
 */
@ApiTags('인증')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 사용자 로그인
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '사용자 로그인' })
  @ApiResponse({ 
    status: 200, 
    description: '로그인 성공', 
    type: LoginResponseDto 
  })
  @ApiResponse({ 
    status: 401, 
    description: '로그인 실패', 
    type: ErrorResponseDto 
  })
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.authService.validateUser(
      loginDto.email, 
      loginDto.password
    );
    
    if (!user) {
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 올바르지 않습니다.'
      );
    }
    return this.authService.login(user);
  }

  /**
   * 사용자 회원가입
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '사용자 회원가입' })
  @ApiResponse({ 
    status: 201, 
    description: '회원가입 성공' 
  })
  @ApiResponse({ 
    status: 400, 
    description: '회원가입 실패', 
    type: ErrorResponseDto 
  })
  async register(@Body() registerDto: RegisterDto): Promise<{ message: string; user: AuthenticatedUser }> {
    try {
      const user = await this.authService.register(
        registerDto.email,
        registerDto.username,
        registerDto.password
      );
      return {
        message: '회원가입이 완료되었습니다.',
        user,
      };
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }
}
