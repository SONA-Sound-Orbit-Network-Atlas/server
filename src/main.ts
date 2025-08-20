import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

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

  // Swagger 문서 설정
  const config = new DocumentBuilder()
    .setTitle('SONA API')
    .setDescription('SONA 프로젝트 - 음악적 우주 생성 플랫폼 API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 SONA 서버가 http://localhost:${port} 에서 실행 중입니다.`);
  console.log(`📖 API 문서: http://localhost:${port}/api`);
}

bootstrap();
