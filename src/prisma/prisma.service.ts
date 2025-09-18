import {
  INestApplication,
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

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

  get like() {
    return this.client.like;
  }

  get follow() {
    return this.client.follow;
  }

  get notification() {
    return this.client.notification;
  }

  // 트랜잭션: 콜백/배치(Array) 양쪽 오버로드 모두 지원
  $transaction<R>(fn: (tx: Prisma.TransactionClient) => Promise<R>): Promise<R>;
  $transaction<T extends Prisma.PrismaPromise<unknown>[]>(
    requests: [...T]
  ): Promise<{ [K in keyof T]: Awaited<T[K]> }>;
  $transaction(
    arg:
      | ((tx: Prisma.TransactionClient) => Promise<unknown>)
      | Prisma.PrismaPromise<unknown>[]
  ): Promise<unknown> {
    if (typeof arg === 'function') {
      const fn = arg as (tx: Prisma.TransactionClient) => Promise<unknown>;
      return this.client.$transaction(fn);
    }
    return this.client.$transaction(arg);
  }

  async onModuleInit(): Promise<void> {
    await this.client.$connect();
    console.log('✅ Prisma 데이터베이스 연결 완료');
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.$disconnect();
    console.log('🔌 Prisma 데이터베이스 연결 해제');
  }
  // --- $queryRaw (safe) ---
  $queryRaw<T = unknown>(query: Prisma.Sql): Promise<T>;
  $queryRaw<T = unknown>(
    query: TemplateStringsArray,
    ...values: any[]
  ): Promise<T>;
  $queryRaw<T = unknown>(
    query: Prisma.Sql | TemplateStringsArray,
    ...values: any[]
  ): Promise<T> {
    // PrismaClient의 원본 메서드로 위임
    return (this.client.$queryRaw as any)(query as any, ...values);
  }

  // --- $executeRaw (safe) ---
  $executeRaw(query: Prisma.Sql): Promise<number>;
  $executeRaw(query: TemplateStringsArray, ...values: any[]): Promise<number>;
  $executeRaw(
    query: Prisma.Sql | TemplateStringsArray,
    ...values: any[]
  ): Promise<number> {
    return (this.client.$executeRaw as any)(query as any, ...values);
  }

  // --- ⚠️ Unsafe: 문자열 직접 결합 금지 ---
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Promise<T> {
    return this.client.$queryRawUnsafe<T>(query, ...values);
  }
  $executeRawUnsafe(query: string, ...values: any[]): Promise<number> {
    return this.client.$executeRawUnsafe(query, ...values);
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
