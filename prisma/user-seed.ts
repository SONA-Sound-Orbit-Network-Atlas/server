// 테스트용 시드 스크립트: 40개 계정 + 모든 계정 서로 팔로우
// Prisma Client를 사용하여 DB에 직접 데이터 삽입
// 실행: npx prisma db seed

import { PrismaClient, User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // 기존 testuser 계정 및 팔로우 데이터 삭제
  console.log('기존 testuser 계정 및 팔로우 데이터 삭제 시작');
  const oldUsers = await prisma.user.findMany({
    where: { username: { startsWith: 'testuser' } },
    select: { id: true },
  });
  if (oldUsers.length > 0) {
    const oldIds = oldUsers.map(u => u.id);
    await prisma.follow.deleteMany({
      where: {
        OR: [{ follower_id: { in: oldIds } }, { followee_id: { in: oldIds } }],
      },
    });
    await prisma.user.deleteMany({
      where: { id: { in: oldIds } },
    });
    console.log(
      `기존 testuser 계정 ${oldUsers.length}개 및 팔로우 데이터 삭제 완료`
    );
  } else {
    console.log('삭제할 testuser 계정 없음');
  }

  // 1. 테스트 계정 생성
  console.log('테스트 계정 생성 시작');
  const users: User[] = [];
  for (let i = 1; i <= 40; i++) {
    const username = `testuser${String(i).padStart(2, '0')}`;
    const email = `${username}@example.com`;
    const password = await bcrypt.hash('testpassword', 10); // 모든 계정 동일 비번
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password,
      },
    });
    users.push(user);
    if (i % 10 === 0) console.log(`${i}번째 계정 생성 완료`);
  }
  console.log('테스트 계정 40개 생성 완료');

  // 2. 팔로우 관계 생성 (각 계정별 팔로우 수 랜덤)
  console.log('팔로우 관계 생성 시작 (각 계정별 팔로우 수 랜덤)');
  const followPromises: Promise<any>[] = [];
  for (let i = 0; i < users.length; i++) {
    // 각 계정이 팔로우할 대상의 인덱스 목록 생성 (자기 자신 제외)
    const candidates = users.map((_, idx) => idx).filter(idx => idx !== i);
    // 팔로우 수를 5~39 사이에서 랜덤하게 결정
    const followCount = Math.floor(Math.random() * (candidates.length - 4)) + 5;
    // 랜덤하게 팔로우 대상 선택
    const shuffled = candidates.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, followCount);
    for (const j of selected) {
      followPromises.push(
        prisma.follow
          .create({
            data: {
              follower_id: users[i].id,
              followee_id: users[j].id,
            },
          })
          .catch(err => {
            console.error(
              `팔로우 생성 에러: ${users[i].username} -> ${users[j].username}`,
              err.message
            );
          })
      );
    }
    if ((i+1) % 10 === 0) console.log(`${i+1}번째 계정 팔로우 랜덤 생성 완료`);
  }
  await Promise.all(followPromises);
  console.log('팔로우 관계 생성 완료');

  console.log('테스트 계정 및 팔로우 관계 전체 시드 완료!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
