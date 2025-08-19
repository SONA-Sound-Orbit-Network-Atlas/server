/**
 * 기본 응답 인터페이스
 */
export interface BaseResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

/**
 * 에러 응답 인터페이스
 */
export interface ErrorResponse {
  error: {
    code: number;
    message: string;
  };
  timestamp: string;
  path: string;
}

/**
 * 기본 엔티티 인터페이스 (모든 엔티티의 공통 필드)
 */
export interface BaseEntity {
  id: string;
  created_at: Date;
  updated_at: Date;
}
