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
   * - 스텔라 시스템과 항성이 동시에 생성됩니다
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '스텔라 시스템 생성',
    description:
      '새로운 스텔라 시스템을 생성합니다. 항성은 자동으로 생성되며 삭제할 수 없습니다.',
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
    @User('userId') userId: string,
    @Body() createDto: CreateStellarSystemDto
  ) {
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
    description:
      '기존 스텔라 시스템을 복제하여 새로운 시스템을 생성합니다. 항성과 행성들이 모두 복제됩니다.',
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
  ) {
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
  ) {
    return this.stellarSystemService.getStellarSystem(id, userId);
  }

  /**
   * 스텔라 시스템 수정
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '스텔라 시스템 수정' })
  @ApiResponse({ status: 200, description: '수정 성공' })
  @ApiResponse({ status: 404, description: '스텔라 시스템을 찾을 수 없음' })
  async updateStellarSystem(
    @Param('id') id: string,
    @User('userId') userId: string,
    @Body() updateDto: UpdateStellarSystemDto
  ) {
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
  @ApiResponse({ status: 200, description: '삭제 성공' })
  @ApiResponse({ status: 404, description: '스텔라 시스템을 찾을 수 없음' })
  async deleteStellarSystem(
    @Param('id') id: string,
    @User('userId') userId: string
  ) {
    return this.stellarSystemService.deleteStellarSystem(id, userId);
  }

  /**
   * 내가 만든 스텔라 시스템수
   */
  @Get('me/count')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내가 만든 항성계 수 조회' })
  @ApiResponse({ status: 200, description: '성공' })
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
  async getMyStellarSystemCount(@User('id') userId: string) {
    return this.stellarSystemService.countMyStellaSystem(userId);
  }
}
