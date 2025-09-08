import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

// Controllers
import { AuthController } from './auth/auth.controller';
import { UsersController } from './modules/users/users.controller';
import { FollowsController } from './modules/follows/follows.controller';
import { AppController } from './app.controller';

// Services
import { AuthService } from './auth/auth.service';
import { UsersService } from './modules/users/users.service';
import { FollowsService } from './modules/follows/follows.service';
import { AppService } from './app.service';
import { JwtStrategy } from './auth/jwt.strategy';
import { LocalStorageService } from './modules/users/images/local-storage.service';

// Mock Services
import { PrismaService } from './prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

// 모든 서비스를 Mock으로 대체
class MockPrismaService {
  async onModuleInit() {
    console.log('Mock PrismaService: 데이터베이스 연결 건너뜀');
  }
  async onModuleDestroy() {
    console.log('Mock PrismaService: 데이터베이스 연결 해제 건너뜀');
  }
}

class MockJwtService {
  sign() { return 'mock-token'; }
  verify() { return { sub: 'mock-user' }; }
}

class MockConfigService {
  get(key: string) {
    const mockConfig = {
      'JWT_SECRET': 'mock-secret',
      'JWT_EXPIRES_IN': '24h',
    };
    return mockConfig[key] || 'mock-value';
  }
}

class MockAuthService {
  async create() { return { message: 'mock', user: {} }; }
  async login() { return { access_token: 'mock' }; }
}

class MockUsersService {
  async getProfile() { return {}; }
  async updateProfile() { return {}; }
  async updatePassword() { return { message: 'mock' }; }
  async deleteAccount() { return { message: 'mock' }; }
  async uploadImage() { return {}; }
  async removeImage() { return { message: 'mock' }; }
  async findAllUsers() { return { items: [], total: 0, page: 1, limit: 20 }; }
}

class MockFollowsService {
  async createFollow() { return {}; }
  async unfollow() { return {}; }
  async getFollowers() { return { items: [], total: 0, page: 1, limit: 20 }; }
  async getFollowings() { return { items: [], total: 0, page: 1, limit: 20 }; }
  async getStats() { return { followersCount: 0, followingsCount: 0 }; }
  async isFollowing() { return { isFollowing: false }; }
}

class MockJwtStrategy {
  async validate() { return { id: 'mock-user', email: 'mock@test.com' }; }
}

class MockLocalStorageService {
  async save() { return 'mock-path'; }
  async removeByRelPath() { return; }
}

/**
 * Swagger 문서 생성을 위한 전용 모듈입니다.
 * 실제 컨트롤러들을 직접 import하고 모든 서비스를 Mock으로 대체하여
 * 데이터베이스나 외부 의존성 없이 API 메타데이터만 추출합니다.
 */
@Module({
  imports: [
    // 필요한 모듈들을 간단히 설정
    PassportModule,
    JwtModule.register({
      secret: 'mock-secret',
      signOptions: { expiresIn: '24h' },
    }),
    MulterModule.register({ storage: memoryStorage() }),
  ],
  controllers: [
    AppController,
    AuthController,
    UsersController,
    FollowsController,
  ],
  providers: [
    // 모든 서비스를 Mock으로 대체
    { provide: AppService, useClass: AppService }, // AppService는 외부 의존성이 없으므로 그대로 사용
    { provide: AuthService, useClass: MockAuthService },
    { provide: UsersService, useClass: MockUsersService },
    { provide: FollowsService, useClass: MockFollowsService },
    { provide: JwtStrategy, useClass: MockJwtStrategy },
    { provide: LocalStorageService, useClass: MockLocalStorageService },
    { provide: PrismaService, useClass: MockPrismaService },
    { provide: JwtService, useClass: MockJwtService },
    { provide: ConfigService, useClass: MockConfigService },
  ],
})
export class SwaggerGenModule {}
