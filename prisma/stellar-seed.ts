import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function randomInRange(min: number, max: number, digits = 2): number {
  const v = Math.random() * (max - min) + min;
  return parseFloat(v.toFixed(digits));
}

function randomPosition(): number[] {
  return [
    randomInRange(-1000, 1000, 2),
    randomInRange(-20, 20, 2),
    randomInRange(-1000, 1000, 2),
  ];
}

function randomStarProps() {
  return {
    spin: randomInRange(0, 100),
    brightness: randomInRange(0, 100),
    color: randomInRange(0, 360),
    size: randomInRange(0, 100),
  };
}

function randomPlanetProps() {
  return {
    planetSize: randomInRange(0.01, 1.0, 3),
    planetColor: randomInRange(0, 360),
    planetBrightness: randomInRange(0.3, 5.0, 2),
    distanceFromStar: randomInRange(1.0, 20.0, 2),
    orbitSpeed: randomInRange(0.01, 1.0, 3),
    rotationSpeed: randomInRange(0.01, 1.0, 3),
    eccentricity: randomInRange(0.0, 0.9, 3),
    tilt: randomInRange(0, 180),
  };
}

async function main() {
  const galaxyId = 'gal_abc123';
  const creatorId = 'cmflw2kkc0001p801y51kibpk';

  // 기존 스텔라 시스템 하나를 가져와서 외래키 참조용으로 사용
  const existingSystem = await prisma.stellarSystem.findFirst();

  if (!existingSystem) {
    console.error(
      'No existing stellar system found. Please create at least one system first.'
    );
    return;
  }

  const referenceSystemId = existingSystem.id;
  console.log(
    `Using existing system "${existingSystem.title}" (${referenceSystemId}) as temporary reference...`
  );

  // created 배열 타입 명시
  const created: { id: string; title: string }[] = [];

  // 1단계: 시스템 생성 (기존 시스템 ID를 임시 외래키로 사용)
  for (let i = 1; i <= 100; i++) {
    const system = await prisma.stellarSystem.create({
      data: {
        title: `My First System ${i}`,
        galaxy_id: galaxyId,
        position: randomPosition(),
        creator_id: creatorId,
        author_id: creatorId,
        created_via: 'MANUAL',
        // 임시로 기존 시스템 ID 사용
        create_source_id: referenceSystemId,
        original_source_id: referenceSystemId,
        star: {
          create: {
            name: `Star ${i}`,
            object_type: 'STAR',
            properties: randomStarProps(),
          },
        },
        planets: {
          create: [
            {
              name: `Planet ${i}-1`,
              object_type: 'PLANET',
              instrument_role: 'MELODY', // 악기 역할 추가
              properties: randomPlanetProps(),
            },
          ],
        },
      },
    });

    created.push({ id: system.id, title: system.title });

    if (i % 100 === 0) {
      console.log(`Created ${i} systems...`);
    }
  }

  console.log(`Created ${created.length} stellar systems`);

  // 2단계: 각 시스템이 자기 자신을 참조하도록 업데이트
  console.log('Updating systems with self-references...');
  for (let i = 0; i < created.length; i++) {
    const system = created[i];
    await prisma.stellarSystem.update({
      where: { id: system.id },
      data: {
        create_source_id: system.id,
        original_source_id: system.id,
      },
    });

    if ((i + 1) % 100 === 0) {
      console.log(`Updated ${i + 1} systems...`);
    }
  }

  console.log('All systems updated with self-references successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
