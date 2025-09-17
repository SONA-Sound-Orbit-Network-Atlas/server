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
  ApiQuery,
} from '@nestjs/swagger';
import {
  CreateStellarSystemDto,
  UpdateStellarSystemDto,
  CloneStellarSystemDto,
  StellarSystemResponseDto,
  MyStellarSystemsResponseDto,
  GalaxySystemSummaryDto,
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
    description: '스텔라 시스템 생성 요청 바디',
    type: CreateStellarSystemDto,
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
  @ApiBody({
    description: '스텔라 시스템 클론 요청 바디',
    type: CloneStellarSystemDto,
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
  @ApiQuery({
    name: 'page',
    required: false,
    description: '페이지 번호 (기본값 1)',
    example: '1',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '페이지당 항목 수 (기본값 20, 최대 100)',
    example: '20',
  })
  @ApiResponse({
    status: 200,
    description: '조회 성공',
    type: MyStellarSystemsResponseDto,
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
    type: GalaxySystemSummaryDto,
    isArray: true,
  })
  @ApiResponse({
    status: 404,
    description: '갤럭시를 찾을 수 없음',
    type: ErrorResponseDto,
  })
  async getGalaxyStellarSystems(
    @Param('galaxyId') galaxyId: string
  ): Promise<GalaxySystemSummaryDto[]> {
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
      '스텔라 시스템 수정 요청 바디 (POST와 동일 구조, 제공된 필드만 반영)',
    type: UpdateStellarSystemDto,
  })
  @ApiResponse({
    status: 200,
    description: '스텔라 시스템 수정 성공',
    type: StellarSystemResponseDto,
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
