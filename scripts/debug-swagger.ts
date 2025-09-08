// scripts/debug-swagger.ts
// Swagger JSON 생성 결과를 자세히 분석하여 Pet Store API 문제를 진단하는 스크립트

import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { SwaggerGenModule } from '../src/swagger-gen.module';
import { createSwaggerConfig } from '../src/config/swagger.config';
import * as fs from 'fs-extra';
import * as path from 'path';

async function debugSwaggerGeneration() {
  console.log('🔍 Swagger 문서 생성 디버깅을 시작합니다...\n');

  try {
    // 1. NestJS 애플리케이션 생성
    console.log('1️⃣ NestJS 애플리케이션 인스턴스 생성 중...');
    const app = await NestFactory.create(SwaggerGenModule, {
      logger: ['error', 'warn', 'log'],
    });
    console.log('✅ 애플리케이션 생성 완료\n');

    // 2. Swagger 설정 적용
    console.log('2️⃣ Swagger 설정 적용 중...');
    const swaggerConfig = createSwaggerConfig();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    console.log('✅ Swagger 문서 생성 완료\n');

    // 3. 생성된 문서 분석
    console.log('3️⃣ 생성된 Swagger 문서 분석 중...');
    console.log(`📋 API 타이틀: ${document.info?.title || 'N/A'}`);
    console.log(`📝 API 설명: ${document.info?.description || 'N/A'}`);
    console.log(`🔖 API 버전: ${document.info?.version || 'N/A'}\n`);

    // 4. 경로(Paths) 분석
    console.log('4️⃣ API 엔드포인트 분석:');
    const paths = document.paths || {};
    const pathKeys = Object.keys(paths);
    
    if (pathKeys.length === 0) {
      console.error('❌ 경고: API 엔드포인트가 하나도 발견되지 않았습니다!');
      console.log('   - 컨트롤러가 제대로 로드되지 않았을 가능성이 있습니다.');
      console.log('   - MockPrismaService 설정을 확인해주세요.\n');
    } else {
      console.log(`📊 총 ${pathKeys.length}개의 엔드포인트 발견:`);
      pathKeys.forEach(path => {
        const methods = Object.keys(paths[path] || {});
        console.log(`   ${path} (${methods.join(', ').toUpperCase()})`);
      });
      console.log('');
    }

    // 5. Pet Store 관련 확인
    console.log('5️⃣ Pet Store API 존재 여부 확인:');
    const hasPetStorePaths = pathKeys.some(
      path =>
        path.includes('/pet') ||
        path.includes('/store') ||
        path.includes('/user')
    );

    if (hasPetStorePaths) {
      console.error('❌ 경고: Pet Store API가 여전히 감지됨!');
      console.log('   Pet Store 관련 경로들:');
      pathKeys
        .filter(
          path =>
            path.includes('/pet') ||
            path.includes('/store') ||
            path.includes('/user')
        )
        .forEach(path => {
          console.log(`   - ${path}`);
        });
    } else {
      console.log('✅ Pet Store API가 감지되지 않음 (정상)');
    }
    console.log('');

    // 6. SONA 프로젝트 API 확인
    console.log('6️⃣ SONA 프로젝트 API 확인:');
    const expectedPaths = ['/auth', '/users', '/follows', '/galaxies', '/stellar-systems', '/planets'];
    const foundExpectedPaths = pathKeys.filter(path => 
      expectedPaths.some(expected => path.startsWith(expected))
    );
    
    if (foundExpectedPaths.length > 0) {
      console.log('✅ SONA 프로젝트 API 발견:');
      foundExpectedPaths.forEach(path => {
        console.log(`   - ${path}`);
      });
    } else {
      console.error('❌ 경고: SONA 프로젝트 API가 발견되지 않음!');
      console.log('   - 컨트롤러 데코레이터를 확인해주세요.');
      console.log('   - 모듈 import 상태를 확인해주세요.');
    }
    console.log('');

    // 7. 스키마 정보 확인
    console.log('7️⃣ 스키마 정보 확인:');
    const components = document.components || {};
    const schemas = components.schemas || {};
    const schemaKeys = Object.keys(schemas);
    
    console.log(`📋 총 ${schemaKeys.length}개의 스키마 발견:`);
    if (schemaKeys.length > 0) {
      schemaKeys.slice(0, 10).forEach(schema => {
        console.log(`   - ${schema}`);
      });
      if (schemaKeys.length > 10) {
        console.log(`   ... 그리고 ${schemaKeys.length - 10}개 더`);
      }
    }
    console.log('');

    // 8. JSON 파일 저장 및 검증
    console.log('8️⃣ JSON 파일 저장 및 검증:');
    const outputPath = path.join(process.cwd(), 'swagger-debug.json');
    await fs.writeFile(outputPath, JSON.stringify(document, null, 2), 'utf8');
    console.log(`✅ 디버그 파일 저장: ${outputPath}`);
    
    const fileSize = (await fs.stat(outputPath)).size;
    console.log(`📏 파일 크기: ${(fileSize / 1024).toFixed(2)} KB\n`);

    // 9. 결론 및 권장사항
    console.log('🎯 분석 결과 요약:');
    if (pathKeys.length === 0) {
      console.log('❌ 문제: API 엔드포인트가 생성되지 않음');
      console.log('   해결방안: SwaggerGenModule의 컨트롤러 import 확인');
    } else if (hasPetStorePaths) {
      console.log('❌ 문제: Pet Store API가 여전히 존재');
      console.log('   해결방안: copy-swagger-ui.ts의 URL 치환 로직 확인');
    } else if (foundExpectedPaths.length === 0) {
      console.log('❌ 문제: SONA 프로젝트 API가 누락됨');
      console.log('   해결방안: 컨트롤러 데코레이터 및 라우터 설정 확인');
    } else {
      console.log('✅ 정상: SONA 프로젝트 API가 올바르게 생성됨');
    }

    await app.close();
    console.log('\n🏁 디버깅 완료');

  } catch (error) {
    console.error('💥 Swagger 생성 중 오류 발생:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

debugSwaggerGeneration().catch(error => {
  console.error('스크립트 실행 실패:', error);
  process.exit(1);
});
