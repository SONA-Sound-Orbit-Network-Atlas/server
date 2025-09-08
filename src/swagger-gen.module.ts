import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

// 실제 모듈들을 import하되, PrismaService만 Mock으로 대체
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { FollowsModule } from './modules/follows/follows.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

/**
 * 자동화된 Mock PrismaService
 * schema.prisma에서 모델을 동적으로 추출하여 생성하므로
 * 새로운 모델이 추가되어도 자동으로 인식합니다.
 *
 * PR 리뷰 의견 반영: 수동 관리 방식 제거로 유지보수 부담 해결
 */
class MockPrismaService {
  constructor() {
    console.log('[MockPrismaService] 자동화된 Mock 서비스 초기화 중...');
    this.initializeMockModels();
  }

  onModuleInit() {
    console.log('[MockPrismaService] 데이터베이스 연결 건너뜀 (Mock 모드)');
  }

  onModuleDestroy() {
    console.log(
      '[MockPrismaService] 데이터베이스 연결 해제 건너뜀 (Mock 모드)'
    );
  }

  enableShutdownHooks() {
    // Mock 환경에서는 아무것도 하지 않음
  }

  private initializeMockModels() {
    try {
      const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');

      if (fs.existsSync(schemaPath)) {
        const schemaContent = fs.readFileSync(schemaPath, 'utf8');
        const modelNames = this.extractModelNames(schemaContent);

        console.log(
          `[MockPrismaService] 자동 감지된 모델들: ${modelNames.join(', ')}`
        );

        // 각 모델에 대해 동적으로 getter 생성
        modelNames.forEach(modelName => {
          const camelCaseModelName = this.toCamelCase(modelName);
          this.createMockModel(camelCaseModelName);
        });
      } else {
        console.warn(
          '[MockPrismaService] schema.prisma 파일을 찾을 수 없습니다. 기본 모델들로 대체합니다.'
        );
        this.createDefaultMockModels();
      }
    } catch (error) {
      console.error('[MockPrismaService] 스키마 파싱 중 오류:', error);
      this.createDefaultMockModels();
    }
  }

  private extractModelNames(schemaContent: string): string[] {
    // schema.prisma에서 "model ModelName {" 패턴을 찾아 모델 이름 추출
    const modelRegex = /model\s+(\w+)\s*\{/g;
    const modelNames: string[] = [];
    let match: RegExpExecArray | null;

    while ((match = modelRegex.exec(schemaContent)) !== null) {
      if (match[1]) {
        modelNames.push(match[1]);
      }
    }

    return modelNames;
  }

  private toCamelCase(str: string): string {
    // PascalCase를 camelCase로 변환 (User -> user, StellarSystem -> stellarSystem)
    return str.charAt(0).toLowerCase() + str.slice(1);
  }

  private createMockModel(modelName: string) {
    // 각 모델에 대해 표준 Prisma 클라이언트 메서드들을 가진 Mock 객체 생성
    Object.defineProperty(this, modelName, {
      get: () => ({
        findMany: () => Promise.resolve([]),
        findUnique: () => Promise.resolve(null),
        findFirst: () => Promise.resolve(null),
        create: () => Promise.resolve({}),
        update: () => Promise.resolve({}),
        delete: () => Promise.resolve({}),
        upsert: () => Promise.resolve({}),
        count: () => Promise.resolve(0),
        aggregate: () => Promise.resolve({}),
        groupBy: () => Promise.resolve([]),
        findUniqueOrThrow: () => Promise.resolve({}),
        findFirstOrThrow: () => Promise.resolve({}),
        createMany: () => Promise.resolve({ count: 0 }),
        updateMany: () => Promise.resolve({ count: 0 }),
        deleteMany: () => Promise.resolve({ count: 0 }),
      }),
      enumerable: true,
      configurable: true,
    });
  }

  private createDefaultMockModels() {
    // schema.prisma 파싱 실패 시 기본 모델들로 대체
    const defaultModels = [
      'user',
      'galaxy',
      'stellarSystem',
      'planet',
      'pattern',
      'like',
      'follow',
      'notification',
    ];

    console.log(
      '[MockPrismaService] 기본 모델들로 초기화:',
      defaultModels.join(', ')
    );

    defaultModels.forEach(modelName => {
      this.createMockModel(modelName);
    });
  }

  // Prisma 클라이언트의 기본 메서드들
  $connect() {
    console.log('[MockPrismaService] Mock 데이터베이스 연결됨');
    return Promise.resolve();
  }

  $disconnect() {
    console.log('[MockPrismaService] Mock 데이터베이스 연결 해제됨');
    return Promise.resolve();
  }

  $transaction(fn: (prisma: any) => any) {
    console.log('[MockPrismaService] Mock 트랜잭션 실행');
    return Promise.resolve(fn(this));
  }

  $executeRaw() {
    return Promise.resolve(0);
  }

  $queryRaw() {
    return Promise.resolve([]);
  }

  $executeRawUnsafe() {
    return Promise.resolve(0);
  }

  $queryRawUnsafe() {
    return Promise.resolve([]);
  }
}

/**
 * Swagger 문서 생성을 위한 전용 모듈입니다.
 * 실제 모듈들을 import하되, 전역적으로 PrismaService만 Mock으로 대체하여
 * 데이터베이스 연결 없이 실제 API 메타데이터를 추출합니다.
 */
@Module({
  imports: [
    // 환경 변수 설정 (일부 서비스에서 필요할 수 있음)
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: true, // CI 환경에서 .env 파일 무시
      load: [
        () => ({
          JWT_SECRET: 'mock-secret-for-swagger',
          JWT_EXPIRES_IN: '24h',
        }),
      ],
    }),
    // 실제 모듈들을 그대로 import
    AuthModule,
    UsersModule,
    FollowsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // 전역적으로 PrismaService를 Mock으로 대체
    {
      provide: PrismaService,
      useClass: MockPrismaService,
    },
  ],
})
export class SwaggerGenModule {}
