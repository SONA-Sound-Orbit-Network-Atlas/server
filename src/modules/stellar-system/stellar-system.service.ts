import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ComposeRequestDto } from './dto/stellar-system.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class StellarSystemService {
  constructor(private readonly prisma: PrismaService) {}
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
          const createdSystem = await tx.stellar_system.create({
            data: {
              galaxy_id: galaxyId!,
              title: systemDto.title!, // DTO 검증으로 보장
              owner_id: userId,
              created_by_id: userId,
              original_author_id: userId,
              created_via: 'MANUAL',
              planets: systemDto.planets?.length
                ? { create: systemDto.planets.map(p => ({ name: p.name })) }
                : undefined,
              /** 
                 *  with patterns 저장 
                patterns: systemDto.patterns?.length // patterns가 배열로 들어온다고 가정
                ? { create: systemDto.patterns.map(pt => ({ ...pt })) }
                : undefined,
                */
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
                data: { system_id: systemId, name: planetDto.name },
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
   * 특정 시스템 단건 조회
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
  
}
