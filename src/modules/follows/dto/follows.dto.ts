import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, NotEquals } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

/**
 * 팔로우 생성 DTO
 */
export class CreateFollowDto {
  @ApiProperty({ description: '팔로우 대상 사용자 ID' })
  @IsString()
  @IsNotEmpty()
  // 주의: 컨트롤러에서 @User('id')와 비교하여 자기 자신 팔로우 방지
  targetUserId!: string;
}

/**
 * 팔로우 취소 DTO
 */
export class DeleteFollowDto {
  @ApiProperty({ description: '팔로우 대상 사용자 ID' })
  @IsString()
  @IsNotEmpty()
  @NotEquals('') // 빈 문자열 방지
  targetUserId!: string;
}

/**
 * 팔로우 사용자 정보 DTO
 */
export class FollowUserDto {
  @ApiProperty() id!: string;
  @ApiProperty({ required: false }) username?: string | null;
  @ApiProperty({ required: false }) email?: string | null;
  @ApiProperty({ required: false, type: String, format: 'date-time' })
  created_at?: Date | null;
}

/**
 * 팔로우 목록 조회 DTO
 */
export class GetFollowsDto extends PaginationDto {
  @ApiProperty({ description: '사용자 ID' })
  @IsString()
  @IsNotEmpty()
  userId!: string;
}

/**
 *  팔로워 목록 조회 DTO
 */
export class GetFollowersDto extends PaginationDto {
  @ApiProperty({ description: '사용자 ID' })
  @IsString()
  @IsNotEmpty()
  userId!: string;
}

/**
 * 페이지네이션 응답 메타 (클래스로 변경하여 Swagger 노출)
 */
export class PaginationMetaDto {
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() total!: number;
  @ApiProperty() totalPages!: number;
  @ApiProperty() hasNext!: boolean;
  @ApiProperty() hasPrev!: boolean;
}

/**
 * 페이지네이션 응답
 * 아래는 예시로 팔로우 사용자 전용
 */
export class PaginatedFollowUsersDto {
  @ApiProperty({ type: [FollowUserDto] })
  data!: FollowUserDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}