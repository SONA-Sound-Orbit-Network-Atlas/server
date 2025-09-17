import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

/**
 * 좋아요 생성/삭제 DTO
 */
export class LikeTargetDto {
  @ApiProperty({
    description: '좋아요 대상 StellarSystem ID',
    example: 'cld1234567890abcdefg',
  })
  @IsString()
  @IsNotEmpty()
  system_id!: string;
}

/**
 * 좋아요 랭킹 조회 DTO
 */
export enum RangkType {
  WEEK = 'week',
  MONTHL = 'month',
  YEAR = 'year',
  RANDOM = 'random',
  TOTAL = 'total',
}

export class LikeRankingDto extends PaginationDto {
  @ApiProperty({
    description: '랭킹 타입 (week, month, year, random, total)',
    example: 'week',
    required: false,
    enum: RangkType,
    default: RangkType.WEEK,
  })
  @IsString()
  rank_type?: RangkType = RangkType.WEEK;
}
