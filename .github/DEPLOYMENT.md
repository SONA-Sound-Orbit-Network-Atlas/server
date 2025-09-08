# GitHub Pages 배포를 위한 설정 가이드

## Repository 설정

1. **GitHub Pages 활성화**
   - Repository → Settings → Pages
   - Source: "GitHub Actions" 선택
   - Custom domain (선택사항): 커스텀 도메인 설정

2. **Environment 설정**
   - Repository → Settings → Environments
   - "github-pages" environment 생성 (자동 생성됨)
   - Protection rules 설정 가능

## 배포 확인

### 자동 배포
- `dev` 또는 `main` 브랜치에 push 시 자동 실행

### 수동 배포
- Repository → Actions → "Deploy Swagger UI to GitHub Pages" 선택
- "Run workflow" → environment 선택 → 실행

## 배포 URL 확인

배포 완료 후 URL은 다음과 같습니다:
- `https://<username>.github.io/<repository-name>/`
- 예: `https://sona-sound-orbit-network-atlas.github.io/server/`

## Troubleshooting

### 일반적인 문제들

1. **Pages 설정 오류**
   - Settings → Pages에서 Source가 "GitHub Actions"로 설정되어 있는지 확인

2. **권한 오류**
   - Repository settings에서 Actions 권한 확인
   - Write permissions 허용 여부 확인

3. **빌드 실패**
   - Actions 탭에서 로그 확인
   - Node.js 버전, dependencies 설치 상태 확인

4. **404 오류**
   - index.html이 제대로 생성되었는지 확인
   - swagger.json 경로가 올바른지 확인
