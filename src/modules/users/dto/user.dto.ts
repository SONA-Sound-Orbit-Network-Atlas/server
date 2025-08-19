import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';

/**
 * 사용자 생성 요청 DTO
 */
export class CreateUserDto {
  @ApiProperty({
    description: '사용자 이메일',
    example: 'user@example.com',
    format: 'email',
  })
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  @IsNotEmpty({ message: '이메일은 필수입니다.' })
  email: string;

  @ApiProperty({
    description: '사용자명',
    example: 'username123',
    minLength: 3,
    maxLength: 20,
  })
  @IsString({ message: '사용자명은 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '사용자명은 필수입니다.' })
  @MinLength(3, { message: '사용자명은 최소 3자 이상이어야 합니다.' })
  @MaxLength(20, { message: '사용자명은 최대 20자까지 가능합니다.' })
  username: string;

  @ApiProperty({
    description: '사용자 비밀번호',
    example: 'password123',
    minLength: 6,
    maxLength: 50,
  })
  @IsString({ message: '비밀번호는 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '비밀번호는 필수입니다.' })
  @MinLength(6, { message: '비밀번호는 최소 6자 이상이어야 합니다.' })
  @MaxLength(50, { message: '비밀번호는 최대 50자까지 가능합니다.' })
  password: string;
}

/**
 * 사용자 수정 요청 DTO
 */
export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({
    description: '사용자명 (선택사항)',
    example: 'newusername123',
  })
  @IsOptional()
  @IsString({ message: '사용자명은 문자열이어야 합니다.' })
  @MinLength(3, { message: '사용자명은 최소 3자 이상이어야 합니다.' })
  @MaxLength(20, { message: '사용자명은 최대 20자까지 가능합니다.' })
  username?: string;

  // password와 email은 별도 API로 처리하므로 제외
  password?: never;
  email?: never;
}

/**
 * 사용자 응답 DTO
 */
export class UserResponseDto {
  @ApiProperty({
    description: '사용자 ID',
    example: 'clp123abc456def',
  })
  id: string;

  @ApiProperty({
    description: '사용자 이메일',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: '사용자명',
    example: 'username123',
  })
  username: string;

  @ApiProperty({
    description: '계정 생성일',
    example: '2023-01-01T00:00:00.000Z',
  })
  created_at: Date;

  @ApiProperty({
    description: '계정 수정일',
    example: '2023-01-01T00:00:00.000Z',
  })
  updated_at: Date;
}

/**
 * 사용자 목록 조회 쿼리 DTO
 */
export class GetUsersQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: '사용자명 검색',
    example: 'john',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
