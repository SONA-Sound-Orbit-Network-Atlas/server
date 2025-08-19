import {
  INestApplication,
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Prisma 데이터베이스 연결을 관리하는 서비스
 * 애플리케이션 시작 시 연결하고 종료 시 정리합니다.
 */
@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly client: PrismaClient;

  constructor() {
    this.client = new PrismaClient();
  }

  // PrismaClient의 모든 모델에 대한 접근자를 제공합니다
  get user() {
    return this.client.user;
  }

  get galaxy() {
    return this.client.galaxy;
  }

  get stellarSystem() {
    return this.client.stellarSystem;
  }

  get planet() {
    return this.client.planet;
  }

  get pattern() {
    return this.client.pattern;
  }

  get like() {
    return this.client.like;
  }

  get follow() {
    return this.client.follow;
  }

  get notification() {
    return this.client.notification;
  }

  // 트랜잭션 접근자
  get $transaction() {
    return this.client.$transaction.bind(this.client);
  }

  async onModuleInit(): Promise<void> {
    await this.client.$connect();
    console.log('✅ Prisma 데이터베이스 연결 완료');
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.$disconnect();
    console.log('🔌 Prisma 데이터베이스 연결 해제');
  }

  /**
   * 애플리케이션 종료 시 깔끔한 종료를 위한 후크 설정
   */
  enableShutdownHooks(app: INestApplication): void {
    process.on('beforeExit', () => {
      app.close().catch(console.error);
    });
  }
}
