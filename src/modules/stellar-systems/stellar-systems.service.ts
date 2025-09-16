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
} from './dto/stellar-system.dto';
import { StarPropertiesDto } from './dto/star.dto';
import { PlanetPropertiesDto } from './dto/planet.dto';
import { InstrumentRole } from './dto/common.dto';

@Injectable()
export class StellarSystemService {
  constructor(private readonly prisma: PrismaService) {}

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
      console.log('[StellarSystemService] Forbidden: userId is missing', { userId, dto });
      throw new ForbiddenException('로그인이 필요합니다.');
    }

    // 갤럭시 존재 확인만 수행
    const galaxy = await this.prisma.galaxy.findUnique({
      where: { id: dto.galaxy_id },
      select: { id: true },
    });

    if (!galaxy) {
      console.log('[StellarSystemService] NotFound: galaxy not found', { galaxyId: dto.galaxy_id, dto });
      throw new NotFoundException('해당 갤럭시를 찾을 수 없습니다.');
    }

    const result = await this.prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        // 1. 스텔라 시스템 생성 (소스 ID는 자기 자신으로 즉시 설정)
        const newId = randomUUID();
        const finalSystem = await tx.stellarSystem.create({
          data: {
            id: newId,
            title: dto.title, // title 필드에 저장
            galaxy_id: dto.galaxy_id,
            creator_id: userId, // 현재 소유자
            author_id: userId, // 최초 생성자 (새로 생성하는 경우 동일)
            create_source_id: newId, // 자기 자신의 ID를 클론 소스로 설정
            original_source_id: newId, // 자기 자신의 ID를 최초 소스로 설정
            created_via: 'MANUAL',
          },
        });

        // 2. 항성 자동 생성 (기본값 또는 사용자 제공값 사용)
        const defaultStarProperties: StarPropertiesDto = {
          spin: 50, // BPM 120
          brightness: 75, // Volume 75%
          color: 60, // Key/Scale
          size: 50, // Complexity 2
          ...dto.star, // 사용자 제공 속성으로 덮어쓰기
        };

        // 타입 안전한 변환 헬퍼 사용
        const starPropertiesJson = this.convertToJsonObject(
          defaultStarProperties
        );
        const star = await tx.star.create({
          data: {
            system_id: finalSystem.id,
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
   * 스텔라 시스템 조회 (항성 및 행성 포함)
   */
  async getStellarSystem(
    id: string,
    userId: string
  ): Promise<StellarSystemResponseDto> {
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

    // 소유자 확인 (필요시)
    if (system.creator_id !== userId) {
      throw new ForbiddenException('이 스텔라 시스템에 대한 권한이 없습니다.');
    }

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

    // 대상 갤럭시 존재 확인만 수행
    const galaxy = await this.prisma.galaxy.findUnique({
      where: { id: dto.galaxy_id },
      select: { id: true },
    });

    if (!galaxy) {
      throw new NotFoundException('대상 갤럭시를 찾을 수 없습니다.');
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

        // 1. 새 스텔라 시스템 생성 (클론)
        const clonedSystem = await tx.stellarSystem.create({
          data: {
            title: dto.title, // DTO의 title을 title 필드에 저장
            galaxy_id: dto.galaxy_id,
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
          },
        });

        // 2) 항성 upsert (있으면 properties 업데이트, 없으면 생성)
        let star: Star | null = await tx.star.findUnique({
          where: { system_id: id },
        });
        if (dto.star) {
          const starProps = this.convertToJsonObject(dto.star);
          if (star) {
            star = await tx.star.update({
              where: { system_id: id },
              data: { properties: starProps },
            });
          } else {
            star = await tx.star.create({
              data: {
                system_id: id,
                properties: starProps,
              },
            });
          }
        } else {
          // dto.star가 없으면 기존 값을 유지
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
   * 내가 작성한 스텔라 카운트
   */
  async countMyStellaSystem(userId: string): Promise<number> {
    return this.prisma.stellarSystem.count({
      where: { creator_id: userId },
    });
  }

  /**
   * Prisma 모델을 StellarSystemResponseDto로 변환하는 헬퍼 메서드
   */
  private async mapToStellarSystemResponseDto(
    system: StellarSystem,
    star: Star | null,
    planets: Planet[]
  ): Promise<StellarSystemResponseDto> {
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

    return {
      id: system.id,
      title: system.title, // DB의 title을 프론트엔드의 title로 매핑
      galaxy_id: system.galaxy_id,
      creator_id: system.creator_id,
      author_id: system.author_id,
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
