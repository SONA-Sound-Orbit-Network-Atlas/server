import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import {
  CreateUserDto,
  UpdateUserDto,
  UserResponseDto,
  GetUsersQueryDto,
} from './dto/user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';

/**
 * 사용자 관리 API 컨트롤러
 */
@ApiTags('사용자 관리')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * 새 사용자 생성
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '새 사용자 생성' })
  @ApiResponse({
    status: 201,
    description: '사용자 생성 성공',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: '이메일 또는 사용자명 중복',
    type: ErrorResponseDto,
  })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  /**
   * 모든 사용자 조회
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '사용자 목록 조회' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: '페이지 번호',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '페이지당 항목 수',
    example: 20,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: '사용자명/이메일 검색',
    example: 'john',
  })
  @ApiResponse({
    status: 200,
    description: '사용자 목록 조회 성공',
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
    type: ErrorResponseDto,
  })
  async findAll(@Query() query: GetUsersQueryDto) {
    return this.usersService.findAll(query);
  }

  /**
   * 특정 사용자 조회
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '특정 사용자 조회' })
  @ApiParam({
    name: 'id',
    description: '사용자 ID',
    example: 'clp123abc456def',
  })
  @ApiResponse({
    status: 200,
    description: '사용자 조회 성공',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '사용자를 찾을 수 없음',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
    type: ErrorResponseDto,
  })
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  /**
   * 사용자 정보 수정
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '사용자 정보 수정' })
  @ApiParam({
    name: 'id',
    description: '사용자 ID',
    example: 'clp123abc456def',
  })
  @ApiResponse({
    status: 200,
    description: '사용자 정보 수정 성공',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '사용자를 찾을 수 없음',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: '사용자명 중복',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
    type: ErrorResponseDto,
  })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  /**
   * 사용자 삭제
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '사용자 삭제' })
  @ApiParam({
    name: 'id',
    description: '사용자 ID',
    example: 'clp123abc456def',
  })
  @ApiResponse({
    status: 204,
    description: '사용자 삭제 성공',
  })
  @ApiResponse({
    status: 404,
    description: '사용자를 찾을 수 없음',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
    type: ErrorResponseDto,
  })
  async remove(@Param('id') id: string) {
    await this.usersService.remove(id);
  }
}
