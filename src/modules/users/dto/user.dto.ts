import {
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';

/**
 * 사용자 응답 DTO
 * - image: 항상 string (서비스에서 fallback 처리)
 * - about: DB에서 null 가능 → string | null 로 명시
 */
export class UserResponseDto {
  @ApiProperty({ description: '사용자 ID', example: 'clp123abc456def' })
  id: string;

  @ApiProperty({ description: '사용자 이메일', example: 'user@example.com' })
  email: string;

  @ApiProperty({ description: '사용자명', example: 'username123' })
  username: string;

  @ApiProperty({
    description: '자기소개 (없으면 null)',
    example: 'Hello, I am a user.',
    nullable: true,
  })
  about: string | null;

  @ApiProperty({
    description: '프로필 이미지 URL (항상 문자열)',
    example:
      'https://test.img/uploads/images/users/clp123abc456def/avatar-1234abcd.jpg',
  })
  image: string;

  @ApiProperty({
    description: '계정 생성일',
    example: '2023-01-01T00:00:00.000Z',
    format: 'date-time',
  })
  created_at: Date;

  @ApiProperty({
    description: '계정 수정일',
    example: '2023-01-02T12:34:56.000Z',
    format: 'date-time',
  })
  updated_at: Date;
}

/**
 * 사용자명 + 자기소개 변경 DTO
 */

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: '자기소개',
    example: 'Hello, I am a user.',
    maxLength: 160,
  })
  @IsString({ message: '자기소개는 문자열이어야 합니다.' })
  @MaxLength(160, { message: '자기소개는 최대 160자까지 가능합니다.' })
  about?: string;

  @ApiPropertyOptional({
    description: '새 사용자명',
    example: 'newusername123',
    minLength: 3,
    maxLength: 20,
  })
  @IsString({ message: '사용자명은 문자열이어야 합니다.' })
  @MinLength(3, { message: '사용자명은 최소 3자 이상이어야 합니다.' })
  @MaxLength(20, { message: '사용자명은 최대 20자까지 가능합니다.' })
  username?: string;
}

/**
 * 비밀번호 변경 DTO
 */
export class UpdatePasswordDto {
  @ApiProperty({ description: '현재 비밀번호', example: 'oldPass123!' })
  @IsString()
  @MinLength(6, { message: '현재 비밀번호는 최소 6자 이상이어야 합니다.' })
  oldPassword: string;

  @ApiProperty({ description: '새 비밀번호', example: 'NewPass123!' })
  @IsString()
  @IsNotEmpty({ message: '새 비밀번호는 필수입니다.' })
  @MinLength(6, { message: '새 비밀번호는 최소 6자 이상이어야 합니다.' })
  newPassword: string;
}

/**
 * 회원탈퇴(삭제) DTO
 */
export class DeleteAccountDto {
  @ApiProperty({
    description: '비밀번호 확인',
    example: 'myPass123!',
  })
  @IsString()
  @MinLength(6, { message: '비밀번호는 최소 6자 이상이어야 합니다.' })
  password: string;
}

/**
 * 사용자 목록 조회 쿼리 DTO (검색 + 페이지네이션)
 */
export class GetUsersQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: '사용자명/이메일 검색어',
    example: 'john',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
