// scripts/copy-swagger-ui.ts
// swagger-ui-dist 패키지의 정적 파일을 복사하고 기본 Swagger UI 설정으로 index.html 생성
// 원래 /api 엔드포인트에서 보던 것과 동일한 UI 제공

import * as fs from 'fs';
import * as path from 'path';

const distDir = path.join(__dirname, '../swagger-ui');
const swaggerJsonPath = path.join(process.cwd(), 'swagger.json');

if (!fs.existsSync(swaggerJsonPath)) {
  console.error(
    'swagger.json 이 존재하지 않습니다. 먼저 npm run export:swagger 를 실행하세요.'
  );
  process.exit(1);
}

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// swagger-ui-dist 패키지 위치 찾기
let swaggerUiRoot: string;
try {
  swaggerUiRoot = path.dirname(require.resolve('swagger-ui-dist/package.json'));
} catch {
  console.error(
    'swagger-ui-dist 패키지를 찾을 수 없습니다. npm i swagger-ui-dist 를 먼저 실행하세요.'
  );
  process.exit(1);
}

// swagger-ui-dist의 모든 파일을 복사
const assets = fs.readdirSync(swaggerUiRoot).filter(f => !f.startsWith('.'));
assets.forEach(file => {
  const src = path.join(swaggerUiRoot, file);
  const dest = path.join(distDir, file);
  if (fs.lstatSync(src).isFile()) {
    fs.copyFileSync(src, dest);
  }
});

// 기본 index.html을 찾아서 수정 (swagger.json 경로만 변경)
const originalIndexPath = path.join(swaggerUiRoot, 'index.html');
if (fs.existsSync(originalIndexPath)) {
  let indexContent = fs.readFileSync(originalIndexPath, 'utf8');
  // 기본 petstore URL을 우리 swagger.json으로 변경
  indexContent = indexContent.replace(
    'https://petstore.swagger.io/v2/swagger.json',
    './swagger.json'
  );
  // 타이틀 변경
  indexContent = indexContent.replace(
    '<title>Swagger UI</title>',
    '<title>SONA API Documentation</title>'
  );
  fs.writeFileSync(path.join(distDir, 'index.html'), indexContent, {
    encoding: 'utf8',
  });
} else {
  console.error('swagger-ui-dist의 index.html을 찾을 수 없습니다.');
  process.exit(1);
}

// swagger.json 복사
fs.copyFileSync(swaggerJsonPath, path.join(distDir, 'swagger.json'));
console.log(
  'Swagger UI 준비 완료: 기본 Swagger UI 스타일로 swagger-ui 디렉토리 생성'
);
