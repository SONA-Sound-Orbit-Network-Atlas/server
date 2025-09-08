import { Module, Global } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { FollowsModule } from './modules/follows/follows.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

// Swagger 문서 생성용 Mock PrismaService
// 데이터베이스 연결 없이 의존성 주입만 해결합니다.
class MockPrismaService {
  // onModuleInit을 빈 함수로 만들어 데이터베이스 연결을 하지 않습니다.
  async onModuleInit() {
    console.log('Mock PrismaService: 데이터베이스 연결 건너뜀');
  }
  
  async onModuleDestroy() {
    console.log('Mock PrismaService: 데이터베이스 연결 해제 건너뜀');
  }

  // 필요시 다른 메서드들도 빈 함수로 추가할 수 있습니다.
  enableShutdownHooks() {
    // 아무것도 하지 않음
  }
}

// 전역 Mock 모듈
@Global()
@Module({
  providers: [
    {
      provide: PrismaService,
      useClass: MockPrismaService,
    },
  ],
  exports: [PrismaService],
})
class MockPrismaModule {}

/**
 * Swagger 문서 생성을 위한 전용 모듈입니다.
 * 실제 컨트롤러와 서비스를 사용하되, PrismaService만 Mock으로 대체하여
 * 데이터베이스 연결 없이 API 메타데이터만 추출합니다.
 */
@Module({
  imports: [
    // Mock PrismaService를 전역적으로 적용
    MockPrismaModule,
    // API 엔드포인트가 정의된 모듈들을 포함합니다.
    AuthModule,
    UsersModule,
    FollowsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class SwaggerGenModule {}
