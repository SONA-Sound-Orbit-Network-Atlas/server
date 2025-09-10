// src/modules/space/dto/compose.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { Type } from 'class-transformer';

export class ComposePlanetDto {
  @ApiProperty({ example: 'Planet A' })
  @IsString()
  @MaxLength(50)
  name!: string;
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
