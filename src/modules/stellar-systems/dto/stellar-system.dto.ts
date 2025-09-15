// 스텔라 시스템 관련 DTO
// 항성과 행성을 명확히 분리한 구조의 DTO들

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  ValidateNested,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StarPropertiesDto, StarResponseDto } from './star.dto';
import { PlanetResponseDto } from './planet.dto';

// 스텔라 시스템 생성 DTO (항성 자동 생성)
export class CreateStellarSystemDto {
  @ApiProperty({
    description: '스텔라 시스템 제목',
    example: 'My First System',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @ApiProperty({
    description: '소속 갤럭시 ID',
    example: 'gal_abc123',
  })
  @IsString()
  @IsNotEmpty()
  galaxy_id: string;

  @ApiPropertyOptional({
    description: '스텔라 시스템 설명',
    example: 'A beautiful stellar system with multiple planets',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: '항성의 초기 속성 (선택적, 미제공 시 기본값 사용)',
    type: StarPropertiesDto,
    example: {
      spin: 50,
      brightness: 75,
      color: 60,
      size: 50,
    },
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => StarPropertiesDto)
  star_properties?: StarPropertiesDto;
}

// 스텔라 시스템 수정 DTO
export class UpdateStellarSystemDto {
  @ApiPropertyOptional({
    description: '스텔라 시스템 제목',
    example: 'Updated System Title',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @ApiPropertyOptional({
    description: '스텔라 시스템 설명',
    example: 'Updated description',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

// 스텔라 시스템 클론 DTO
export class CloneStellarSystemDto {
  @ApiProperty({
    description: '클론할 원본 스텔라 시스템 ID',
    example: 'sys_abc123',
  })
  @IsString()
  @IsNotEmpty()
  source_system_id: string;

  @ApiProperty({
    description: '새로운 시스템 제목',
    example: 'Cloned System',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @ApiProperty({
    description: '새로운 시스템이 속할 갤럭시 ID',
    example: 'gal_xyz789',
  })
  @IsString()
  @IsNotEmpty()
  galaxy_id: string;

  @ApiPropertyOptional({
    description: '새로운 시스템 설명',
    example: 'Cloned from original system',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

// 스텔라 시스템 응답 DTO
export class StellarSystemResponseDto {
  @ApiProperty({ description: '스텔라 시스템 ID' })
  id: string;

  @ApiProperty({ description: '스텔라 시스템 제목' })
  title: string;

  @ApiProperty({ description: '소속 갤럭시 ID' })
  galaxy_id: string;

  @ApiProperty({ description: '소유자 ID' })
  owner_id: string;

  @ApiPropertyOptional({ description: '최초 생성자 ID' })
  created_by_id?: string;

  @ApiPropertyOptional({ description: '원작자 ID (클론 시 승계)' })
  original_author_id?: string | null;

  @ApiPropertyOptional({ description: '스텔라 시스템 설명' })
  description?: string | null;

  @ApiProperty({
    description: '생성 방식',
    enum: ['MANUAL', 'CLONE', 'GENERATED'],
    example: 'MANUAL',
  })
  created_via: string;

  @ApiPropertyOptional({ description: '원본 시스템 ID (클론인 경우)' })
  source_system_id?: string | null;

  @ApiProperty({ description: '포함된 항성 정보', type: StarResponseDto })
  star: StarResponseDto | null;

  @ApiProperty({
    description: '포함된 행성들',
    type: [PlanetResponseDto],
    isArray: true,
  })
  planets: PlanetResponseDto[];

  @ApiProperty({ description: '생성 시간' })
  created_at: Date;

  @ApiProperty({ description: '수정 시간' })
  updated_at: Date;
}
