import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// 실제 모듈들을 import하되, PrismaService만 Mock으로 대체
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { FollowsModule } from './modules/follows/follows.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

// 최소한의 Mock PrismaService
class MockPrismaService {
  async onModuleInit() {
    console.log('Mock PrismaService: 데이터베이스 연결 건너뜀');
  }
  
  async onModuleDestroy() {
    console.log('Mock PrismaService: 데이터베이스 연결 해제 건너뜀');
  }

  enableShutdownHooks() {
    // 아무것도 하지 않음
  }

  // 필요한 경우 실제 메서드들을 빈 구현으로 추가
  get user() { return {}; }
  get follow() { return {}; }
  get galaxy() { return {}; }
  get stellarSystem() { return {}; }
  get planet() { return {}; }
  get pattern() { return {}; }
  get like() { return {}; }
  get notification() { return {}; }
  get $transaction() { return async () => {}; }
}

/**
 * Swagger 문서 생성을 위한 전용 모듈입니다.
 * 실제 모듈들을 import하되, 전역적으로 PrismaService만 Mock으로 대체하여
 * 데이터베이스 연결 없이 실제 API 메타데이터를 추출합니다.
 */
@Module({
  imports: [
    // 환경 변수 설정 (일부 서비스에서 필요할 수 있음)
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: true, // CI 환경에서 .env 파일 무시
      load: [
        () => ({
          JWT_SECRET: 'mock-secret-for-swagger',
          JWT_EXPIRES_IN: '24h',
        }),
      ],
    }),
    // 실제 모듈들을 그대로 import
    AuthModule,
    UsersModule,
    FollowsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // 전역적으로 PrismaService를 Mock으로 대체
    {
      provide: PrismaService,
      useClass: MockPrismaService,
    },
  ],
})
export class SwaggerGenModule {}
