import {
  Prisma,
  PrismaClient,
  StellarSystem,
  Star,
  Planet,
} from '@prisma/client';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
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

// Prisma.TransactionClient 타입을 명시적으로 사용하기 위한 타입 정의
type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

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
    dto: CreateStellarSystemDto,
  ): Promise<StellarSystemResponseDto> {
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

    const result = await this.prisma.$transaction(
      async (tx: TransactionClient) => {
        // 1. 스텔라 시스템 생성 (스키마의 모든 필수 필드 포함)
        const system = await tx.stellarSystem.create({
          data: {
            title: dto.title,
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
          ...dto.star_properties, // 사용자 제공 속성으로 덮어쓰기
        };

        const star = await tx.star.create({
          data: {
            system_id: system.id,
            properties: defaultStarProperties as unknown as Prisma.JsonObject,
          },
        });

        // 3. 생성된 시스템과 항성 정보 반환
        return this.mapToStellarSystemResponseDto(system, star, []);
      },
    );

    return result;
  }

  /**
   * 스텔라 시스템 조회 (항성 및 행성 포함)
   */
  async getStellarSystem(
    id: string,
    userId: string,
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
      system.planets,
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
    dto: CloneStellarSystemDto,
  ): Promise<StellarSystemResponseDto> {
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
    const result = await this.prisma.$transaction(
      async (tx: TransactionClient) => {
        // 1. 새 스텔라 시스템 생성 (클론)
        const clonedSystem = await tx.stellarSystem.create({
          data: {
            title: dto.title,
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
              properties:
                sourceSystem.star.properties as unknown as Prisma.JsonObject,
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
              properties:
                planet.properties as unknown as Prisma.JsonObject,
            },
          });
          clonedPlanets.push(clonedPlanet);
        }

        // 4. 복제된 시스템 정보 반환 (프론트엔드 호환 DTO 형식)
        return this.mapToStellarSystemResponseDto(
          clonedSystem,
          clonedStar,
          clonedPlanets,
        );
      },
    );

    return result;
  }

  /**
   * 스텔라 시스템 수정 (기본 정보만, 항성/행성은 별도 메서드)
   */
  async updateStellarSystem(
    id: string,
    userId: string,
    dto: UpdateStellarSystemDto,
  ): Promise<StellarSystemResponseDto> {
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
    const updatedSystem = await this.prisma.stellarSystem.update({
      where: { id },
      data: {
        title: dto.title,
      },
      include: {
        star: true,
        planets: true,
      },
    });

    // DTO 형식으로 반환 (프론트엔드 호환)
    return this.mapToStellarSystemResponseDto(
      updatedSystem,
      updatedSystem.star,
      updatedSystem.planets,
    );
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
    planets: Planet[],
  ): StellarSystemResponseDto {
    return {
      id: system.id,
      title: system.title,
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
            properties: star.properties as unknown as StarPropertiesDto,
            created_at: star.created_at,
            updated_at: star.updated_at,
          }
        : null,
      planets: planets.map(planet => ({
        id: planet.id,
        system_id: planet.system_id,
        name: planet.name,
        role: planet.instrument_role as InstrumentRole, // instrument_role을 role로 매핑
        properties: planet.properties as unknown as PlanetPropertiesDto,
        created_at: planet.created_at,
        updated_at: planet.updated_at,
      })),
      created_at: system.created_at,
      updated_at: system.updated_at,
    };
  }
}