import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Delete,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { StellarSystemService } from './stellar-systems.service';
import { User } from '../../auth/decorator/user.decorator';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBody,
} from '@nestjs/swagger';
import {
  CreateStellarSystemDto,
  UpdateStellarSystemDto,
  CloneStellarSystemDto,
  StellarSystemResponseDto,
  MyStellarSystemsResponseDto,
} from './dto/stellar-system.dto';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';

@ApiTags('스텔라시스템 정보 관리')
@Controller('stellar-systems')
export class StellarSystemController {
  constructor(private readonly stellarSystemService: StellarSystemService) {}

  /**
   * 새로운 스텔라 시스템 생성 (항성 자동 생성 포함)
   * - 인증 필요
   * - 스텔라 시스템과 항성이 동시에 생성되며, 초기 행성들도 함께 생성할 수 있습니다
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '스텔라 시스템 생성',
    description:
      '새로운 스텔라 시스템을 생성합니다. 항성은 자동으로 생성되며, 초기 행성들도 함께 생성할 수 있습니다.\n\n주의: 본 API(POST)와 수정 API(PUT)는 동일한 바디 구조를 사용합니다. PUT에서는 title/star/planets 중 제공된 필드만 반영됩니다.',
  })
  @ApiBody({
    description: '생성 요청 바디 예시',
    type: CreateStellarSystemDto,
    examples: {
      default: {
        summary: '기본 생성 예시',
        value: {
          title: '나의 첫 번째 스텔라 시스템',
          galaxy_id: 'gal_s7k9m2x1n5',
          position: [125.5, -8.2, 340.0],
          star: {
            spin: 65,
            brightness: 80,
            color: 210,
            size: 55,
          },
          planets: [
            {
              name: '리듬 행성',
              role: 'DRUM',
              properties: {
                size: 45,
                color: 15,
                brightness: 85,
                distance: 8,
                speed: 70,
                tilt: 5,
                spin: 40,
                eccentricity: 30,
                elevation: 0,
                phase: 0,
              },
            },
            {
              name: '베이스 행성',
              role: 'BASS',
              properties: {
                size: 60,
                color: 240,
                brightness: 60,
                distance: 15,
                speed: 35,
                tilt: -10,
                spin: 25,
                eccentricity: 20,
                elevation: -5,
                phase: 90,
              },
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: '스텔라 시스템 생성 성공',
    type: StellarSystemResponseDto,
    schema: {
      example: {
        id: 'sys_p8q2r5t1w9',
        title: '나의 첫 번째 스텔라 시스템',
        galaxy_id: 'gal_s7k9m2x1n5',
        position: [125.5, -8.2, 340.0],
        creator_id: 'usr_a3b7c9d2e6',
        author_id: 'usr_a3b7c9d2e6',
        create_source_id: 'sys_p8q2r5t1w9',
        create_source_name: '나의 첫 번째 스텔라 시스템',
        original_source_id: 'sys_p8q2r5t1w9',
        original_source_name: '나의 첫 번째 스텔라 시스템',
        description: null,
        created_via: 'MANUAL',
        star: {
          id: 'str_k4l8m1n6p2',
          spin: 65,
          brightness: 80,
          color: 210,
          size: 55,
        },
        planets: [
          {
            id: 'pln_x9y3z7a5b1',
            name: '리듬 행성',
            role: 'DRUM',
            properties: {
              size: 45,
              color: 15,
              brightness: 85,
              distance: 8,
              speed: 70,
              tilt: 5,
              spin: 40,
              eccentricity: 30,
              elevation: 0,
              phase: 0,
            },
          },
          {
            id: 'pln_c2d6e1f9g4',
            name: '베이스 행성',
            role: 'BASS',
            properties: {
              size: 60,
              color: 240,
              brightness: 60,
              distance: 15,
              speed: 35,
              tilt: -10,
              spin: 25,
              eccentricity: 20,
              elevation: -5,
              phase: 90,
            },
          },
        ],
        created_at: '2025-09-17T10:30:00.000Z',
        updated_at: '2025-09-17T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '갤럭시를 찾을 수 없음',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: '갤럭시에 대한 권한 없음',
    type: ErrorResponseDto,
  })
  async createStellarSystem(
    @User('id') userId: string,
    @Body() createDto: CreateStellarSystemDto
  ): Promise<StellarSystemResponseDto> {
    return this.stellarSystemService.createStellarSystem(userId, createDto);
  }

  /**
   * 스텔라 시스템 클론 (원본을 복제하여 새 시스템 생성)
   * - 인증 필요
   * - 원본 시스템의 항성과 행성들을 모두 복제합니다
   * - created_via: 'CLONE'으로 설정됩니다
   */
  @Post('clone')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '스텔라 시스템 클론',
    description: `기존 스텔라 시스템을 복제하여 새로운 시스템을 생성합니다. 항성과 행성들이 모두 복제됩니다.

- **소유권**: 새로운 시스템의 \`creator_id\`는 요청한 사용자가 됩니다.
- **원작자**: 원본 시스템의 \`author_id\`가 그대로 계승됩니다.
- **클론 출처**:
  - \`create_source_id\`는 원본 시스템의 ID로 설정됩니다.
  - \`original_source_id\`는 원본의 \`original_source_id\`를 따르며, 원본이 최초일 경우 원본 ID로 설정됩니다. 이를 통해 클론 체인의 최초 원본을 계속 추적할 수 있습니다.`,
  })
  @ApiResponse({
    status: 201,
    description: '스텔라 시스템 클론 성공',
    type: StellarSystemResponseDto,
    schema: {
      example: {
        id: 'sys_h7j2k8l3m9',
        title: '안드로메다-7 (클론)',
        galaxy_id: 'gal_v4w8x2y6z1',
        position: [200.0, 5.5, -150.3],
        creator_id: 'usr_n9o5p1q7r3',
        author_id: 'usr_a3b7c9d2e6',
        create_source_id: 'sys_p8q2r5t1w9',
        create_source_name: '나의 첫 번째 스텔라 시스템',
        original_source_id: 'sys_p8q2r5t1w9',
        original_source_name: '나의 첫 번째 스텔라 시스템',
        description: '원본 시스템을 복제하여 생성',
        created_via: 'CLONE',
        star: {
          id: 'str_t8u4v2w9x5',
          spin: 65,
          brightness: 80,
          color: 210,
          size: 55,
        },
        planets: [
          {
            id: 'pln_f6g1h8i3j7',
            name: '리듬 행성',
            role: 'DRUM',
            properties: {
              size: 45,
              color: 15,
              brightness: 85,
              distance: 8,
              speed: 70,
              tilt: 5,
              spin: 40,
              eccentricity: 30,
              elevation: 0,
              phase: 0,
            },
          },
          {
            id: 'pln_m2n7o4p8q1',
            name: '베이스 행성',
            role: 'BASS',
            properties: {
              size: 60,
              color: 240,
              brightness: 60,
              distance: 15,
              speed: 35,
              tilt: -10,
              spin: 25,
              eccentricity: 20,
              elevation: -5,
              phase: 90,
            },
          },
        ],
        created_at: '2025-09-17T11:15:00.000Z',
        updated_at: '2025-09-17T11:15:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '원본 시스템을 찾을 수 없음',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: '갤럭시에 대한 권한 없음',
    type: ErrorResponseDto,
  })
  async cloneStellarSystem(
    @User('id') userId: string,
    @Body() cloneDto: CloneStellarSystemDto
  ): Promise<StellarSystemResponseDto> {
    return this.stellarSystemService.cloneStellarSystem(userId, cloneDto);
  }

  /**
   * 내가 소유한 스텔라 시스템 목록 조회 (페이지네이션 지원)
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '내가 소유한 스텔라 시스템 목록 조회',
    description:
      '현재 로그인한 사용자가 소유한 스텔라 시스템 목록을 조회합니다. 좋아요 수 기준으로 순위가 매겨지며, 페이지네이션을 지원합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '조회 성공',
    type: MyStellarSystemsResponseDto,
    schema: {
      example: {
        data: [
          {
            system: {
              id: 'sys_987',
              title: '안드로메다-7',
              galaxy_id: 'gal_777',
              creator_id: 'usr_999',
              created_at: '2025-08-01T00:00:00.000Z',
              updated_at: '2025-09-10T00:00:00.000Z',
            },
            like_count: 42,
            planet_count: 9,
            rank: 1,
          },
          {
            system: {
              id: 'sys_654',
              title: '페가수스-3',
              galaxy_id: 'gal_222',
              creator_id: 'usr_555',
              created_at: '2025-07-11T00:00:00.000Z',
              updated_at: '2025-09-09T00:00:00.000Z',
            },
            like_count: 37,
            planet_count: 6,
            rank: 2,
          },
        ],
        meta: {
          page: 1,
          limit: 20,
          total: 250,
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
    type: ErrorResponseDto,
  })
  async getMyStellarSystems(
    @User('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ): Promise<MyStellarSystemsResponseDto> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;

    // 페이지와 리미트 값 검증
    const validPage = Math.max(1, pageNum);
    const validLimit = Math.min(Math.max(1, limitNum), 100); // 최대 100개까지

    return this.stellarSystemService.getMyStellarSystems(
      userId,
      validPage,
      validLimit
    );
  }

  /**
   * 내가 소유한 스텔라 시스템 개수 조회
   */
  @Get('me/count')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '내가 소유한 스텔라 시스템 개수 조회',
    description:
      '현재 로그인한 사용자가 소유한 스텔라 시스템의 총 개수를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '조회 성공',
    schema: {
      type: 'object',
      properties: {
        count: {
          type: 'number',
          description: '내가 소유한 스텔라 시스템 개수',
          example: 42,
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
    type: ErrorResponseDto,
  })
  async getMyStellarSystemCount(
    @User('id') userId: string
  ): Promise<{ count: number }> {
    const count = await this.stellarSystemService.countMyStellarSystems(userId);
    return { count };
  }

  /**
   * 갤럭시 내 스텔라 시스템 목록 조회 (간소 정보)
   * 비회원도 조회 가능
   */
  @Get('galaxy/:galaxyId/systems')
  @ApiOperation({
    summary: '갤럭시 내 스텔라 시스템 전체 조회',
    description:
      '특정 갤럭시에 속한 모든 스텔라 시스템의 간소 정보를 조회합니다. 인증이 필요하지 않으며, 위치 좌표와 항성 색상 정보를 포함합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '갤럭시 내 스텔라 시스템 목록 조회 성공',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', description: '스텔라 시스템 ID' },
          title: { type: 'string', description: '스텔라 시스템 이름' },
          position: {
            type: 'array',
            items: { type: 'number' },
            description: '갤럭시 내 위치 좌표 [x, y, z]',
          },
          color: {
            type: 'number',
            description: '항성 색상 값 (hue)',
          },
        },
      },
      example: [
        {
          id: 'sys_p8q2r5t1w9',
          title: '나의 첫 번째 스텔라 시스템',
          position: [125.5, -8.2, 340.0],
          color: 210,
        },
        {
          id: 'sys_h7j2k8l3m9',
          title: '안드로메다-7',
          position: [200.0, 5.5, -150.3],
          color: 45,
        },
        {
          id: 'sys_b4c9d1e7f2',
          title: '오리온 벨트',
          position: [-300.8, 12.1, 85.6],
          color: 320,
        },
        {
          id: 'sys_q3r8s2t6u1',
          title: '카시오페아 A',
          position: [0.0, -15.0, 500.9],
          color: 120,
        },
      ],
    },
  })
  @ApiResponse({
    status: 404,
    description: '갤럭시를 찾을 수 없음',
    type: ErrorResponseDto,
  })
  async getGalaxyStellarSystems(@Param('galaxyId') galaxyId: string): Promise<
    Array<{
      id: string;
      title: string;
      position: number[];
      color: number;
    }>
  > {
    return await this.stellarSystemService.getGalaxyStellarSystems(galaxyId);
  }

  /**
   * 스텔라 시스템 조회 (항성 및 행성 포함)
   * 비회원도 조회 가능
   */
  @Get(':id')
  @ApiOperation({
    summary: '스텔라 시스템 조회 (항성 및 행성 포함)',
    description:
      '스텔라 시스템을 조회합니다. 인증이 필요하지 않으며 누구나 조회할 수 있습니다.',
  })
  @ApiResponse({
    status: 200,
    description: '스텔라 시스템 조회 성공',
    type: StellarSystemResponseDto,
    schema: {
      example: {
        id: 'sys_p8q2r5t1w9',
        title: '나의 첫 번째 스텔라 시스템',
        galaxy_id: 'gal_s7k9m2x1n5',
        position: [125.5, -8.2, 340.0],
        creator_id: 'usr_a3b7c9d2e6',
        author_id: 'usr_a3b7c9d2e6',
        create_source_id: 'sys_p8q2r5t1w9',
        create_source_name: '나의 첫 번째 스텔라 시스템',
        original_source_id: 'sys_p8q2r5t1w9',
        original_source_name: '나의 첫 번째 스텔라 시스템',
        description: '나의 첫 번째 음악 창작물',
        created_via: 'MANUAL',
        star: {
          id: 'str_k4l8m1n6p2',
          spin: 65,
          brightness: 80,
          color: 210,
          size: 55,
        },
        planets: [
          {
            id: 'pln_x9y3z7a5b1',
            name: '리듬 행성',
            role: 'DRUM',
            properties: {
              size: 45,
              color: 15,
              brightness: 85,
              distance: 8,
              speed: 70,
              tilt: 5,
              spin: 40,
              eccentricity: 30,
              elevation: 0,
              phase: 0,
            },
          },
          {
            id: 'pln_c2d6e1f9g4',
            name: '베이스 행성',
            role: 'BASS',
            properties: {
              size: 60,
              color: 240,
              brightness: 60,
              distance: 15,
              speed: 35,
              tilt: -10,
              spin: 25,
              eccentricity: 20,
              elevation: -5,
              phase: 90,
            },
          },
          {
            id: 'pln_i5j9k3l7m1',
            name: '멜로디 행성',
            role: 'MELODY',
            properties: {
              size: 75,
              color: 120,
              brightness: 70,
              distance: 25,
              speed: 45,
              tilt: 15,
              spin: 60,
              eccentricity: 10,
              elevation: 10,
              phase: 180,
            },
          },
        ],
        created_at: '2025-09-17T10:30:00.000Z',
        updated_at: '2025-09-17T14:20:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '스텔라 시스템을 찾을 수 없음',
    type: ErrorResponseDto,
  })
  async getStellarSystem(
    @Param('id') id: string
  ): Promise<StellarSystemResponseDto> {
    return this.stellarSystemService.getStellarSystem(id);
  }

  /**
   * 스텔라 시스템 수정
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '스텔라 시스템 수정' })
  @ApiBody({
    description:
      '수정 요청 바디 예시 (POST와 동일한 구조를 사용합니다. title/star/planets 중 제공된 필드만 반영됩니다).',
    type: UpdateStellarSystemDto,
    examples: {
      titleOnly: {
        summary: '제목만 수정',
        value: {
          title: '업데이트된 스텔라 시스템',
        },
      },
      positionOnly: {
        summary: '위치만 수정',
        value: {
          position: [500.0, -12.5, 200.8],
        },
      },
      full: {
        summary: '전체 편집 예시',
        value: {
          title: '완전히 새로운 스텔라 시스템',
          position: [750.2, 8.1, -420.6],
          description: '대폭 업데이트된 시스템',
          star: {
            spin: 75,
            brightness: 90,
            color: 300,
            size: 65,
          },
          planets: [
            {
              id: 'pln_x9y3z7a5b1',
              name: '파워풀 드럼',
              role: 'DRUM',
              properties: {
                size: 50,
                color: 0,
                brightness: 95,
                distance: 12,
                speed: 80,
                tilt: 15,
                spin: 50,
                eccentricity: 25,
                elevation: 5,
                phase: 0,
              },
            },
            {
              name: '딥 베이스',
              role: 'BASS',
              properties: {
                size: 70,
                color: 270,
                brightness: 40,
                distance: 20,
                speed: 30,
                tilt: -5,
                spin: 15,
                eccentricity: 35,
                elevation: -10,
                phase: 270,
              },
            },
            {
              name: '하모니 패드',
              role: 'PAD',
              properties: {
                size: 85,
                color: 60,
                brightness: 65,
                distance: 35,
                speed: 20,
                tilt: 0,
                spin: 10,
                eccentricity: 5,
                elevation: 15,
                phase: 90,
              },
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '스텔라 시스템 수정 성공',
    type: StellarSystemResponseDto,
    schema: {
      example: {
        id: 'sys_p8q2r5t1w9',
        title: '완전히 새로운 스텔라 시스템',
        galaxy_id: 'gal_s7k9m2x1n5',
        position: [750.2, 8.1, -420.6],
        creator_id: 'usr_a3b7c9d2e6',
        author_id: 'usr_a3b7c9d2e6',
        create_source_id: 'sys_p8q2r5t1w9',
        create_source_name: '완전히 새로운 스텔라 시스템',
        original_source_id: 'sys_p8q2r5t1w9',
        original_source_name: '완전히 새로운 스텔라 시스템',
        description: '대폭 업데이트된 시스템',
        created_via: 'MANUAL',
        star: {
          id: 'str_k4l8m1n6p2',
          spin: 75,
          brightness: 90,
          color: 300,
          size: 65,
        },
        planets: [
          {
            id: 'pln_x9y3z7a5b1',
            name: '파워풀 드럼',
            role: 'DRUM',
            properties: {
              size: 50,
              color: 0,
              brightness: 95,
              distance: 12,
              speed: 80,
              tilt: 15,
              spin: 50,
              eccentricity: 25,
              elevation: 5,
              phase: 0,
            },
          },
          {
            id: 'pln_s4t8u2v6w3',
            name: '딥 베이스',
            role: 'BASS',
            properties: {
              size: 70,
              color: 270,
              brightness: 40,
              distance: 20,
              speed: 30,
              tilt: -5,
              spin: 15,
              eccentricity: 35,
              elevation: -10,
              phase: 270,
            },
          },
          {
            id: 'pln_y7z1a5b9c3',
            name: '하모니 패드',
            role: 'PAD',
            properties: {
              size: 85,
              color: 60,
              brightness: 65,
              distance: 35,
              speed: 20,
              tilt: 0,
              spin: 10,
              eccentricity: 5,
              elevation: 15,
              phase: 90,
            },
          },
        ],
        created_at: '2025-09-17T10:30:00.000Z',
        updated_at: '2025-09-17T16:45:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '스텔라 시스템을 찾을 수 없음',
    type: ErrorResponseDto,
  })
  async updateStellarSystem(
    @Param('id') id: string,
    @User('id') userId: string,
    @Body() updateDto: UpdateStellarSystemDto
  ): Promise<StellarSystemResponseDto> {
    return this.stellarSystemService.updateStellarSystem(id, userId, updateDto);
  }

  /**
   * 스텔라 시스템 삭제 (항성도 함께 삭제됨)
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '스텔라 시스템 삭제',
    description:
      '스텔라 시스템을 삭제합니다. 포함된 항성과 행성들도 함께 삭제됩니다.',
  })
  @ApiResponse({
    status: 200,
    description: '삭제 성공',
  })
  @ApiResponse({
    status: 404,
    description: '스텔라 시스템을 찾을 수 없음',
    type: ErrorResponseDto,
  })
  async deleteStellarSystem(
    @Param('id') id: string,
    @User('id') userId: string
  ): Promise<void> {
    await this.stellarSystemService.deleteStellarSystem(id, userId);
  }
}
