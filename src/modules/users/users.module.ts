import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { LocalStorageService } from './images/local-storage.service';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

/**
 * 사용자 관리 모듈
 * 사용자 CRUD 기능을 제공합니다.
 */
@Module({
  imports: [MulterModule.register({ storage: memoryStorage() })],
  controllers: [UsersController],
  providers: [UsersService, PrismaService, LocalStorageService],
  exports: [UsersService], // 다른 모듈에서 사용할 수 있도록 export
})
export class UsersModule {}
