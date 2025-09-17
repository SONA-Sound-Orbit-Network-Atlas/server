// 스텔라 시스템 관련 DTO
// 항성과 행성을 명확히 분리한 구조의 DTO들

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  ValidateNested,
  MaxLength,
  IsArray,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  Validate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StarPropertiesDto, StarResponseDto } from './star.dto';
import { PlanetResponseDto } from './planet.dto';

// Position 범위 검증을 위한 커스텀 validator
// x: ±1000, y: ±20, z: ±1000
@ValidatorConstraint({ name: 'position', async: false })
export class IsValidPosition implements ValidatorConstraintInterface {
  validate(position: any): boolean {
    // position이 배열이고 정확히 3개 요소를 가져야 함
    if (!Array.isArray(position) || position.length !== 3) {
      return false;
    }

    const [x, y, z] = position as [unknown, unknown, unknown];

    // 각 요소가 숫자여야 함
    if (
      typeof x !== 'number' ||
      typeof y !== 'number' ||
      typeof z !== 'number'
    ) {
      return false;
    }

    // 범위 검증: x: ±1000, y: ±20, z: ±1000
    if (x < -1000 || x > 1000) return false;
    if (y < -20 || y > 20) return false;
    if (z < -1000 || z > 1000) return false;

    return true;
  }

  defaultMessage(): string {
    return 'Position must be [x, y, z] where x: ±1000, y: ±20, z: ±1000';
  }
}

// 간편한 행성 생성 정보 DTO (시스템 생성 시 사용)
export class CreatePlanetForSystemDto {
  @ApiPropertyOptional({
    description:
      '기존 행성 ID (수정/덮어쓰기 시에만 포함). 값이 없으면 새로운 행성으로 생성됩니다.',
    example: 'pln_abc123',
  })
  @IsOptional()
  @IsString()
  id?: string;
  @ApiProperty({
    description: '행성 이름',
    example: 'Rhythm Planet',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @ApiProperty({
    description: '악기 역할',
    enum: ['DRUM', 'BASS', 'CHORD', 'MELODY', 'ARPEGGIO', 'PAD'],
    example: 'DRUM',
  })
  @IsString()
  @IsNotEmpty()
  role: string;

  @ApiProperty({
    description: '행성의 SONA 오디오 속성',
    example: {
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
  })
  @IsObject()
  properties: Record<string, number>;
}

// 스텔라 시스템 생성 DTO (항성 자동 생성)
export class CreateStellarSystemDto {
  @ApiProperty({
    description: '스텔라 시스템 이름',
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
    description: '갤럭시 내 위치 좌표 [x, y, z] (x: ±1000, y: ±20, z: ±1000)',
    type: [Number],
    example: [10.5, -5.2, 0],
  })
  @IsOptional()
  @IsArray()
  @Validate(IsValidPosition)
  position?: number[];

  @ApiPropertyOptional({
    description: '항성 정보 (선택적, 미제공 시 기본값 사용)',
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
  star?: StarPropertiesDto;

  @ApiPropertyOptional({
    description: '행성 정보 배열 (선택적)',
    type: [CreatePlanetForSystemDto],
    isArray: true,
    example: [
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
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePlanetForSystemDto)
  planets?: CreatePlanetForSystemDto[];
}

// 스텔라 시스템 수정 DTO
export class UpdateStellarSystemDto {
  @ApiPropertyOptional({
    description: '스텔라 시스템 이름',
    example: 'Updated System Name',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @ApiPropertyOptional({
    description: '갤럭시 내 위치 좌표 [x, y, z] (x: ±1000, y: ±20, z: ±1000)',
    type: [Number],
    example: [15.0, 2.5, -1.0],
  })
  @IsOptional()
  @IsArray()
  @Validate(IsValidPosition)
  position?: number[];

  @ApiPropertyOptional({
    description: '스텔라 시스템 설명',
    example: 'Updated description',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: '항성 정보 (전체 편집 시 포함 가능)',
    type: StarPropertiesDto,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => StarPropertiesDto)
  star?: StarPropertiesDto;

  @ApiPropertyOptional({
    description: '행성 전체 목록 (전체 편집 시 포함 가능, 없으면 기존 유지)',
    type: [CreatePlanetForSystemDto],
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePlanetForSystemDto)
  planets?: CreatePlanetForSystemDto[];
}

// 스텔라 시스템 클론 DTO
export class CloneStellarSystemDto {
  @ApiProperty({
    description: '클론할 원본 스텔라 시스템 ID',
    example: 'sys_abc123',
  })
  @IsString()
  @IsNotEmpty()
  create_source_id: string;

  @ApiProperty({
    description: '새로운 시스템 이름',
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
    description:
      '클론된 시스템의 새로운 위치 좌표 [x, y, z] (x: ±1000, y: ±20, z: ±1000). 미제공 시 랜덤 위치로 생성',
    type: [Number],
    example: [100.5, -10.2, 500.0],
  })
  @IsOptional()
  @IsArray()
  @Validate(IsValidPosition)
  position?: number[];

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

  @ApiProperty({ description: '스텔라 시스템 이름' })
  title: string;

  @ApiProperty({ description: '소속 갤럭시 ID' })
  galaxy_id: string;

  @ApiProperty({
    description: '갤럭시 내 위치 좌표 [x, y, z]',
    type: [Number],
    example: [10.5, -5.2, 0],
  })
  position: number[];

  @ApiProperty({ description: '현재 소유자 ID' })
  creator_id: string;

  @ApiProperty({
    description:
      '최초 생성자 ID (원작자). 클론 시 원본의 author_id를 계승합니다.',
  })
  author_id: string;

  @ApiProperty({
    description:
      '이 시스템을 클론할 때 사용된 직접적인 원본 시스템의 ID. 최초 생성(클론이 아님)인 경우에도 자기 자신의 ID가 들어갑니다. (null 불가)',
  })
  create_source_id: string;

  @ApiProperty({
    description:
      '클론 소스 시스템의 이름 (create_source_id에 해당하는 시스템 이름). 항상 문자열로 반환됩니다.',
  })
  create_source_name: string;

  @ApiProperty({
    description:
      '클론 체인의 가장 첫 번째 원본 시스템 ID. 최초 생성(클론이 아님)인 경우 자기 자신의 ID가 들어갑니다. (null 불가)',
  })
  original_source_id: string;

  @ApiProperty({
    description:
      '최초 소스 시스템의 이름 (original_source_id에 해당하는 시스템 이름). 항상 문자열로 반환됩니다.',
  })
  original_source_name: string;

  @ApiPropertyOptional({ description: '스텔라 시스템 설명' })
  description?: string | null;

  @ApiProperty({
    description: '생성 방식',
    enum: ['MANUAL', 'CLONE', 'GENERATED'],
    example: 'MANUAL',
  })
  created_via: string;

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
