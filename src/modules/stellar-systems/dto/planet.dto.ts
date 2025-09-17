// Planet(행성) 관련 DTO
// 개별 악기 역할을 담당하는 행성의 데이터 전송 객체들

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  ValidateNested,
  IsEnum,
  MaxLength,
  IsBoolean,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InstrumentRole } from './common.dto';

// 행성 속성 DTO (JSONB로 저장)
// SONA 오디오 제어 파라미터들 - 프론트엔드 PlanetProperties와 완전 호환
export class PlanetPropertiesDto {
  // === 클라이언트와 일치하는 SONA 속성 ===
  @ApiProperty({
    description: '행성 크기 (Size)',
    minimum: 0.01,
    maximum: 1.0,
    example: 0.35,
  })
  @IsNumber()
  @Min(0.01)
  @Max(1.0)
  planetSize: number;

  @ApiProperty({
    description: '행성 색상 (Color)',
    minimum: 0,
    maximum: 360,
    example: 15,
  })
  @IsNumber()
  @Min(0)
  @Max(360)
  planetColor: number;

  @ApiProperty({
    description: '행성 밝기 (Brightness)',
    minimum: 0.3,
    maximum: 5.0,
    example: 3.8,
  })
  @IsNumber()
  @Min(0.3)
  @Max(5.0)
  planetBrightness: number;

  @ApiProperty({
    description: '항성으로부터 거리 (Distance)',
    minimum: 1.0,
    maximum: 20.0,
    example: 5.2,
  })
  @IsNumber()
  @Min(1.0)
  @Max(20.0)
  distanceFromStar: number;

  @ApiProperty({
    description: '공전 속도 (Speed)',
    minimum: 0.01,
    maximum: 1.0,
    example: 0.85,
  })
  @IsNumber()
  @Min(0.01)
  @Max(1.0)
  orbitSpeed: number;

  @ApiProperty({
    description: '자전 속도 (Spin)',
    minimum: 0.01,
    maximum: 1.0,
    example: 0.95,
  })
  @IsNumber()
  @Min(0.01)
  @Max(1.0)
  rotationSpeed: number;

  @ApiProperty({
    description: '궤도 기울기 (Inclination)',
    minimum: 0,
    maximum: 90,
    example: 23.5,
  })
  @IsNumber()
  @Min(0)
  @Max(90)
  inclination: number;

  @ApiProperty({
    description: '궤도 이심률 (Eccentricity)',
    minimum: 0.0,
    maximum: 0.9,
    example: 0.25,
  })
  @IsNumber()
  @Min(0.0)
  @Max(0.9)
  eccentricity: number;

  @ApiProperty({
    description: '축 기울기 (Tilt)',
    minimum: 0,
    maximum: 180,
    example: 50,
  })
  @IsNumber()
  @Min(0)
  @Max(180)
  tilt: number;
}

// 행성 생성 DTO
export class CreatePlanetDto {
  @ApiProperty({
    description: '스텔라 시스템 ID',
    example: 'cm1234567890abcdef',
  })
  @IsString()
  @IsNotEmpty()
  system_id: string;

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

  @ApiProperty({
    description: '행성의 SONA 오디오 속성 데이터 (JSONB)',
    type: PlanetPropertiesDto,
  })
  @IsObject()
  @ValidateNested()
  @Type(() => PlanetPropertiesDto)
  properties: PlanetPropertiesDto;

  @ApiPropertyOptional({
    description: '행성 활성화 상태 (기본값: true)',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

// 행성 수정 DTO
export class UpdatePlanetDto {
  @ApiPropertyOptional({
    description: '행성 이름',
    example: 'Updated Planet Name',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @ApiPropertyOptional({
    description: '악기 역할',
    enum: InstrumentRole,
    example: InstrumentRole.MELODY,
  })
  @IsOptional()
  @IsEnum(InstrumentRole)
  role?: InstrumentRole;

  @ApiPropertyOptional({
    description: '행성의 속성들 (부분 수정 가능)',
    type: PlanetPropertiesDto,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => PlanetPropertiesDto)
  properties?: Partial<PlanetPropertiesDto>;

  @ApiPropertyOptional({
    description: '행성 활성화 상태',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

// 행성 응답 DTO (프론트엔드 Planet 인터페이스와 일치)
export class PlanetResponseDto {
  @ApiProperty({ description: '행성 ID' })
  id: string;

  @ApiProperty({ description: '스텔라 시스템 ID' })
  system_id: string;

  @ApiProperty({ description: '행성 이름' })
  name: string;

  @ApiProperty({
    description: '객체 타입 (항상 PLANET)',
    enum: ['STAR', 'PLANET'],
    example: 'PLANET',
  })
  object_type: string;

  @ApiProperty({
    description: '악기 역할',
    enum: InstrumentRole,
    example: InstrumentRole.DRUM,
  })
  role: InstrumentRole;

  @ApiProperty({
    description: '행성의 SONA 오디오 속성',
    type: PlanetPropertiesDto,
  })
  properties: PlanetPropertiesDto;

  @ApiProperty({ description: '생성 시간' })
  created_at: Date;

  @ApiProperty({ description: '수정 시간' })
  updated_at: Date;
}
