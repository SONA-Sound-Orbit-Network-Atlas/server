import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 페이지네이션을 위한 공통 DTO
 * SONA 프로젝트의 모든 리스트 API에서 사용
 */
export class PaginationDto {
  @ApiPropertyOptional({
    description: '페이지 번호 (1부터 시작)',
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: '페이지당 항목 수',
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  /**
   * 스킵할 항목 수를 계산하는 헬퍼 메서드
   */
  get skip(): number {
    return ((this.page ?? 1) - 1) * (this.limit ?? 20);
  }
}

/**
 * 페이지네이션 응답을 위한 메타데이터
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * 페이지네이션된 응답의 공통 인터페이스
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}
