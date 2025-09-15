import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
  ValidateNested,
  IsEnum,
  IsObject,
  IsBoolean,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { Type } from 'class-transformer';
import { StarPropertiesDto } from './star.dto';

// 오디오 관련 타입 정의
export enum PlanetType {
  CENTRAL_STAR = 'CENTRAL_STAR',
  PLANET = 'PLANET',
}

export enum InstrumentRole {
  DRUM = 'DRUM',
  BASS = 'BASS',
  CHORD = 'CHORD',
  MELODY = 'MELODY',
  ARPEGGIO = 'ARPEGGIO',
  PAD = 'PAD',
}

// === 새로운 Star/Planet 분리 구조 DTO ===

// 스텔라 시스템 생성 DTO (항성 자동 생성)
export class CreateStellarSystemDto {
  @ApiProperty({
    description: '스텔라 시스템 이름',
    example: 'My First System',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

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

// 행성 생성 DTO (시스템에 행성 추가용)
export class CreatePlanetDto {
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
    enum: InstrumentRole,
    example: InstrumentRole.DRUM,
  })
  @IsEnum(InstrumentRole)
  role: InstrumentRole;

  @ApiPropertyOptional({
    description: '행성의 속성들 (JSONB 형태)',
    example: {
      planetSize: 0.5,
      planetColor: 180,
      planetBrightness: 2.65,
      distanceFromStar: 10.5,
      orbitSpeed: 0.5,
      rotationSpeed: 0.5,
      eccentricity: 0.45,
      tilt: 90.0,
    },
  })
  @IsOptional()
  @IsObject()
  properties?: any;
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
  name?: string;

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
    description: '새로운 시스템 이름',
    example: 'Cloned System',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

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

// === 기존 레거시 DTO (하위 호환성 유지) ===

export class ComposePlanetDto {
  @ApiProperty({ example: 'Planet A' })
  @IsString()
  @MaxLength(50)
  name!: string;

  @ApiPropertyOptional({
    enum: PlanetType,
    example: PlanetType.PLANET,
    description: '행성 타입: CENTRAL_STAR(항성) 또는 PLANET(행성)',
  })
  @IsEnum(PlanetType)
  @IsOptional()
  planet_type?: PlanetType;

  @ApiPropertyOptional({
    enum: InstrumentRole,
    example: InstrumentRole.MELODY,
    description: '악기 역할: DRUM, BASS, CHORD, MELODY, ARPEGGIO, PAD',
  })
  @IsEnum(InstrumentRole)
  @IsOptional()
  instrument_role?: InstrumentRole;

  @ApiPropertyOptional({
    example: true,
    description: '행성 활성화 상태',
  })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  // JSONB로 저장될 오디오 및 UI 속성들 (PlanetPhysicalProperties와 동일)
  // 오디오 제어와 동시에 UI 표현(색상, 크기, 궤도 등)도 이 데이터로 처리
  @ApiPropertyOptional({
    description:
      'SONA 오디오 및 UI 속성들 (JSONB 형태) - 오디오 제어와 UI 표현을 모두 처리',
    example: {
      planetSize: 0.5,
      planetColor: 180,
      planetBrightness: 2.65,
      distanceFromStar: 10.5,
      orbitSpeed: 0.5,
      rotationSpeed: 0.5,
      inclination: 0,
      eccentricity: 0.45,
      tilt: 90.0,
      oscillatorType: 0,
      filterResonance: 1.0,
      spatialDepth: 50,
      patternComplexity: 50,
      rhythmDensity: 50,
      melodicVariation: 50,
    },
  })
  @IsObject()
  @IsOptional()
  properties?: any;
}

export class ComposeSystemDto {
  @ApiPropertyOptional({
    description: '기존 시스템에 연결할 때 사용',
    example: 'sys_abc',
  })
  @IsString()
  @IsOptional()
  system_id?: string;

  @ApiPropertyOptional({
    description: '새 시스템 생성 시 제목',
    example: 'System 1',
  })
  @ValidateIf(o => !o.system_id)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title?: string;

  @ApiPropertyOptional({ type: [ComposePlanetDto] })
  @IsArray()
  @Type(() => ComposePlanetDto)
  @ValidateNested({ each: true })
  @IsOptional()
  planets?: ComposePlanetDto[];
}

export class ComposeRequestDto {
  @ApiPropertyOptional({
    description: '기존 갤럭시에 붙일 때 사용',
    example: 'gal_xyz',
  })
  @IsString()
  @IsOptional()
  galaxy_id?: string;

  @ApiPropertyOptional({
    description: '새 갤럭시 생성 시 이름',
    example: 'Galaxy A',
  })
  @ValidateIf(o => !o.galaxy_id)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  galaxy_name?: string;

  @ApiProperty({ type: [ComposeSystemDto] })
  @IsArray()
  @Type(() => ComposeSystemDto)
  @ValidateNested({ each: true })
  systems!: ComposeSystemDto[];
}

export class ComposeReadQueryDto {
  @ApiProperty({ description: '대상 갤럭시 ID', example: 'gal_123' })
  @IsString()
  @IsNotEmpty()
  galaxy_id!: string;

  @ApiPropertyOptional({
    description: '특정 시스템들만 조회 (쿼리에서 system_id=...&system_id=...)',
    type: [String],
    example: ['sys_1', 'sys_2'],
  })
  @IsArray()
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value) ? value : value ? [value] : undefined
  )
  system_id?: string[];

  @ApiPropertyOptional({
    description: '시스템 제목',
    example: 'melody',
  })
  @IsString()
  @IsOptional()
  search?: string;
}
