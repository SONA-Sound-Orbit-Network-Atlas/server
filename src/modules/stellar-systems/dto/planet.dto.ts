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
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ObjectType, InstrumentRole } from './common.dto';

// 행성 속성 DTO (JSONB로 저장)
// SONA 오디오 제어 파라미터들
export class PlanetPropertiesDto {
  @ApiProperty({
    description: '행성 크기 (Size - 음역대 폭과 음정 변화 결정)',
    minimum: 0,
    maximum: 100,
    example: 50,
  })
  size: number;

  @ApiProperty({
    description: '행성 색상 (Color - 오실레이터 웨이브테이블과 음색 특성 결정)',
    minimum: 0,
    maximum: 360,
    example: 180,
  })
  color: number;

  @ApiProperty({
    description:
      '행성 밝기 (Brightness - 필터 컷오프, 출력 게인, 레조넌스 결정)',
    minimum: 0,
    maximum: 100,
    example: 75,
  })
  brightness: number;

  @ApiProperty({
    description: '궤도 거리 (Distance - 리버브와 딜레이 효과 결정)',
    minimum: 0,
    maximum: 100,
    example: 10,
  })
  distance: number;

  @ApiProperty({
    description: '궤도 속도 (Speed - 시퀀서 속도와 패턴 밀도 결정)',
    minimum: 0,
    maximum: 100,
    example: 50,
  })
  speed: number;

  @ApiProperty({
    description: '궤도 기울기 (Tilt - 패닝과 스테레오 폭 결정)',
    minimum: -90,
    maximum: 90,
    example: 0,
  })
  tilt: number;

  @ApiProperty({
    description: '자전 속도 (Spin - 트레몰로와 코러스 효과 결정)',
    minimum: 0,
    maximum: 100,
    example: 30,
  })
  spin: number;

  @ApiProperty({
    description: '궤도 이심률 (Eccentricity - 스윙과 액센트 결정)',
    minimum: 0,
    maximum: 100,
    example: 45,
  })
  eccentricity: number;

  @ApiProperty({
    description: '궤도 높이 (Elevation - 옥타브와 필터 타입 결정)',
    minimum: -90,
    maximum: 90,
    example: 0,
  })
  elevation: number;

  @ApiProperty({
    description: '궤도 위상 (Phase - 패턴 회전과 액센트 게이트 결정)',
    minimum: 0,
    maximum: 360,
    example: 0,
  })
  phase: number;
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

// 행성 응답 DTO
export class PlanetResponseDto {
  @ApiProperty({ description: '행성 ID' })
  id: string;

  @ApiProperty({ description: '스텔라 시스템 ID' })
  system_id: string;

  @ApiProperty({ description: '행성 이름' })
  name: string;

  @ApiProperty({
    description: '객체 타입 (행성은 항상 PLANET)',
    enum: ObjectType,
    example: ObjectType.PLANET,
  })
  object_type: ObjectType;

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

  @ApiProperty({ description: '활성화 상태' })
  is_active: boolean;

  @ApiProperty({ description: '생성 시간' })
  created_at: Date;

  @ApiProperty({ description: '수정 시간' })
  updated_at: Date;
}
