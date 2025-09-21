import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  NotEquals,
  IsInt,
  Min,
  Max,
} from 'class-validator';

/**
 * 팔로우 생성 DTO (그대로 사용 가능)
 */
export class CreateFollowDto {
  @ApiProperty({ description: '팔로우 대상 사용자 ID' })
  @IsString()
  @IsNotEmpty()
  // 주의: 컨트롤러에서 @User('id')와 비교하여 자기 자신 팔로우 방지
  targetUserId!: string;
}

/**
 * 팔로우 취소 DTO (그대로 사용 가능)
 */
export class DeleteFollowDto {
  @ApiProperty({ description: '팔로우 대상 사용자 ID' })
  @IsString()
  @IsNotEmpty()
  @NotEquals('') // 빈 문자열 방지
  targetUserId!: string;
}

/**
 * 페이지네이션 쿼리 (PaginationDto 대체/확장: page, limit만 노출)
 * 기존 PaginationDto 쓰고 있다면 이 클래스는 생략해도 됩니다.
 */
export class SimplePaginationDto {
  @ApiProperty({ example: 1, description: '현재 페이지(1-base)' })
  @IsInt()
  @Min(1)
  page!: number;

  @ApiProperty({ example: 20, description: '페이지당 개수(1~100)' })
  @IsInt()
  @Min(1)
  @Max(100)
  limit!: number;
}

/**
 * 목록 아이템 DTO: viewer 기준 플래그 포함
 */
export class FollowUserSummaryDto {
  @ApiProperty({ description: '사용자 ID', example: 'usr_abc123' })
  id!: string;

  @ApiProperty({ description: '사용자명', example: 'charlie' })
  username!: string;

  @ApiPropertyOptional({
    description:
      '뷰어(로그인 사용자)가 이 사용자를 팔로우 중인지 여부.\n' +
      '- true: 뷰어 → 사용자 방향 팔로우 중\n' +
      '- false: 팔로우하지 않음\n' +
      '- 비로그인 시 기본적으로 false(또는 정책에 따라 undefined로 숨길 수 있음)',
    example: true,
  })
  viewer_is_following?: boolean;

  @ApiPropertyOptional({
    description:
      '이 사용자가 뷰어(로그인 사용자)를 팔로우 중인지 여부.\n' +
      '- true: 사용자 → 뷰어 방향 팔로우 중(“나를 팔로우함” 배지 등에 활용)\n' +
      '- false: 팔로우하지 않음\n' +
      '- 비로그인 시 기본적으로 false(또는 정책에 따라 undefined)',
    example: false,
  })
  viewer_is_followed_by?: boolean;

  @ApiPropertyOptional({
    description:
      '맞팔 여부. viewer_is_following && viewer_is_followed_by가 둘 다 true일 때 true.\n' +
      '- true: 서로 팔로우 중(맞팔)\n' +
      '- false: 한쪽만 팔로우하거나 둘 다 아님\n' +
      '- 비로그인 시 기본적으로 false(또는 정책에 따라 undefined)',
    example: false,
  })
  isMutual?: boolean;
}

/**
 * 페이지네이션 응답 메타
 */
export class PaginationMetaDto {
  @ApiProperty({ example: 1 }) page!: number;
  @ApiProperty({ example: 20 }) limit!: number;
  @ApiProperty({ example: 137 }) total!: number;
}

/**
 * 팔로워/팔로잉 목록 공통 응답 DTO
 * (원하면 하나만 써도 되고, 가독성을 위해 두 개를 구분해도 됩니다)
 */
export class FollowersListResponseDto {
  @ApiProperty({ type: [FollowUserSummaryDto] })
  items!: FollowUserSummaryDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}

export class FollowingsListResponseDto {
  @ApiProperty({ type: [FollowUserSummaryDto] })
  items!: FollowUserSummaryDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}
