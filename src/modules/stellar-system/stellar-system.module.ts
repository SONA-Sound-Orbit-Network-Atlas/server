import { Module } from '@nestjs/common';
import { StellarSystemService } from './stellar-system.service';
import { StellarSystemController } from './stellar-system.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [StellarSystemController],
  providers: [StellarSystemService, PrismaService],
  exports: [StellarSystemService],
})
export class StellarSystemModule {}
