import { AuthenticatedUser } from '../../users/interfaces/user.interface';

/**
 * 로그인 응답 인터페이스 - 토큰과 사용자 정보를 포함
 */
export interface LoginResponse {
  access_token: string;
  user: AuthenticatedUser;
}

/**
 * JWT 페이로드 인터페이스 - 토큰에 저장되는 정보
 */
export interface JwtPayload {
  sub: string; // 사용자 ID
  email: string; // 사용자 이메일
  username: string; // 사용자명
  iat?: number; // 발급 시간
  exp?: number; // 만료 시간
}
