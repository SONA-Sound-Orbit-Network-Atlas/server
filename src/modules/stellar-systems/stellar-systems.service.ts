import { Prisma, StellarSystem, Star, Planet } from '@prisma/client';
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
        // 1. 스텔라 시스템 생성 (스키마의 모든 필수 필드 포함)
        const system = await tx.stellarSystem.create({
          data: {
            title: dto.name, // DTO의 name을 title 필드에 저장 (DB는 title 유지)
            galaxy_id: dto.galaxy_id,
            owner_id: userId,
            created_by_id: userId,
            original_author_id: userId, // 새로 생성하는 경우 원작자도 동일
            source_system_id: null, // 클론이 아닌 새 생성이므로 null
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
            system_id: system.id,
            properties: starPropertiesJson,
          },
        });

        // 3. 초기 행성 생성 (제공된 경우)
        const initialPlanets: Planet[] = [];
        if (dto.planets && dto.planets.length > 0) {
          for (const planetDto of dto.planets) {
            const planet = await tx.planet.create({
              data: {
                system_id: system.id,
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
        return this.mapToStellarSystemResponseDto(system, star, initialPlanets);
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
    if (system.owner_id !== userId) {
      throw new ForbiddenException('이 스텔라 시스템에 대한 권한이 없습니다.');
    }

    // DTO 형식으로 반환 (프론트엔드 호환)
    return this.mapToStellarSystemResponseDto(
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
      where: { id: dto.source_system_id },
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
        // 1. 새 스텔라 시스템 생성 (클론)
        const clonedSystem = await tx.stellarSystem.create({
          data: {
            title: dto.name, // DTO의 name을 title 필드에 저장
            galaxy_id: dto.galaxy_id,
            owner_id: userId,
            created_by_id: userId,
            // 원작자 승계: 원본의 original_author_id가 있으면 사용, 없으면 원본의 created_by_id 사용
            original_author_id:
              sourceSystem.original_author_id || sourceSystem.created_by_id,
            source_system_id: dto.source_system_id,
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
        return this.mapToStellarSystemResponseDto(
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
      select: { id: true, owner_id: true },
    });

    if (!owning) {
      throw new NotFoundException('스텔라 시스템을 찾을 수 없습니다.');
    }

    if (owning.owner_id !== userId) {
      throw new ForbiddenException('이 스텔라 시스템에 대한 권한이 없습니다.');
    }

    // 전체 편집: 이름/항성/행성까지 한 번에 업데이트(트랜잭션)
    const result = await this.prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        // 1) 시스템 기본 정보 업데이트 (name -> title)
        const sys = await tx.stellarSystem.update({
          where: { id },
          data: {
            title: dto.name ?? undefined,
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

        return this.mapToStellarSystemResponseDto(sys, star, planets);
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
      select: { id: true, owner_id: true },
    });

    if (!system) {
      throw new NotFoundException('스텔라 시스템을 찾을 수 없습니다.');
    }

    if (system.owner_id !== userId) {
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
      where: { owner_id: userId },
    });
  }

  /**
   * Prisma 모델을 StellarSystemResponseDto로 변환하는 헬퍼 메서드
   */
  private mapToStellarSystemResponseDto(
    system: StellarSystem,
    star: Star | null,
    planets: Planet[]
  ): StellarSystemResponseDto {
    return {
      id: system.id,
      name: system.title, // DB의 title을 프론트엔드의 name으로 매핑
      galaxy_id: system.galaxy_id,
      owner_id: system.owner_id,
      created_by_id: system.created_by_id,
      original_author_id: system.original_author_id,
      created_via: system.created_via,
      source_system_id: system.source_system_id,
      star: star
        ? {
            id: star.id,
            system_id: star.system_id,
            name: star.name, // Star의 name 필드 추가
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
