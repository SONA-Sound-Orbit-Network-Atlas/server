# 🌌 SONA - 3D 음악 생성 우주 탐험 플랫폼 (Backend)

“우주를 탐험하며 음악을 창조하다”
SONA는 3D 우주 공간에서  **스텔라 시스템(Stellar System)** 을 만들고, 각 천체의 물리적 특성을 조정하여 음악을 창작하고 공유하는 혁신적인 플랫폼입니다.
이 저장소는 SONA의 백엔드 API 서버로, NestJS + Prisma + PostgreSQL 기반으로 개발되었습니다

SONA는 "은하(갤럭시) → 항성계 → 행성(궤도/사운드)"을 구현하는 프로젝트입니다. 이 저장소는 NestJS, Prisma, PostgreSQL을 사용하는 백엔드 부분입니다.

## 🛠기술 스택
[![Node.js](https://img.shields.io/badge/Node.js-18-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11-red?style=flat-square&logo=nestjs)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.14-blue?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Swagger](https://img.shields.io/badge/Swagger-API_Docs-green?style=flat-square&logo=swagger)](https://swagger.io/)


- **프레임워크**: NestJS 11+
- **데이터베이스**: PostgreSQL 14+ (Prisma ORM 사용)
- **인증**: JWT 기반 인증
- **문서화**: Swagger API 문서


## 📖 주요 기능
**🎵 음악 + 우주 탐험**

- 스텔라 시스템(항성계) 생성: 중심별(Star) + 행성(Planet) 조합

- 천체 속성이 음악적 매개변수로 변환

- 6가지 악기 역할 지원 (베이스, 드럼, 패드, 멜로디, 아르페지오, 화음)

**👥 커뮤니티 & 소셜**

- 팔로우/언팔로우 + 팔로워·팔로잉 목록 (맞팔 여부 확인 가능)

- 좋아요(Like) 기능: 내가 좋아요한 항성계 목록 조회

- 클론(Clone): 다른 사용자의 작품을 리믹스하여 창작 확장


**🎚️ 제어 & 관리**

- INFO 탭: 시스템 정보 및 메타데이터 관리

- OBJECTS 탭: 천체 추가/삭제 및 배치

- PROPERTIES 탭: 음악적 파라미터 세부 조정

- 실시간 오디오 플레이어 & 볼륨 컨트롤

## 🚀 배포 링크

- **Frontend Live**: https://sona-sound.vercel.app/
- **로컬 개발**: [http://localhost:3000/api](http://localhost:3000/api)
- **온라인 문서**: [https://sona-sound-orbit-network-atlas.github.io/server/](https://sona-sound-orbit-network-atlas.github.io/server/)


## 📁 프로젝트 구조

```
src/
├── auth/                # 인증 관련 기능
├── common/              # 공통 유틸리티, 필터, 인터셉터
├── modules/             # 도메인별 모듈
│   ├── follows/         # 팔로우 관리
│   ├── likes/           # 좋아요 관리
│   ├── stellar-systems/ # 항성계 기능
│   └── users/           # 사용자 기능
├── prisma/              # Prisma 관련 코드
├── app.module.ts        # 메인 애플리케이션 모듈
└── main.ts              # 애플리케이션 진입점
```

## 📚API 엔드포인트

애플리케이션의 주요 API 엔드포인트:

- `POST /api/auth/signup`: 사용자 회원가입
- `POST /api/auth/login`: 사용자 로그인 및 JWT 토큰 발급
- `GET /api`: Swagger API 문서

자세한 API 문서는 서버 실행 후 http://localhost:3000/api 에서 확인할 수 있습니다.


