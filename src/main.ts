import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import { createSwaggerConfig } from './config/swagger.config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { promises as fs } from 'fs';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS 설정 (프론트엔드와 연결을 위해)
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:5173'], // React/Vite 개발 서버
    credentials: true,
  });

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

  const root = process.env.UPLOAD_DIR || 'uploads';
  await fs.mkdir(join(process.cwd(), root), { recursive: true });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 SONA 서버가 http://localhost:${port} 에서 실행 중입니다.`);
  console.log(`📖 API 문서: http://localhost:${port}/api`);
}

bootstrap().catch(err => {
  // 초기 부트스트랩 실패 시 에러 로깅
  console.error('애플리케이션 부트스트랩 실패:', err);
});
