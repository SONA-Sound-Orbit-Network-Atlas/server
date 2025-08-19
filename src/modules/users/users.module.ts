import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * 사용자 관리 모듈
 * 사용자 CRUD 기능을 제공합니다.
 */
@Module({
  controllers: [UsersController],
  providers: [UsersService, PrismaService],
  exports: [UsersService], // 다른 모듈에서 사용할 수 있도록 export
})
export class UsersModule {}
