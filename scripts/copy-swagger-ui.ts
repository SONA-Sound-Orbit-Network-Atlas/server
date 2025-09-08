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

import * as fs from 'fs-extra';
import * as path from 'path';

// CI/CD 환경과 로컬 환경 모두에서 안정적으로 동작하도록 절대 경로를 사용합니다.
const projectRoot = process.cwd();
const swaggerUiDistPath = path.dirname(
  require.resolve('swagger-ui-dist/package.json'),
);
const sourcePath = swaggerUiDistPath;
const targetPath = path.join(projectRoot, 'swagger-ui');

async function copySwaggerUI() {
  try {
    console.log('Swagger UI 파일 복사를 시작합니다...');
    console.log(`소스 경로: ${sourcePath}`);
    console.log(`대상 경로: ${targetPath}`);

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

    // 기존 url을 swagger.json을 가리키도록 변경합니다.
    indexContent = indexContent.replace(
      /url: ".*",/,
      `url: "./swagger.json",`,
    );
    console.log('index.html 내용 수정을 완료했습니다.');

    await fs.writeFile(indexPath, indexContent, 'utf8');
    console.log('수정된 index.html 파일을 저장했습니다.');

    console.log('Swagger UI 준비가 완료되었습니다.');
  } catch (err) {
    console.error('Swagger UI 준비 중 오류 발생:', err);
    process.exit(1);
  }
}

copySwaggerUI();

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
