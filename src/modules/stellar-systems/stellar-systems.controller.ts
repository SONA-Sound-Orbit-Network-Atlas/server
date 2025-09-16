import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Delete,
  Param,
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
          title: 'My First System',
          galaxy_id: 'gal_abc123',
          star: { spin: 50, brightness: 75, color: 60, size: 50 },
          planets: [
            {
              name: 'Rhythm Planet',
              role: 'DRUM',
              properties: {
                size: 50,
                color: 180,
                brightness: 75,
                distance: 10,
                speed: 50,
                tilt: 0,
                spin: 30,
                eccentricity: 45,
                elevation: 0,
                phase: 0,
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
    @User('userId') userId: string,
    @Body() cloneDto: CloneStellarSystemDto
  ): Promise<StellarSystemResponseDto> {
    return this.stellarSystemService.cloneStellarSystem(userId, cloneDto);
  }

  /**
   * 스텔라 시스템 조회 (항성 및 행성 포함)
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '스텔라 시스템 조회 (항성 및 행성 포함)' })
  @ApiResponse({
    status: 200,
    description: '조회 성공',
    type: StellarSystemResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '스텔라 시스템을 찾을 수 없음',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: '시스템에 대한 권한 없음',
    type: ErrorResponseDto,
  })
  async getStellarSystem(
    @Param('id') id: string,
    @User('userId') userId: string
  ): Promise<StellarSystemResponseDto> {
    return this.stellarSystemService.getStellarSystem(id, userId);
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
      full: {
        summary: '전체 편집 예시',
        value: {
          title: 'Updated System',
          star: { spin: 62, brightness: 70, color: 220, size: 60 },
          planets: [
            {
              id: 'pln_abc123',
              name: 'Kick',
              role: 'DRUM',
              properties: {
                size: 35,
                color: 20,
                brightness: 80,
                distance: 5,
                speed: 70,
                tilt: 10,
                spin: 40,
                eccentricity: 15,
                elevation: 0,
                phase: 0,
              },
            },
            {
              name: 'Bass One',
              role: 'BASS',
              properties: {
                size: 60,
                color: 120,
                brightness: 50,
                distance: 8,
                speed: 40,
                tilt: 0,
                spin: 20,
                eccentricity: 10,
                elevation: -1,
                phase: 0.25,
              },
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '수정 성공',
    type: StellarSystemResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '스텔라 시스템을 찾을 수 없음',
    type: ErrorResponseDto,
  })
  async updateStellarSystem(
    @Param('id') id: string,
    @User('userId') userId: string,
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
    @User('userId') userId: string
  ): Promise<void> {
    await this.stellarSystemService.deleteStellarSystem(id, userId);
  }

  /**
   * 내가 만든 스텔라 시스템수
   */
  @Get('me/count')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내가 만든 항성계 수 조회' })
  @ApiResponse({
    status: 200,
    description: '성공',
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '존재하지 않음',
    type: ErrorResponseDto,
  })
  async getMyStellarSystemCount(
    @User('userId') userId: string
  ): Promise<number> {
    return this.stellarSystemService.countMyStellaSystem(userId);
  }
}
