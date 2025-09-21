import { PaginationDto, PaginationMeta } from '../dto/pagination.dto';

export function buildPaginationMeta(
  total: number,
  dto: PaginationDto
): PaginationMeta {
  const page = dto.page ?? 1;
  const limit = dto.limit ?? 20;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}
