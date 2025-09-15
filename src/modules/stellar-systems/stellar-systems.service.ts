import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ComposeRequestDto,
  CreateStellarSystemDto,
  UpdateStellarSystemDto,
  CloneStellarSystemDto,
} from './dto/stellar-systems.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class StellarSystemService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 새로운 스텔라 시스템 생성 (항성 자동 생성 포함)
   * - 스텔라 시스템과 항성이 동시에 생성됩니다
   * - 항성은 삭제할 수 없으며, 시스템당 정확히 하나만 존재합니다
   */
  async createStellarSystem(userId: string, dto: CreateStellarSystemDto) {
    // 갤럭시 존재 및 소유자 확인
    const galaxy = await this.prisma.galaxy.findUnique({
      where: { id: dto.galaxy_id },
      select: { id: true, owner_id: true },
    });

    if (!galaxy) {
      throw new NotFoundException('해당 갤럭시를 찾을 수 없습니다.');
    }

    if (galaxy.owner_id !== userId) {
      throw new ForbiddenException('이 갤럭시에 대한 권한이 없습니다.');
    }

    return await this.prisma.$transaction(async tx => {
      // 1. 스텔라 시스템 생성 (스키마의 모든 필수 필드 포함)
      const system = await tx.stellarSystem.create({
        data: {
          title: dto.name,
          galaxy_id: dto.galaxy_id,
          owner_id: userId,
          created_by_id: userId,
          original_author_id: userId, // 새로 생성하는 경우 원작자도 동일
          source_system_id: null, // 클론이 아닌 새 생성이므로 null
          created_via: 'MANUAL',
        },
      });

      // 2. 항성 자동 생성 (기본값 또는 사용자 제공값 사용)
      const defaultStarProperties = {
        spin: 50, // BPM 120
        brightness: 75, // Volume 75%
        color: 60, // Key/Scale
        size: 50, // Complexity 2
        temperature: 50,
        luminosity: 50,
        radius: 50,
        ...dto.star_properties, // 사용자 제공 속성으로 덮어쓰기
      };

      const star = await tx.star.create({
        data: {
          system_id: system.id,
          properties: defaultStarProperties,
        },
      });

      // 3. 생성된 시스템과 항성 정보 반환
      return {
        id: system.id,
        name: system.title, // 응답에서는 name으로 변환
        galaxy_id: system.galaxy_id,
        owner_id: system.owner_id,
        created_by_id: system.created_by_id,
        original_author_id: system.original_author_id,
        source_system_id: system.source_system_id,
        created_via: system.created_via,
        created_at: system.created_at,
        updated_at: system.updated_at,
        star: {
          id: star.id,
          system_id: star.system_id,
          properties: star.properties,
          created_at: star.created_at,
          updated_at: star.updated_at,
        },
        planets: [], // 초기에는 행성이 없음
      };
    });
  }

  /**
   * 스텔라 시스템 조회 (항성 및 행성 포함)
   */
  async getStellarSystem(id: string, userId: string) {
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

    return system;
  }

  /**
   * 스텔라 시스템 클론 (원본을 복제하여 새 시스템 생성)
   * - 원본 시스템의 항성과 행성들을 모두 복제합니다
   * - created_via: 'CLONE'으로 설정됩니다
   * - original_author_id와 source_system_id가 설정됩니다
   */
  async cloneStellarSystem(userId: string, dto: CloneStellarSystemDto) {
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

    // 대상 갤럭시 존재 및 소유자 확인
    const galaxy = await this.prisma.galaxy.findUnique({
      where: { id: dto.galaxy_id },
      select: { id: true, owner_id: true },
    });

    if (!galaxy) {
      throw new NotFoundException('대상 갤럭시를 찾을 수 없습니다.');
    }

    if (galaxy.owner_id !== userId) {
      throw new ForbiddenException('대상 갤럭시에 대한 권한이 없습니다.');
    }

    // 트랜잭션으로 시스템, 항성, 행성 모두 클론
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. 새 스텔라 시스템 생성 (클론)
      const clonedSystem = await tx.stellarSystem.create({
        data: {
          title: dto.name,
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
      let clonedStar = null;
      if (sourceSystem.star) {
        clonedStar = await tx.star.create({
          data: {
            system_id: clonedSystem.id,
            name: sourceSystem.star.name,
            properties: sourceSystem.star.properties,
          },
        });
      }

      // 3. 행성들 복제
      const clonedPlanets = [];
      for (const planet of sourceSystem.planets) {
        const clonedPlanet = await tx.planet.create({
          data: {
            system_id: clonedSystem.id,
            name: planet.name,
            instrument_role: planet.instrument_role,
            is_active: planet.is_active,
            properties: planet.properties,
          },
        });
        clonedPlanets.push(clonedPlanet);
      }

      // 4. 복제된 시스템 정보 반환
      return {
        id: clonedSystem.id,
        name: clonedSystem.title,
        galaxy_id: clonedSystem.galaxy_id,
        owner_id: clonedSystem.owner_id,
        created_by_id: clonedSystem.created_by_id,
        original_author_id: clonedSystem.original_author_id,
        source_system_id: clonedSystem.source_system_id,
        created_via: clonedSystem.created_via,
        created_at: clonedSystem.created_at,
        updated_at: clonedSystem.updated_at,
        star: clonedStar,
        planets: clonedPlanets,
      };
    });

    return result;
  }

  /**
   * 스텔라 시스템 수정 (기본 정보만, 항성/행성은 별도 메서드)
   */
  async updateStellarSystem(id: string, userId: string, dto: UpdateStellarSystemDto) {
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

    // 업데이트 실행 (Prisma 스키마의 실제 필드명 사용)
    return this.prisma.stellarSystem.update({
      where: { id },
      data: {
        title: dto.name, // name → title 매핑
        // description 필드가 스키마에 없으므로 제거
      },
      include: {
        star: true,
        planets: true,
      },
    });
  }

  /**
   * 스텔라 시스템 삭제 (항성도 함께 자동 삭제)
   */
  async deleteStellarSystem(id: string, userId: string) {
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
    return this.prisma.stellarSystem.delete({
      where: { id },
    });
  }

  // === 기존 compose 메서드 (레거시 호환성) ===
  /**
   * 하나의 트랜잭션으로:
   *  - 새 Galaxy 생성 or 기존 Galaxy 사용
   *  - 각 System: 기존 연결 or 새로 생성
   *  - 각 Planet: 새로 생성 (기존 연결 기능이 필요하면 connect 로직 추가 가능)
   *  - 생성 메타는 인증 userId 기준으로 세팅
   *  - 최종적으로 갤럭시 전체 상태(include) 리턴
   */
  async compose(userId: string, dto: ComposeRequestDto) {
    return this.prisma.$transaction(async tx => {
      // 1. Galaxy: 기존 or 새로 생성
      let galaxyId = dto.galaxy_id;

      if (galaxyId) {
        // 기존 갤럭시 존재 확인
        const existingGalaxy = await tx.galaxy.findUnique({
          where: { id: galaxyId },
          select: { id: true, owner_id: true },
        });
        if (!existingGalaxy) {
          throw new NotFoundException('해당 갤럭시를 찾을 수 없습니다.');
        }
        // 소유자 확인
        if (existingGalaxy.owner_id !== userId) {
          throw new ForbiddenException('이 갤럭시에 대한 권한이 없습니다.');
        }
      } else {
        // 새 갤럭시 생성
        const newGalaxy = await tx.galaxy.create({
          data: { name: dto.galaxy_name!, owner_id: userId },
          select: { id: true },
        });
        galaxyId = newGalaxy.id;
      }

      // 2. Systems & Planets 처리
      for (const systemDto of dto.systems) {
        let systemId = systemDto.system_id;

        if (!systemId) {
          // 새 시스템 생성
          const createdSystem = await tx.stellarSystem.create({
            data: {
              galaxy_id: galaxyId!,
              title: systemDto.title!, // DTO 검증으로 보장
              owner_id: userId,
              created_by_id: userId,
              original_author_id: userId,
              created_via: 'MANUAL',
              planets: systemDto.planets?.length
                ? { 
                    create: systemDto.planets.map(p => ({
                      name: p.name,
                      planet_type: p.planet_type || 'PLANET',
                      instrument_role: p.instrument_role || null,
                      is_active: p.is_active ?? true,
                      properties: p.properties || {},
                    })),
                  }
                : undefined,
            },
            select: { id: true },
          });
          systemId = createdSystem.id;
        } else {
          // 기존 시스템에 행성 추가
          const existingSystem = await tx.stellar_system.findUnique({
            where: { id: systemId },
            select: { id: true, galaxy_id: true, owner_id: true },
          });
          if (!existingSystem) {
            throw new NotFoundException('해당 시스템을 찾을 수 없습니다.');
          }
          // 소유자 및 갤럭시 일치 확인
          if (
            existingSystem.owner_id !== userId ||
            existingSystem.galaxy_id !== galaxyId
          ) {
            throw new ForbiddenException(
              '이 시스템에 대한 권한이 없거나 갤럭시가 일치하지 않습니다.'
            );
          }
          // 행성 추가
          if (systemDto.planets?.length) {
            for (const planetDto of systemDto.planets) {
              await tx.planet.create({
                data: { 
                  system_id: systemId, 
                  name: planetDto.name,
                  planet_type: planetDto.planet_type || 'PLANET',
                  instrument_role: planetDto.instrument_role || null,
                  is_active: planetDto.is_active ?? true,
                  properties: planetDto.properties || {},
                },
              });
            }
          }
        }
      }
      // 3) 최종 결과: 갤럭시 전체 상태 반환
      const result = await tx.galaxy.findUnique({
        where: { id: galaxyId! },
        include: {
          owner: { select: { id: true, user_name: true } },
          stellar_systems: {
            orderBy: { created_at: 'desc' },
            include: { planets: { orderBy: { created_at: 'desc' } } },
          },
        },
      });
      return result;
    });
  }

  /**
   * 갤럭시 ID로 시스템들 조회
   * pagination 적용
   */
  async readAllCompose(galaxyId: string, pagination: PaginationDto) {
    // 갤럭시 존재 확인
    const galaxy = await this.prisma.galaxy.findUnique({
      where: { id: galaxyId },
      select: {
        id: true,
        name: true,
        owner_id: true,
        created_at: true,
        updated_at: true,
      },
    });
    if (!galaxy) throw new NotFoundException('해당 갤럭시를 찾을 수 없습니다.');

    const systems = await this.prisma.stellarSystem.findMany({
      where: { galaxy_id: galaxyId },
      skip: pagination.skip,
      take: pagination.take,
      orderBy: { created_at: 'desc' },
      include: {
        planets: {
          orderBy: { created_at: 'desc' },
          // pattern까지 필요하면 ↓
          // include: { pattern: true },
        },
      },
    });

    return { ...galaxy, stellar_systems: systems };
  }

  /**
   * 내가 만든 시스템만 조회 가능 (created_by_id 기준)
   * 권한 없으면 403
   */
  async readMyAllCompose(
    userId: string,
    systemId: string,
    pagination: PaginationDto
  ) {
    const { skip, take, page = 1, limit = 20 } = pagination;

    //1. 시스템 존재 및 소유 확인
    const system = await this.prisma.stellarSystem.findUnique({
      where: { id: systemId },
      select: {
        id: true,
        title: true,
        owner_id: true, // 참고용
        created_at: true,
        updated_at: true,
        galaxy: { select: { id: true, name: true, owner_id: true } },
        planets: { take, skip, orderBy: { created_at: 'desc' } },
        // pattern까지 필요하면 ↓
        // include: { pattern: true },
      },
    });
    if (!system) throw new NotFoundException('해당 시스템을 찾을 수 없습니다.');
    if (system.owner_id !== userId) {
      throw new ForbiddenException('이 시스템에 대한 권한이 없습니다.');
    }

    // 2) 플래닛 카운트 → 페이지 보정
    const total = await this.prisma.planet.count({
      where: { system_id: systemId },
    });

    // total=0 처리: 페이지는 1로 고정, 결과는 빈 배열
    if (total === 0) {
      return {
        ...system,
        planets: [],
        pagination: { total, page: 1, limit, totalPages: 0 },
      };
    }

    const totalPages = Math.ceil(total / limit);
    const currentPage = Math.min(Math.max(1, page), totalPages);
    const planetSkip = (currentPage - 1) * limit;

    // 3) 플래닛 페이지네이션 조회 (필요 시 pattern 포함)
    const planets = await this.prisma.planet.findMany({
      where: { system_id: systemId },
      orderBy: { created_at: 'desc' },
      skip: planetSkip,
      take: limit,
      // pattern까지 필요하면 ↓
      // ...(inc ? { include: { pattern: true } } : {}),
    });

    // 4) compose 형태로 반환
    return {
      ...system,
      planets,
      pagination: { total, page: currentPage, limit, totalPages },
    };
  }

  /*
   *  단일 시스템 번들 조회
   *  - system + system.planets(+pattern)
   *  - galaxy 메타 + (옵션) galaxy.stellar_systems(+planets)
   *  - 인증 필요 없음
   */
  async readOneCompose(systemId: string, includeGalaxySystems = false) {
    // 1) 시스템 및 행성 조회 (패턴 포함 가능)
    const system = await this.prisma.stellarSystem.findUnique({
      where: { id: systemId },
      include: {
        planets: { orderBy: { created_at: 'desc' } },
        // pattern까지 필요하면 ↓
        // include: { pattern: true },
      },
    });
    if (!system) throw new NotFoundException('시스템을 찾을 수 없습니다.');
    // 2) 갤럭시 메타 조회
    const galaxy = await this.prisma.galaxy.findUnique({
      where: { id: system.galaxy_id },
      select: {
        id: true,
        name: true,
        owner_id: true,
        created_at: true,
        updated_at: true,
        ...(includeGalaxySystems
          ? {
              stellar_systems: {
                orderBy: { created_at: 'desc' },
                include: { planets: { orderBy: { created_at: 'desc' } } },
              },
            }
          : {}),
      },
    });
    if (!galaxy) {
      throw new NotFoundException('연결된 갤럭시를 찾을 수 없습니다.');
    }
    return { ...galaxy, stellar_system: system };
  }

  /*
   *내가 만든 시스템 단일 조회
   * - created_by_id 기준
   * - 권한 없으면 403
   * - system + planets(+pattern)
   *   - galaxy 메타 + (옵션) galaxy.stellar_systems(+planets)
   * - 인증 필요
   */
  async readMyOneCompose(
    userId: string,
    systemId: string,
    includeGalaxySystems = false
  ) {
    // 1. 시스템 존재 및 소유 확인
    this.checkSystemOwner({ userId, systemId });
    // 2. 시스템 및 행성 조회 (패턴 포함 가능)
    const system = await this.prisma.stellarSystem.findUnique({
      where: { id: systemId },
      include: {
        planets: { orderBy: { created_at: 'desc' } },
        // pattern까지 필요하면 ↓
        // include: { pattern: true },
      },
    });
    if (!system) throw new NotFoundException('시스템을 찾을 수 없습니다.');
    // 3. 갤럭시 메타 조회
    const galaxy = await this.prisma.galaxy.findUnique({
      where: { id: system.galaxy_id },
      select: {
        id: true,
        name: true,
        owner_id: true,
        created_at: true,
        updated_at: true,
        ...(includeGalaxySystems
          ? {
              stellar_systems: {
                orderBy: { created_at: 'desc' },
                include: { planets: { orderBy: { created_at: 'desc' } } },
              },
            }
          : {}),
      },
    });
    if (!galaxy) {
      throw new NotFoundException('연결된 갤럭시를 찾을 수 없습니다.');
    }
    return { ...galaxy, stellar_system: system };
  }

  private async checkSystemOwner({
    userId,
    systemId,
  }: {
    userId: string;
    systemId: string;
  }) {
    throw new Error('해당 기능을 지원하지 않습니다');
  }

  /**
   * 내가 작성한 스텔라 카운트
   */
  async countMyStellaSystem(userId: string): Promise<number> {
    return this.prisma.stellarSystem.count({
      where: { owner_id: userId },
    });
  }
}
