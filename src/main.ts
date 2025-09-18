import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import { createSwaggerConfig } from './config/swagger.config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { promises as fs } from 'fs';
import { join, isAbsolute } from 'path';
import type { HttpsOptions as NestHttpsOptions } from '@nestjs/common/interfaces/external/https-options.interface';

// HTTPS 옵션 로더
// - 환경변수 SSL_CERT_PATH, SSL_KEY_PATH, SSL_CA_PATH 를 우선 사용
// - 없으면 프로젝트 루트의 ssl/cert.pem, ssl/key.pem 을 시도
// - 둘 다 없으면 undefined 반환하여 HTTP로 실행
async function loadHttpsOptions(): Promise<NestHttpsOptions | undefined> {
  // 환경변수에서 경로 로드
  const certPathEnv = process.env.SSL_CERT_PATH;
  const keyPathEnv = process.env.SSL_KEY_PATH;
  const caPathEnv = process.env.SSL_CA_PATH;

  // 기본 경로 (repo 내 ssl 폴더)
  const defaultCertPath = join(process.cwd(), 'ssl', 'cert.pem');
  const defaultKeyPath = join(process.cwd(), 'ssl', 'key.pem');

  // 실제 사용할 경로 선택
  const certPath =
    certPathEnv && certPathEnv.length > 0 ? certPathEnv : defaultCertPath;
  const keyPath =
    keyPathEnv && keyPathEnv.length > 0 ? keyPathEnv : defaultKeyPath;
  const caPath = caPathEnv && caPathEnv.length > 0 ? caPathEnv : undefined;

  // 파일 존재 확인 유틸
  const exists = async (p: string) => {
    try {
      await fs.access(p);
      return true;
    } catch {
      return false;
    }
  };

  const hasCert = await exists(certPath);
  const hasKey = await exists(keyPath);

  if (!hasCert || !hasKey) {
    return undefined;
  }

  const [cert, key, ca] = await Promise.all([
    fs.readFile(certPath),
    fs.readFile(keyPath),
    caPath ? fs.readFile(caPath) : Promise.resolve(undefined),
  ]);

  const options: NestHttpsOptions = {
    cert,
    key,
    ca,
  };
  return options;
}

async function bootstrap() {
  // HTTPS 가능 여부 확인 후 Nest 앱 생성
  const httpsOptions = await loadHttpsOptions();
  const app = await NestFactory.create(
    AppModule,
    httpsOptions ? { httpsOptions } : {}
  );

  // CORS 설정 (운영 도메인 환경변수로 동적 허용)
  // FRONTEND_URL="http://a.com,http://b.com" 형태 지원
  
  const frontendEnv = process.env.FRONTEND_URL || '';
  // 기본 오리진: 로컬 개발용. 프로덕션에서는 FRONTEND_URL 환경변수 사용 권장
  const defaultOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://localhost:3000',
    'https://localhost:5173',
  ];
  const origins = frontendEnv
    ? frontendEnv
        .split(',')
        .map(o => o.trim())
        .filter(Boolean)
    : defaultOrigins;
  app.enableCors({
    origin: origins,
    credentials: true,
  });
  // 프록시(nginx 등) 뒤에서 실행 시 클라이언트 IP 등 신뢰 설정이 필요할 수 있습니다.
  // ExpressAdapter 사용 시 아래 설정이 적용됩니다. (현재는 기본 어댑터)
  // (app.getHttpAdapter().getInstance() as any).set('trust proxy', 1);
  
  // 전역 파이프 설정 (유효성 검사)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // DTO에 정의되지 않은 속성 제거
      forbidNonWhitelisted: true, // 정의되지 않은 속성이 있으면 에러
      transform: true, // 타입 자동 변환
    })
  );

  // 전역 필터 및 인터셉터 설정
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Swagger 문서 설정 (재사용 설정 사용)
  const swaggerConfig = createSwaggerConfig();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  app.setGlobalPrefix('api');

  // 업로드 루트 경로: 절대 경로만 허용, 환경변수 없으면 서버 루트의 data/uploads 사용
  const fallbackUploadRoot = join(process.cwd(), 'data/uploads');
  const rootEnv = process.env.UPLOAD_DIR;
  const uploadRoot =
    rootEnv && isAbsolute(rootEnv) ? rootEnv : fallbackUploadRoot;
  await fs.mkdir(uploadRoot, { recursive: true });

  const port = Number(process.env.PORT || 3000);
  await app.listen(port);

  // 실행 모드/프로토콜 로그 (이모지 사용 금지 규칙 준수)
  const isHttps = Boolean(httpsOptions);
  const proto = isHttps ? 'https' : 'http';
  console.log(`SONA 서버가 ${proto}://localhost:${port} 에서 실행 중입니다.`);
  console.log(`Upload root: ${uploadRoot}`);
  console.log(`API 문서: ${proto}://localhost:${port}/api`);
}

bootstrap().catch(err => {
  // 초기 부트스트랩 실패 시 에러 로깅
  console.error('애플리케이션 부트스트랩 실패:', err);
});
