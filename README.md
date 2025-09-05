# SONA 백엔드 서버

[![Deploy Swagger UI](https://github.com/SONA-Sound-Orbit-Network-Atlas/server/actions/workflows/swagger-deploy.yml/badge.svg)](https://github.com/SONA-Sound-Orbit-Network-Atlas/server/actions/workflows/swagger-deploy.yml)
[![API Documentation](https://img.shields.io/badge/API-Documentation-blue)](https://sona-sound-orbit-network-atlas.github.io/server/)

SONA는 "은하(갤럭시) → 항성계 → 행성(궤도/사운드)"을 구현하는 프로젝트입니다. 이 저장소는 NestJS, Prisma, PostgreSQL을 사용하는 백엔드 부분입니다.

## 📖 API 문서

- **로컬 개발**: [http://localhost:3000/api](http://localhost:3000/api)
- **온라인 문서**: [https://sona-sound-orbit-network-atlas.github.io/server/](https://sona-sound-orbit-network-atlas.github.io/server/)

## 기술 스택

- **프레임워크**: NestJS 11+
- **데이터베이스**: PostgreSQL 14+ (Prisma ORM 사용)
- **인증**: JWT 기반 인증
- **문서화**: Swagger API 문서

## 개발 환경 설정

### 필수 조건

- Node.js 18.x 이상
- PostgreSQL 14.x 이상
- npm 9.x 이상

### 설치 방법

1. 저장소 클론

```bash
git clone <repository-url>
cd server
```

2. 종속성 설치

```bash
npm install
```

3. 환경 변수 설정

`.env.sample` 파일을 `.env`로 복사하고 필요에 따라 수정하세요:

```bash
cp .env.sample .env
```

4. 데이터베이스 설정

PostgreSQL 데이터베이스를 생성하고 `.env` 파일의 `DATABASE_URL`을 업데이트하세요.

5. Prisma 마이그레이션 실행

```bash
npx prisma migrate dev --name init
```

6. 개발 서버 실행

```bash
npm run start:dev
```

서버가 http://localhost:3000에서 실행되며, API 문서는 http://localhost:3000/api에서 확인할 수 있습니다.

## 프로젝트 구조

```
src/
├── auth/               # 인증 관련 기능
├── common/             # 공통 유틸리티, 필터, 인터셉터
├── modules/            # 도메인별 모듈
│   ├── users/          # 사용자 관리
│   ├── galaxies/       # 갤럭시 관리
│   ├── stellar-systems/# 항성계 관리
│   ├── planets/        # 행성 관리
│   ├── patterns/       # 패턴 관리
│   ├── likes/          # 좋아요 기능
│   ├── follows/        # 팔로우 기능
│   └── notifications/  # 알림 기능
├── prisma/             # Prisma 관련 코드
├── app.module.ts       # 메인 애플리케이션 모듈
└── main.ts             # 애플리케이션 진입점
```

## API 엔드포인트

애플리케이션의 주요 API 엔드포인트:

- `POST /auth/register`: 새 사용자 등록
- `POST /auth/login`: 사용자 로그인 및 JWT 토큰 발급
- `GET /api`: Swagger API 문서

자세한 API 문서는 서버 실행 후 http://localhost:3000/api 에서 확인할 수 있습니다.

## 테스트

```bash
# 단위 테스트
npm run test

# e2e 테스트
npm run test:e2e

# 테스트 커버리지
npm run test:cov
```

## 라이센스

이 프로젝트는 MIT 라이센스에 따라 라이센스가 부여됩니다.
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
