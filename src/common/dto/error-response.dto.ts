import { ApiProperty } from '@nestjs/swagger';

/**
 * 표준화된 에러 응답 형식
 * 모든 API 에러는 이 형식을 따릅니다.
 */
export class ErrorResponseDto {
  @ApiProperty({
    description: '에러 정보',
    example: {
      code: 400,
      message: '유효하지 않은 요청입니다.',
    },
  })
  error: {
    code: number;
    message: string;
  };

  @ApiProperty({
    description: '에러 발생 시간',
    example: '2025-08-19T02:30:15.123Z',
  })
  timestamp: string;

  @ApiProperty({
    description: '요청 경로',
    example: '/api/users',
  })
  path: string;
}
