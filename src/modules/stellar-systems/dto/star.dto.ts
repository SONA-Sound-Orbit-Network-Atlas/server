// Star(항성) 관련 DTO
// 전역 오디오 제어를 담당하는 항성의 데이터 전송 객체들

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// 항성 속성 DTO (JSONB로 저장)
export class StarPropertiesDto {
  @ApiProperty({
    description: '항성 자전 속도 (전체 BPM 결정)',
    minimum: 0,
    maximum: 100,
    example: 50,
  })
  spin: number;

  @ApiProperty({
    description: '항성 밝기 (전체 볼륨 결정)',
    minimum: 0,
    maximum: 100,
    example: 75,
  })
  brightness: number;

  @ApiProperty({
    description: '항성 색상 (Key/Scale 결정)',
    minimum: 0,
    maximum: 360,
    example: 60,
  })
  color: number;

  @ApiProperty({
    description: '항성 크기 (패턴 복잡도 결정)',
    minimum: 0,
    maximum: 100,
    example: 50,
  })
  size: number;

  @ApiPropertyOptional({
    description: '항성 색온도 (시각적 표현용)',
    minimum: 0,
    maximum: 100,
  })
  temperature?: number;

  @ApiPropertyOptional({
    description: '항성 광도 (시각적 표현용)',
    minimum: 0,
    maximum: 100,
  })
  luminosity?: number;

  @ApiPropertyOptional({
    description: '항성 반지름 (시각적 표현용)',
    minimum: 0,
    maximum: 100,
  })
  radius?: number;
}

// 항성 생성 DTO (시스템 생성 시 내부적으로만 사용)
// 사용자는 직접 항성을 생성할 수 없고, 스텔라 시스템 생성 시 자동으로 생성됨
export class CreateStarDto {
  @ApiProperty({
    description: '스텔라 시스템 ID (내부적으로만 사용)',
    example: 'cm1234567890abcdef',
  })
  @IsString()
  @IsNotEmpty()
  system_id: string;

  @ApiProperty({
    description: '항성의 기본 속성 데이터 (JSONB) - 시스템 생성 시 기본값으로 설정',
    type: StarPropertiesDto,
  })
  @IsObject()
  @ValidateNested()
  @Type(() => StarPropertiesDto)
  properties: StarPropertiesDto;
}

// 항성 수정 DTO
export class UpdateStarDto {
  @ApiPropertyOptional({
    description: '수정할 항성 속성 (부분 수정 가능)',
    type: StarPropertiesDto,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => StarPropertiesDto)
  properties?: Partial<StarPropertiesDto>;
}

// 항성 응답 DTO
export class StarResponseDto {
  @ApiProperty({ description: '항성 ID' })
  id: string;

  @ApiProperty({ description: '스텔라 시스템 ID' })
  system_id: string;

  @ApiProperty({
    description: '항성 속성',
    type: StarPropertiesDto,
  })
  properties: StarPropertiesDto;

  @ApiProperty({ description: '생성 시간' })
  created_at: Date;

  @ApiProperty({ description: '수정 시간' })
  updated_at: Date;
}
