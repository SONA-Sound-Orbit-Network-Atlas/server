// scripts/copy-swagger-ui.ts
// swagger-ui-dist 패키지의 정적 파일을 복사하고 기본 Swagger UI 설정으로 index.html 생성
// CI/CD 환경과 로컬 환경 모두에서 안정적으로 동작하도록 절대 경로 사용

import * as fs from 'fs-extra';
import * as path from 'path';

// CI/CD 환경과 로컬 환경 모두에서 안정적으로 동작하도록 절대 경로를 사용합니다.
const projectRoot = process.cwd();
const swaggerUiDistPath = path.dirname(
  require.resolve('swagger-ui-dist/package.json')
);
const sourcePath = swaggerUiDistPath;
const targetPath = path.join(projectRoot, 'swagger-ui');
const swaggerJsonPath = path.join(projectRoot, 'swagger.json');

async function copySwaggerUI() {
  try {
    console.log('Swagger UI 파일 복사를 시작합니다...');
    console.log(`소스 경로: ${sourcePath}`);
    console.log(`대상 경로: ${targetPath}`);

    // swagger.json 파일이 존재하는지 확인합니다.
    if (!fs.existsSync(swaggerJsonPath)) {
      console.error(
        'swagger.json이 존재하지 않습니다. 먼저 npm run export:swagger를 실행하세요.'
      );
      process.exit(1);
    }

    // 기존 swagger-ui 폴더가 있다면 삭제합니다.
    await fs.remove(targetPath);
    console.log('기존 swagger-ui 폴더를 삭제했습니다.');

    // swagger-ui-dist의 모든 파일을 swagger-ui 폴더로 복사합니다.
    await fs.copy(sourcePath, targetPath);
    console.log('Swagger UI 파일 복사를 완료했습니다.');

    // swagger.json을 로드하도록 index.html 파일을 수정합니다.
    const indexPath = path.join(targetPath, 'index.html');
    console.log(`index.html 파일 경로: ${indexPath}`);

    let indexContent = await fs.readFile(indexPath, 'utf8');
    console.log('index.html 파일을 읽었습니다.');

    // Petstore URL을 우리 swagger.json으로 변경합니다.
    indexContent = indexContent.replace(
      'https://petstore.swagger.io/v2/swagger.json',
      './swagger.json'
    );
    // URL 패턴도 변경합니다.
    indexContent = indexContent.replace(/url: ".*",/, 'url: "./swagger.json",');
    // 타이틀을 변경합니다.
    indexContent = indexContent.replace(
      '<title>Swagger UI</title>',
      '<title>SONA API Documentation</title>'
    );
    console.log('index.html 내용 수정을 완료했습니다.');

    await fs.writeFile(indexPath, indexContent, 'utf8');
    console.log('수정된 index.html 파일을 저장했습니다.');

    // swagger.json 파일을 swagger-ui 폴더로 복사합니다.
    await fs.copy(swaggerJsonPath, path.join(targetPath, 'swagger.json'));
    console.log('swagger.json 파일을 복사했습니다.');

    console.log('Swagger UI 준비가 완료되었습니다.');
  } catch (err) {
    console.error('Swagger UI 준비 중 오류 발생:', err);
    process.exit(1);
  }
}

copySwaggerUI().catch(err => {
  console.error('Swagger UI 복사 실패:', err);
  process.exit(1);
});
