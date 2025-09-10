import { Controller, Get, Query } from '@nestjs/common';
import { StellarSystemService } from './stellar-systems.service';
import { User } from '../../auth/decorator/user.decorator';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ComposeRequestDto } from './dto/stellar-systems.dto';
import { UseGuards, Post, Body } from '@nestjs/common';
import { ErrorResponseDto } from 'src/common/dto/error-response.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('스텔라시스템 정보 관리')
@Controller('stellar-systems')
export class StellarSystemController {
  constructor(private readonly stellarSystemService: StellarSystemService) {}

  /**
   * 은하계, 항성계, 행성을 한 번에 생성 또는 연결
   * - 인증 필요
   * - 트랜잭션 처리
   */
  @Post('compose')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '은하계/항성계/행성 생성 또는 연결' })
  @ApiResponse({ status: 201, description: '성공' })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
    type: ErrorResponseDto,
  })
  async compose(
    @User('id') userId: string,
    @Body() composeRequestDto: ComposeRequestDto
  ) {
    return this.stellarSystemService.compose(userId, composeRequestDto);
  }

  /**
   * - 전체 상태 조회
   * - 패턴 포함 여부 선택 가능
   */
  @Get('compose')
  @ApiOperation({ summary: '은하계의 모든 항성계 및 행성 조회' })
  @ApiResponse({ status: 200, description: '성공' })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청',
    type: ErrorResponseDto,
  })
  async readAllCompose(
    @Query('galaxy_id') galaxyId: string,
    @Query() paginationDto: PaginationDto
  ) {
    return this.stellarSystemService.readAllCompose(galaxyId, paginationDto);
  }

  /**
   * - 내가 만든 항성계 목록 조회
   * - pagination
   * - 패턴 포함 여부 선택 가능
   * - 인증 필요
   */
  @Get('my-compose')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내가 만든 항성계 목록 조회' })
  @ApiResponse({ status: 200, description: '성공' })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
    type: ErrorResponseDto,
  })
  async readMyAllCompose(
    @User('id') userId: string,
    @Query('galaxy_id') galaxyId: string,
    @Query() paginationDto: PaginationDto
  ) {
    return this.stellarSystemService.readMyAllCompose(
      userId,
      galaxyId,
      paginationDto
    );
  }

  /**
   * - 내가 만든 항성계 상세 조회
   * - 패턴 포함 여부 선택 가능
   * - 인증 필요
   *  - 권한 없으면 403
   * - 존재하지 않으면 404
   */
  @Get('my-compose/:system_id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내가 만든 항성계 상세 조회' })
  @ApiResponse({ status: 200, description: '성공' })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: '권한 없음',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '존재하지 않음',
    type: ErrorResponseDto,
  })
  async readMyCompose(
    @User('id') userId: string,
    @Query('system_id') systemId: string
  ) {
    return this.stellarSystemService.readMyOneCompose(userId, systemId);
  }

  /**
   * - 상대방이 만든 항성계 상세 조회
   * - 패턴 포함 여부 선택 가능
   * - 인증 필요
   *  - 권한 없으면 403
   * - 존재하지 않으면 404
   */
  @Get('compose/:system_id')
  @ApiOperation({ summary: '상대방이 만든 항성계 상세 조회' })
  @ApiResponse({ status: 200, description: '성공' })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: '권한 없음',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '존재하지 않음',
    type: ErrorResponseDto,
  })
  async readCompose(@Query('system_id') systemId: string) {
    return this.stellarSystemService.readOneCompose(systemId, true);
  }
}
