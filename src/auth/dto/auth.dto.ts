import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 회원가입 요청 DTO
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

export class LoginDto {
  @ApiProperty({
    description: '사용자 이메일 또는 사용자명',
    example: 'user@example.com 또는 testuser',
  })
  @IsString({ message: '이메일 또는 사용자명은 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '이메일 또는 사용자명을 입력해야 합니다.' })
  identifier: string;

  @ApiProperty({
    description: '사용자 비밀번호',
    example: 'password123',
  })
  @IsString({ message: '비밀번호는 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '비밀번호는 필수입니다.' })
  @MinLength(6, { message: '비밀번호는 최소 6자 이상이어야 합니다.' })
  password: string;
}

/**
 * 로그인 응답 DTO - Swagger 문서화용
 */
export class LoginResponseDto {
  @ApiProperty({
    description: 'JWT 액세스 토큰',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;

  @ApiProperty({
    description: '사용자 정보',
    example: {
      id: '1a2b3c4d5e6f',
      email: 'user@example.com',
      username: 'username123',
      created_at: '2023-01-01T00:00:00.000Z',
      updated_at: '2023-01-01T00:00:00.000Z',
    },
  })
  user: {
    id: string;
    email: string;
    username: string;
    created_at: Date;
    updated_at: Date;
  };
}
