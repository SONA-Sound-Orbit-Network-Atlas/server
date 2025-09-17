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
import {
  ApiProperty,
  ApiPropertyOptional,
  ApiHideProperty,
} from '@nestjs/swagger';
import { StarResponseDto, StarForSystemDto } from './star.dto';
import { PlanetResponseDto, PlanetPropertiesDto } from './planet.dto';

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
    type: PlanetPropertiesDto,
    example: {
      planetSize: 0.45,
      planetColor: 15,
      planetBrightness: 3.8,
      distanceFromStar: 5.2,
      orbitSpeed: 0.7,
      rotationSpeed: 0.4,
      eccentricity: 0.3,
      tilt: 5,
    },
  })
  @IsObject()
  @ValidateNested()
  @Type(() => PlanetPropertiesDto)
  properties: PlanetPropertiesDto;
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

  // position은 서버에서 내부적으로 결정/관리합니다. 공개 API에서는 숨깁니다.
  @ApiHideProperty()
  @IsOptional()
  @IsArray()
  @Validate(IsValidPosition)
  position?: number[];

  @ApiPropertyOptional({
    description: '항성 정보 (선택적, 미제공 시 기본값 사용)',
    type: StarForSystemDto,
    example: {
      name: 'Central Star',
      properties: {
        spin: 50,
        brightness: 75,
        color: 60,
        size: 50,
      },
    },
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => StarForSystemDto)
  star?: StarForSystemDto;

  @ApiPropertyOptional({
    description: '행성 정보 배열 (선택적)',
    type: [CreatePlanetForSystemDto],
    isArray: true,
    example: [
      {
        name: 'Rhythm Planet',
        role: 'DRUM',
        properties: {
          planetSize: 0.45,
          planetColor: 15,
          planetBrightness: 3.8,
          distanceFromStar: 5.2,
          orbitSpeed: 0.7,
          rotationSpeed: 0.4,
          eccentricity: 0.3,
          tilt: 5,
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

  // position은 서버에서 내부적으로 결정/관리합니다. 공개 API에서는 숨깁니다.
  @ApiHideProperty()
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
    type: StarForSystemDto,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => StarForSystemDto)
  star?: StarForSystemDto;

  @ApiPropertyOptional({
    description: '행성 전체 목록 (전체 편집 시 포함 가능, 없으면 기존 유지)',
    type: [CreatePlanetForSystemDto],
    isArray: true,
    example: [
      {
        name: 'Rhythm Planet',
        role: 'DRUM',
        properties: {
          planetSize: 0.45,
          planetColor: 15,
          planetBrightness: 3.8,
          distanceFromStar: 5.2,
          orbitSpeed: 0.7,
          rotationSpeed: 0.4,
          eccentricity: 0.3,
          tilt: 5,
        },
      },
      {
        name: 'Bass Planet',
        role: 'BASS',
        properties: {
          planetSize: 0.6,
          planetColor: 240,
          planetBrightness: 2.6,
          distanceFromStar: 8.5,
          orbitSpeed: 0.35,
          rotationSpeed: 0.25,
          eccentricity: 0.2,
          tilt: 10,
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

  // position은 서버에서 내부적으로 결정/관리합니다. 공개 API에서는 숨깁니다.
  @ApiHideProperty()
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
    type: PlanetResponseDto,
    isArray: true,
    example: [
      {
        id: 'pln_example123',
        system_id: 'sys_example456',
        name: '리듬 행성',
        object_type: 'PLANET',
        role: 'DRUM',
        properties: {
          planetSize: 0.45,
          planetColor: 15,
          planetBrightness: 3.8,
          distanceFromStar: 5.2,
          orbitSpeed: 0.7,
          rotationSpeed: 0.4,
          eccentricity: 0.3,
          tilt: 5,
        },
        created_at: '2025-09-17T10:30:00.000Z',
        updated_at: '2025-09-17T10:30:00.000Z',
      },
      {
        id: 'pln_example456',
        system_id: 'sys_example456',
        name: '베이스 행성',
        object_type: 'PLANET',
        role: 'BASS',
        properties: {
          planetSize: 0.6,
          planetColor: 240,
          planetBrightness: 2.6,
          distanceFromStar: 8.5,
          orbitSpeed: 0.35,
          rotationSpeed: 0.25,
          eccentricity: 0.2,
          tilt: 10,
        },
        created_at: '2025-09-17T10:30:00.000Z',
        updated_at: '2025-09-17T10:30:00.000Z',
      },
    ],
  })
  planets: PlanetResponseDto[];

  @ApiProperty({ description: '생성 시간' })
  created_at: Date;

  @ApiProperty({ description: '수정 시간' })
  updated_at: Date;
}

// 내 스텔라 시스템 목록 조회용 DTO (간소화된 정보)
export class MyStellarSystemItemDto {
  @ApiProperty({ description: '스텔라 시스템 ID', example: 'sys_987' })
  id: string;

  @ApiProperty({ description: '스텔라 시스템 이름', example: '안드로메다-7' })
  title: string;

  @ApiProperty({ description: '소속 갤럭시 ID', example: 'gal_777' })
  galaxy_id: string;

  @ApiProperty({ description: '소유자 ID', example: 'usr_999' })
  creator_id: string;

  @ApiProperty({
    description: '생성 시간',
    example: '2025-08-01T00:00:00.000Z',
  })
  created_at: Date;

  @ApiProperty({
    description: '수정 시간',
    example: '2025-09-10T00:00:00.000Z',
  })
  updated_at: Date;

  @ApiProperty({ description: '좋아요 개수', example: 42 })
  like_count: number;

  @ApiProperty({ description: '행성 개수', example: 9 })
  planet_count: number;

  @ApiProperty({ description: '인기 순위 (좋아요 수 기준)', example: 1 })
  rank: number;
}

// 페이지네이션 메타데이터 DTO
export class PaginationMetaDto {
  @ApiProperty({ description: '현재 페이지 번호', example: 1 })
  page: number;

  @ApiProperty({ description: '페이지당 항목 수', example: 20 })
  limit: number;

  @ApiProperty({ description: '전체 항목 수', example: 250 })
  total: number;
}

// 내 스텔라 시스템 목록 응답 DTO
export class MyStellarSystemsResponseDto {
  @ApiProperty({
    description: '내 스텔라 시스템 목록',
    type: MyStellarSystemItemDto,
    isArray: true,
  })
  data: MyStellarSystemItemDto[];

  @ApiProperty({
    description: '페이지네이션 메타데이터',
    type: PaginationMetaDto,
  })
  meta: PaginationMetaDto;
}

// 갤럭시 내 시스템 요약 정보 DTO (비회원 조회용 간소 정보)
export class GalaxySystemSummaryDto {
  @ApiProperty({ description: '스텔라 시스템 ID', example: 'sys_p8q2r5t1w9' })
  id: string;

  @ApiProperty({
    description: '스텔라 시스템 이름',
    example: '나의 첫 번째 스텔라 시스템',
  })
  title: string;

  @ApiProperty({
    description: '갤럭시 내 위치 좌표 [x, y, z]',
    type: [Number],
    example: [125.5, -8.2, 340.0],
  })
  position: number[];

  @ApiProperty({ description: '항성 색상 값 (hue)', example: 210 })
  color: number;
}
