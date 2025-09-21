// scripts/export-swagger.ts - GitHub Actions 등 CI 환경에서 swagger.json 생성 스크립트
// 서버 전체를 listen 하지 않고 Nest 앱 인스턴스만 생성 후 Swagger 문서를 파일로 출력합니다.
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { writeFileSync } from 'fs';
import { SwaggerGenModule } from '../src/swagger-gen.module';
import { createSwaggerConfig } from '../src/config/swagger.config';

async function exportSwagger() {
  console.log('1. Swagger 문서 생성을 시작합니다...');

  console.log('2. NestFactory.create를 호출합니다...');
  const app = await NestFactory.create(SwaggerGenModule, { logger: false });
  console.log('3. Nest 애플리케이션 인스턴스 생성 완료.');

  console.log('4. Swagger 설정을 생성합니다...');
  const swaggerConfig = createSwaggerConfig();
  console.log('5. Swagger 설정 생성 완료.');

  console.log('6. Swagger 문서를 생성합니다...');
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  console.log('7. Swagger 문서 생성 완료.');

  console.log('8. swagger.json 파일로 저장합니다...');
  writeFileSync('swagger.json', JSON.stringify(document, null, 2), {
    encoding: 'utf8',
  });
  console.log('9. swagger.json 파일 저장 완료.');

  console.log('10. 애플리케이션을 종료합니다...');
  await app.close();
  console.log('11. 애플리케이션 종료 완료.');
}

exportSwagger().catch((err) => {
  console.error('Swagger export 실패:', err.stack || err);
  // NestJS 또는 HTTP 관련 오류일 경우, 상세 응답 내용을 출력합니다.
  if (err.response) {
    console.error('Error response:', JSON.stringify(err.response, null, 2));
  }
  process.exit(1);
});
