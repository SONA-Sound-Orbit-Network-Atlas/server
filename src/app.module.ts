import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PrismaService } from './prisma/prisma.service';
import { FollowsModule } from './modules/follows/follows.module';

/**
 * SONA 애플리케이션의 루트 모듈
 * 모든 모듈과 서비스를 연결합니다.
 */
@Module({
  imports: [
    // 환경변수 설정
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // 인증 모듈
    AuthModule,
    // 사용자 모듈
    UsersModule,
    FollowsModule,
    // TODO: 추후 추가될 모듈들
    // GalaxiesModule,
    // StellarSystemsModule,
    // PlanetsModule,
    // ...
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
