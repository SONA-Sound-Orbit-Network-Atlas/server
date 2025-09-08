// scripts/export-swagger.ts - GitHub Actions 등 CI 환경에서 swagger.json 생성 스크립트
// 서버 전체를 listen 하지 않고 Nest 앱 인스턴스만 생성 후 Swagger 문서를 파일로 출력합니다.
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { writeFileSync } from 'fs';
import { AppModule } from '../src/app.module';
import { createSwaggerConfig } from '../src/config/swagger.config';

async function exportSwagger() {
  const app = await NestFactory.create(AppModule, { logger: false });
  const swaggerConfig = createSwaggerConfig();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  writeFileSync('swagger.json', JSON.stringify(document, null, 2), {
    encoding: 'utf8',
  });
  console.log('swagger.json 생성 완료');
  await app.close();
}

exportSwagger().catch(err => {
  console.error('Swagger export 실패:', err.stack || err);
  process.exit(1);
});
