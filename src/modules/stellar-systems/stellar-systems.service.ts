import { Prisma, StellarSystem, Star, Planet } from '@prisma/client';
import { randomUUID } from 'crypto';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateStellarSystemDto,
  UpdateStellarSystemDto,
  CloneStellarSystemDto,
  StellarSystemResponseDto,
  MyStellarSystemsResponseDto,
} from './dto/stellar-system.dto';
import { StarPropertiesDto } from './dto/star.dto';
import { PlanetPropertiesDto } from './dto/planet.dto';
import { InstrumentRole } from './dto/common.dto';

@Injectable()
export class StellarSystemService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 갤럭시 내에서 랜덤한 위치를 생성합니다
   * x: -1000 ~ +1000, y: -20 ~ +20, z: -1000 ~ +1000
   */
  private generateRandomPosition(): number[] {
    const x = Math.random() * 2000 - 1000; // -1000 ~ +1000
    const y = Math.random() * 40 - 20; // -20 ~ +20
    const z = Math.random() * 2000 - 1000; // -1000 ~ +1000

    return [
      Math.round(x * 10) / 10, // 소수점 1자리까지
      Math.round(y * 10) / 10, // 소수점 1자리까지
      Math.round(z * 10) / 10, // 소수점 1자리까지
    ];
  }

  /**
   * 새로운 스텔라 시스템 생성 (항성 자동 생성 포함)
   * - 스텔라 시스템과 항성이 동시에 생성됩니다
   * - 항성은 삭제할 수 없으며, 시스템당 정확히 하나만 존재합니다
   */
  async createStellarSystem(
    userId: string,
    dto: CreateStellarSystemDto
  ): Promise<StellarSystemResponseDto> {
    // userId 검증 (인증 실패 시 대응)

    if (!userId) {
      throw new ForbiddenException('로그인이 필요합니다.');
    }

    // 갤럭시 존재 확인만 수행
    const galaxy = await this.prisma.galaxy.findUnique({
      where: { id: dto.galaxy_id },
      select: { id: true },
    });

    if (!galaxy) {
      throw new NotFoundException('해당 갤럭시를 찾을 수 없습니다.');
    }

    const result = await this.prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        // 1. 스텔라 시스템 생성 (소스 ID는 자기 자신으로 즉시 설정)
        const newId = randomUUID();

        // position이 제공되지 않았다면 랜덤 위치 생성
        const systemPosition = dto.position || this.generateRandomPosition();

        const finalSystem = await tx.stellarSystem.create({
          data: {
            id: newId,
            title: dto.title, // title 필드에 저장
            galaxy_id: dto.galaxy_id,
            position: JSON.stringify(systemPosition), // 제공된 위치 또는 랜덤 위치 저장
            creator_id: userId, // 현재 소유자
            author_id: userId, // 최초 생성자 (새로 생성하는 경우 동일)
            create_source_id: newId, // 자기 자신의 ID를 클론 소스로 설정
            original_source_id: newId, // 자기 자신의 ID를 최초 소스로 설정
            created_via: 'MANUAL',
          },
        });

        // 2. 항성 자동 생성 (기본값 또는 사용자 제공값 사용)
        const defaultStarName = dto.star?.name || 'CENTRAL STAR';
        const defaultStarProperties = {
          spin: 50, // BPM 120
          brightness: 75, // Volume 75%
          color: 60, // Key/Scale
          size: 50, // Complexity 2
          ...dto.star?.properties, // 사용자 제공 속성으로 덮어쓰기
        };

        // 타입 안전한 변환 헬퍼 사용
        const starPropertiesJson = this.convertToJsonObject(
          defaultStarProperties
        );
        const star = await tx.star.create({
          data: {
            system_id: finalSystem.id,
            name: defaultStarName, // 프론트에서 제공된 이름 또는 기본값
            properties: starPropertiesJson,
          },
        });

        // 3. 초기 행성 생성 (제공된 경우)
        const initialPlanets: Planet[] = [];
        if (dto.planets && dto.planets.length > 0) {
          for (const planetDto of dto.planets) {
            const planet = await tx.planet.create({
              data: {
                system_id: finalSystem.id,
                name: planetDto.name,
                instrument_role: planetDto.role,
                is_active: true,
                properties: this.convertToJsonObject(planetDto.properties),
              },
            });
            initialPlanets.push(planet);
          }
        }

        // 4. 생성된 시스템, 항성, 행성 정보 반환
        return await this.mapToStellarSystemResponseDto(
          finalSystem,
          star,
          initialPlanets
        );
      }
    );

    return result;
  }

  /**
   * 갤럭시 내 스텔라 시스템 전체 조회 (간소 정보)
   * - id, title, position, color(항성 색상) 만 반환
   */
  async getGalaxyStellarSystems(galaxyId: string): Promise<
    Array<{
      id: string;
      title: string;
      position: number[];
      color: number;
    }>
  > {
    // 갤럭시 존재 확인
    const galaxy = await this.prisma.galaxy.findUnique({
      where: { id: galaxyId },
      select: { id: true },
    });

    if (!galaxy) {
      throw new NotFoundException('해당 갤럭시를 찾을 수 없습니다.');
    }

    // 갤럭시에 속한 모든 스텔라 시스템 조회 (항성 정보 포함)
    const stellarSystems = await this.prisma.stellarSystem.findMany({
      where: { galaxy_id: galaxyId },
      include: {
        star: {
          select: {
            properties: true,
          },
        },
      },
    });

    // 응답 형식으로 변환
    return stellarSystems.map(system => {
      // position JSON을 number[] 배열로 변환
      let position: number[] = [0, 0, 0]; // 기본값
      try {
        if (system.position) {
          let positionData: unknown;
          if (Array.isArray(system.position)) {
            positionData = system.position;
          } else {
            positionData = JSON.parse(system.position as string);
          }
          if (Array.isArray(positionData) && positionData.length >= 3) {
            position = [
              Number(positionData[0]) || 0,
              Number(positionData[1]) || 0,
              Number(positionData[2]) || 0,
            ];
          }
        }
      } catch (error) {
        // JSON 파싱 실패 시 기본값 사용
        console.warn(`Position parsing failed for system ${system.id}:`, error);
      }

      // 항성의 color 속성에서 색상 추출
      let color = 60; // 기본값
      try {
        const star = system.star;
        if (star && star.properties) {
          const starProps = this.convertFromJsonValue(star.properties);
          if (
            starProps &&
            typeof starProps === 'object' &&
            'color' in starProps
          ) {
            color = Number(starProps.color) || 60;
          }
        }
      } catch (error) {
        // 색상 추출 실패 시 기본값 사용
        console.warn(`Color parsing failed for system ${system.id}:`, error);
      }

      return {
        id: system.id,
        title: system.title,
        position,
        color,
      };
    });
  }

  /**
   * 스텔라 시스템 조회 (항성 및 행성 포함)
   * 인증 없이도 조회 가능
   */
  async getStellarSystem(id: string): Promise<StellarSystemResponseDto> {
    const system = await this.prisma.stellarSystem.findUnique({
      where: { id },
      include: {
        star: true,
        planets: true,
      },
    });

    if (!system) {
      throw new NotFoundException('스텔라 시스템을 찾을 수 없습니다.');
    }

    // 인증 검사 제거 - 누구나 조회 가능

    // DTO 형식으로 반환 (프론트엔드 호환)
    return await this.mapToStellarSystemResponseDto(
      system,
      system.star,
      system.planets
    );
  }

  /**
   * 스텔라 시스템 클론 (원본을 복제하여 새 시스템 생성)
   * - 원본 시스템의 항성과 행성들을 모두 복제합니다
   * - created_via: 'CLONE'으로 설정됩니다
   * - original_author_id와 source_system_id가 설정됩니다
   */
  async cloneStellarSystem(
    userId: string,
    dto: CloneStellarSystemDto
  ): Promise<StellarSystemResponseDto> {
    // userId 검증 (인증 실패 시 대응)
    if (!userId) {
      throw new ForbiddenException('로그인이 필요합니다.');
    }

    // 원본 시스템 확인
    const sourceSystem = await this.prisma.stellarSystem.findUnique({
      where: { id: dto.create_source_id },
      include: {
        star: true,
        planets: true,
      },
    });

    if (!sourceSystem) {
      throw new NotFoundException('복제할 원본 시스템을 찾을 수 없습니다.');
    }

    // 대상 갤럭시는 원본과 동일하게 설정
    const galaxy = await this.prisma.galaxy.findUnique({
      where: { id: sourceSystem.galaxy_id },
      select: { id: true },
    });

    if (!galaxy) {
      throw new NotFoundException('원본 시스템의 갤럭시를 찾을 수 없습니다.');
    }

    // 트랜잭션으로 시스템, 항성, 행성 모두 클론
    const result = await this.prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        // 원본 계보 계산: 최초 스텔라 title, 최초 생성자(원작자) ID 승계
        const computedOriginalSourceId: string =
          sourceSystem.original_source_id ?? sourceSystem.id;

        // 최초 생성자(원작자)는 최초 스텔라의 author_id를 사용
        let inheritedAuthorId = sourceSystem.author_id;
        if (sourceSystem.original_source_id) {
          // original_source_id는 System의 ID이므로 ID로 조회
          const original = await tx.stellarSystem.findUnique({
            where: { id: sourceSystem.original_source_id },
            select: { author_id: true },
          });
          inheritedAuthorId = original?.author_id ?? sourceSystem.author_id;
        }

        // 1. 새 스텔라 시스템 생성 (클론) - 자동으로 랜덤 위치 생성
        const clonePosition = this.generateRandomPosition();
        const cloneTitle = `${sourceSystem.title} (클론)`;

        const clonedSystem = await tx.stellarSystem.create({
          data: {
            title: cloneTitle, // 원본 제목 + " (클론)"
            galaxy_id: sourceSystem.galaxy_id, // 원본과 동일한 갤럭시
            position: JSON.stringify(clonePosition), // 새로운 랜덤 위치
            creator_id: userId, // 현재 소유자 (클론한 사람)
            author_id: inheritedAuthorId, // 최초 생성자(원작자) 승계
            create_source_id: sourceSystem.id, // 클론 소스의 ID
            original_source_id: computedOriginalSourceId, // 최초 스텔라의 ID
            created_via: 'CLONE',
          },
        });

        // 2. 항성 복제
        let clonedStar: Star | null = null;
        if (sourceSystem.star) {
          clonedStar = await tx.star.create({
            data: {
              system_id: clonedSystem.id,
              name: sourceSystem.star.name,
              // DB에서 온 properties는 이미 JsonValue이므로 바로 할당
              properties: sourceSystem.star.properties ?? {},
            },
          });
        }

        // 3. 행성들 복제
        const clonedPlanets: Planet[] = [];
        for (const planet of sourceSystem.planets) {
          const clonedPlanet = await tx.planet.create({
            data: {
              system_id: clonedSystem.id,
              name: planet.name,
              instrument_role: planet.instrument_role,
              is_active: planet.is_active,
              // DB에서 온 properties는 이미 JsonValue이므로 바로 할당
              properties: planet.properties ?? {},
            },
          });
          clonedPlanets.push(clonedPlanet);
        }

        // 4. 복제된 시스템 정보 반환 (프론트엔드 호환 DTO 형식)
        return await this.mapToStellarSystemResponseDto(
          clonedSystem,
          clonedStar,
          clonedPlanets
        );
      }
    );

    return result;
  }

  /**
   * 스텔라 시스템 수정 (기본 정보만, 항성/행성은 별도 메서드)
   */
  async updateStellarSystem(
    id: string,
    userId: string,
    dto: UpdateStellarSystemDto
  ): Promise<StellarSystemResponseDto> {
    // 소유자 확인
    const owning = await this.prisma.stellarSystem.findUnique({
      where: { id },
      select: { id: true, creator_id: true },
    });

    if (!owning) {
      throw new NotFoundException('스텔라 시스템을 찾을 수 없습니다.');
    }

    if (owning.creator_id !== userId) {
      throw new ForbiddenException('이 스텔라 시스템에 대한 권한이 없습니다.');
    }

    // 전체 편집: 이름/항성/행성까지 한 번에 업데이트(트랜잭션)
    const result = await this.prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        // 1) 시스템 기본 정보 업데이트 (title -> title)
        const sys = await tx.stellarSystem.update({
          where: { id },
          data: {
            title: dto.title ?? undefined,
            position: dto.position ? JSON.stringify(dto.position) : undefined,
          },
        });

        // 2) 항성 업데이트 (시스템당 항상 하나의 항성이 존재)
        let star: Star | null = await tx.star.findUnique({
          where: { system_id: id },
        });

        if (dto.star) {
          if (!star) {
            throw new NotFoundException(
              '스텔라 시스템에 항성이 존재하지 않습니다. 데이터 무결성 오류입니다.'
            );
          }

          // Star name과 properties를 구분하여 처리
          // name은 DB의 name 필드에, 나머지는 properties JSON 필드에 저장
          const starName = dto.star.name || star.name; // 기존 이름 유지 또는 새 이름 사용
          const starPropertiesOnly = dto.star.properties;

          const starProps = this.convertToJsonObject(starPropertiesOnly);
          star = await tx.star.update({
            where: { system_id: id },
            data: {
              name: starName, // 프론트에서 제공된 이름 또는 기존 이름 유지
              properties: starProps,
            },
          });
        }

        // 3) 행성 델타 업데이트 (planets가 제공된 경우에만)
        let planets: Planet[] = await tx.planet.findMany({
          where: { system_id: id },
        });
        if (dto.planets) {
          const existingById = new Map<string, Planet>(
            planets.filter(p => !!p.id).map(p => [p.id, p])
          );

          const incomingIds = new Set<string>();
          const nextPlanets: Planet[] = [];

          for (const p of dto.planets) {
            if (p.id && existingById.has(p.id)) {
              // 업데이트
              incomingIds.add(p.id);
              const updated = await tx.planet.update({
                where: { id: p.id },
                data: {
                  name: p.name,
                  instrument_role: p.role,
                  properties: this.convertToJsonObject(p.properties),
                },
              });
              nextPlanets.push(updated);
            } else {
              // 신규 생성
              const created = await tx.planet.create({
                data: {
                  system_id: id,
                  name: p.name,
                  instrument_role: p.role,
                  is_active: true,
                  properties: this.convertToJsonObject(p.properties),
                },
              });
              nextPlanets.push(created);
              if (created.id) incomingIds.add(created.id);
            }
          }

          // 제거된 행성 삭제 (incoming에 없는 기존행성)
          const toDelete = planets.filter(old => !incomingIds.has(old.id));
          if (toDelete.length > 0) {
            await tx.planet.deleteMany({
              where: { id: { in: toDelete.map(p => p.id) } },
            });
          }

          planets = nextPlanets;
        }

        return await this.mapToStellarSystemResponseDto(sys, star, planets);
      }
    );

    return result;
  }

  /**
   * 스텔라 시스템 삭제 (항성도 함께 자동 삭제)
   */
  async deleteStellarSystem(id: string, userId: string): Promise<void> {
    // 소유자 확인
    const system = await this.prisma.stellarSystem.findUnique({
      where: { id },
      select: { id: true, creator_id: true },
    });

    if (!system) {
      throw new NotFoundException('스텔라 시스템을 찾을 수 없습니다.');
    }

    if (system.creator_id !== userId) {
      throw new ForbiddenException('이 스텔라 시스템에 대한 권한이 없습니다.');
    }

    // 삭제 (Star, Planet은 외래키 제약으로 연쇄 삭제됨)
    await this.prisma.stellarSystem.delete({
      where: { id },
    });
  }

  /**
   * 내가 소유한 스텔라 시스템 목록 조회 (페이지네이션 지원)
   * - 좋아요 수 기준으로 순위 계산
   * - 행성 개수 계산
   * - 현재 사용자의 좋아요 여부 확인
   */
  async getMyStellarSystems(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<MyStellarSystemsResponseDto> {
    // 페이지네이션 계산
    const skip = (page - 1) * limit;

    // 전체 개수 조회
    const total = await this.prisma.stellarSystem.count({
      where: { creator_id: userId },
    });

    // 내 스텔라 시스템들을 좋아요 수 기준으로 정렬하여 조회
    const stellarSystems = await this.prisma.stellarSystem.findMany({
      where: { creator_id: userId },
      include: {
        creator: {
          select: { username: true }, // 사용자명 포함
        },
        planets: {
          select: { id: true }, // 행성 개수 계산용
        },
        likes: {
          select: { id: true }, // 좋아요 개수 계산용
        },
      },
      orderBy: [
        {
          likes: {
            _count: 'desc', // 좋아요 수 기준 내림차순
          },
        },
        {
          created_at: 'desc', // 생성일 기준 내림차순 (보조 정렬)
        },
      ],
      skip,
      take: limit,
    });

    // 각 시스템의 순위 계산을 위해 전체 시스템의 좋아요 수 조회
    const allSystemsWithLikes = await this.prisma.stellarSystem.findMany({
      where: { creator_id: userId },
      include: {
        likes: {
          select: { id: true },
        },
      },
      orderBy: {
        likes: {
          _count: 'desc',
        },
      },
    });

    // 순위 맵 생성 (좋아요 수 기준)
    const rankMap = new Map<string, number>();
    allSystemsWithLikes.forEach((system, index) => {
      rankMap.set(system.id, index + 1);
    });

    // 응답 데이터 구성
    const data = stellarSystems.map(system => ({
      id: system.id,
      title: system.title,
      galaxy_id: system.galaxy_id,
      creator_id: system.creator_id,
      creator_name: system.creator.username, // 사용자 이름 포함
      created_at: system.created_at,
      updated_at: system.updated_at,
      like_count: system.likes.length,
      planet_count: system.planets.length,
      rank: rankMap.get(system.id) || 0,
    }));

    return {
      data,
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  /**
   * Prisma 모델을 StellarSystemResponseDto로 변환하는 헬퍼 메서드
   */
  private async mapToStellarSystemResponseDto(
    system: StellarSystem,
    star: Star | null,
    planets: Planet[]
  ): Promise<StellarSystemResponseDto> {
    // position JSON을 number[] 배열로 변환
    let position: number[] = [0, 0, 0]; // 기본값
    try {
      if (system.position) {
        let positionData: unknown;
        if (Array.isArray(system.position)) {
          positionData = system.position;
        } else {
          positionData = JSON.parse(system.position as string);
        }
        if (Array.isArray(positionData) && positionData.length >= 3) {
          position = [
            Number(positionData[0]) || 0,
            Number(positionData[1]) || 0,
            Number(positionData[2]) || 0,
          ];
        }
      }
    } catch (error) {
      // JSON 파싱 실패 시 기본값 사용
      console.warn(`Position parsing failed for system ${system.id}:`, error);
    }

    // 소스 시스템들의 이름 조회 (항상 문자열 보장)
    let createSourceName: string = '';
    let originalSourceName: string = '';

    if (system.create_source_id === system.id) {
      // 자기 자신을 소스로 가진 최초 생성 케이스
      createSourceName = system.title;
    } else if (system.create_source_id) {
      const createSource = await this.prisma.stellarSystem.findUnique({
        where: { id: system.create_source_id },
        select: { title: true },
      });
      createSourceName = createSource?.title ?? '';
    }

    if (system.original_source_id === system.id) {
      // 최초 원작이 자기 자신인 케이스
      originalSourceName = system.title;
    } else if (
      system.original_source_id &&
      system.original_source_id === system.create_source_id
    ) {
      // 동일 소스일 경우 중복 조회 방지
      originalSourceName = createSourceName;
    } else if (system.original_source_id) {
      const originalSource = await this.prisma.stellarSystem.findUnique({
        where: { id: system.original_source_id },
        select: { title: true },
      });
      originalSourceName = originalSource?.title ?? '';
    }

    // 사용자 이름 조회
    let creatorName = '';
    let authorName = '';

    // creator와 author가 같은 경우 한번만 조회
    if (system.creator_id === system.author_id) {
      const user = await this.prisma.user.findUnique({
        where: { id: system.creator_id },
        select: { username: true },
      });
      creatorName = authorName = user?.username ?? '';
    } else {
      // 다른 경우 각각 조회
      const [creator, author] = await Promise.all([
        this.prisma.user.findUnique({
          where: { id: system.creator_id },
          select: { username: true },
        }),
        this.prisma.user.findUnique({
          where: { id: system.author_id },
          select: { username: true },
        }),
      ]);
      creatorName = creator?.username ?? '';
      authorName = author?.username ?? '';
    }

    return {
      id: system.id,
      title: system.title, // DB의 title을 프론트엔드의 title로 매핑
      galaxy_id: system.galaxy_id,
      position, // 변환된 position 배열
      creator_id: system.creator_id,
      creator_name: creatorName,
      author_id: system.author_id,
      author_name: authorName,
      create_source_id: system.create_source_id ?? system.id,
      create_source_name: createSourceName,
      original_source_id: system.original_source_id ?? system.id,
      original_source_name: originalSourceName,
      created_via: system.created_via,
      star: star
        ? {
            id: star.id,
            system_id: star.system_id,
            name: star.name,
            object_type: 'STAR',
            properties: this.convertFromJsonValue<StarPropertiesDto>(
              star.properties
            ),
            created_at: star.created_at,
            updated_at: star.updated_at,
          }
        : null,
      planets: planets.map(planet => ({
        id: planet.id,
        system_id: planet.system_id,
        name: planet.name,
        object_type: 'PLANET',
        role: planet.instrument_role as InstrumentRole,
        properties: this.convertFromJsonValue<PlanetPropertiesDto>(
          planet.properties
        ),
        created_at: planet.created_at,
        updated_at: planet.updated_at,
      })),
      created_at: system.created_at,
      updated_at: system.updated_at,
    };
  }

  /**
   * DTO 객체를 Prisma JsonObject로 안전하게 변환하는 헬퍼 메서드
   */
  private convertToJsonObject(dto: unknown): Prisma.JsonObject {
    // JSON.stringify를 통해 직렬화 가능 객체로 보장하고, unknown으로 파싱 후 런타임 형태 검증을 수행합니다.
    const jsonString = JSON.stringify(dto);
    const parsed = JSON.parse(jsonString) as unknown;
    if (
      parsed !== null &&
      typeof parsed === 'object' &&
      !Array.isArray(parsed)
    ) {
      return parsed as Prisma.JsonObject;
    }
    // 객체(JSON Object)가 아닌 경우는 저장할 수 없으므로 예외를 던집니다.
    throw new Error('직렬화된 데이터가 유효한 JSON Object 형식이 아닙니다.');
  }

  /**
   * Prisma JsonValue를 특정 DTO 타입으로 안전하게 변환하는 헬퍼 메서드
   */
  private convertFromJsonValue<T>(
    jsonValue: Prisma.JsonValue,
    fallback?: T,
    opts?: { strict?: boolean }
  ): T {
    // null/undefined는 합법적일 수 있으므로 기본적으로 예외를 던지지 않고 fallback 또는 빈 객체를 반환합니다.
    if (jsonValue === null || jsonValue === undefined) {
      if (opts?.strict) {
        throw new InternalServerErrorException(
          'JSON 데이터가 null 또는 undefined입니다.'
        );
      }
      return fallback ?? ({} as T);
    }

    // 객체가 아닌 경우(숫자/문자열/배열 등)는 DTO로 안전 캐스팅이 어려우므로 동일한 정책 적용
    if (typeof jsonValue !== 'object' || Array.isArray(jsonValue)) {
      if (opts?.strict) {
        throw new InternalServerErrorException(
          'JSON 데이터가 객체 형식이 아닙니다.'
        );
      }
      return fallback ?? ({} as T);
    }

    return jsonValue as T;
  }
}
