import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { User, AuthenticatedUser } from '../users/interfaces/user.interface';
import { LoginResponse, JwtPayload } from './interfaces/auth.interface';

/**
 * 사용자 인증을 처리하는 서비스
 * JWT 토큰 발급, 비밀번호 검증 등을 담당
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * 사용자 로그인 검증
   */
  async validateUser(
    email: string,
    password: string,
  ): Promise<AuthenticatedUser | null> {
    const user = (await this.prisma.user.findUnique({
      where: { email },
    })) as User;

    if (user && (await bcrypt.compare(password, user.password))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...result } = user;
      return result;
    }
    return null;
  }

  /**
   * JWT 토큰 생성
   */
  async login(user: AuthenticatedUser): Promise<LoginResponse> {
    const payload: JwtPayload = {
      email: user.email,
      sub: user.id,
      username: user.username,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
    };
  }

  /**
   * 사용자 회원가입
   */
  async register(
    email: string,
    username: string,
    password: string,
  ): Promise<AuthenticatedUser> {
    // 이미 존재하는 이메일 확인
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new Error('이미 사용 중인 이메일입니다.');
    }

    // 이미 존재하는 사용자명 확인
    const existingUsername = await this.prisma.user.findUnique({
      where: { username },
    });
    if (existingUsername) {
      throw new Error('이미 사용 중인 사용자명입니다.');
    }

    // 비밀번호 해시
    const hashedPassword = await bcrypt.hash(password, 10);

    // 사용자 생성
    const user = (await this.prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
      },
    })) as User;

    // 비밀번호 제외하고 반환
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = user;
    return result;
  }
}
