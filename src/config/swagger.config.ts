// swagger.config.ts - Swagger 설정 모듈
// 이 파일은 Swagger 문서를 생성할 때 재사용 가능한 설정을 제공합니다.
// GitHub Actions 등을 통해 swagger.json을 export 할 때도 동일한 설정을 사용합니다.

import { DocumentBuilder } from '@nestjs/swagger';

// Swagger 설정을 함수로 분리하여 main.ts, export 스크립트 모두에서 재사용
export function createSwaggerConfig() {
  // DocumentBuilder 를 사용해 기본 메타데이터 설정
  return new DocumentBuilder()
    .setTitle('SONA API') // 문서 제목
    .setDescription('SONA 프로젝트 - 음악적 우주 생성 플랫폼 API 문서') // 설명 (한글로 작성 지침 준수)
    .setVersion('1.0.0') // 버전
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT 액세스 토큰을 입력하세요.',
      },
      'access-token'
    )
    .build();
}
