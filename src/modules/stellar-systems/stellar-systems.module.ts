import { Module } from '@nestjs/common';
import { StellarSystemService } from './stellar-systems.service';
import { StellarSystemController } from './stellar-systems.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [StellarSystemController],
  providers: [StellarSystemService, PrismaService],
  exports: [StellarSystemService],
})
export class StellarSystemModule {}
