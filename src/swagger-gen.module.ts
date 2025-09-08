import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { FollowsModule } from './modules/follows/follows.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

/**
 * Swagger 문서 생성을 위한 전용 모듈입니다.
 * ServeStaticModule과 같이 런타임에만 필요하고,
 * 파일 시스템에 의존하는 모듈을 제외합니다.
 */
@Module({
  imports: [
    // 환경변수 설정은 필요하므로 포함합니다.
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // API 엔드포인트가 정의된 모듈들을 포함합니다.
    AuthModule,
    UsersModule,
    FollowsModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class SwaggerGenModule {}
