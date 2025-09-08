import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { FollowsModule } from './modules/follows/follows.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

/**
 * Swagger 문서 생성을 위한 전용 모듈입니다.
 * 데이터베이스 연결이나 파일 시스템에 의존하는 모듈을 제외하고,
 * API 엔드포인트 문서화에 필요한 컨트롤러만 포함합니다.
 * PrismaService는 실제 데이터베이스 연결을 시도하므로 제외합니다.
 */
@Module({
  imports: [
    // API 엔드포인트가 정의된 모듈들을 포함합니다.
    AuthModule,
    UsersModule,
    FollowsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class SwaggerGenModule {}
