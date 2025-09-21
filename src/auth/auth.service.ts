import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, LoginDto } from './dto/auth.dto';
import { AuthenticatedUser, LoginResponse } from './interfaces/auth.interface';
import * as bcrypt from 'bcryptjs';

/**
 * 사용자 인증을 처리하는 서비스
 * JWT 토큰 발급, 비밀번호 검증 등을 담당
 */

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  /**
   * 회원 가입
   **/
  async create(
    createUserDto: CreateUserDto
  ): Promise<{ message: string; user: AuthenticatedUser }> {
    // 이메일 중복 확인
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingEmail) {
      throw new ConflictException('이미 사용 중인 이메일입니다.');
    }

    // 사용자명 중복 확인
    const existingUsername = await this.prisma.user.findUnique({
      where: { username: createUserDto.username },
    });

    if (existingUsername) {
      throw new ConflictException('이미 사용 중인 사용자명입니다.');
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // 사용자 생성 (비밀번호 제외하고 반환)
    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        username: createUserDto.username,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        username: true,
        created_at: true,
        updated_at: true,
      },
    });

    return {
      user,
      message: '회원가입이 완료되었습니다.',
    };
  }

  /**
   * 로그인
   **/
  async login(loginDto: LoginDto): Promise<LoginResponse> {
    const identifier = loginDto.identifier?.trim();
    if (!identifier) {
      throw new BadRequestException('이메일 또는 사용자명을 입력해야 합니다.');
    }

    // 1. 사용자 찾기 (identifier가 이메일인지/사용자명인지 구분 안 하고 검색)
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
      },
    });

    if (!user) {
      throw new UnauthorizedException('로그인에 실패했습니다.');
    }

    // 2. 비밀번호 검증
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('로그인에 실패했습니다.');
    }

    // 3. JWT 토큰 생성
    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        about: user.about,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
    };
  }
}
