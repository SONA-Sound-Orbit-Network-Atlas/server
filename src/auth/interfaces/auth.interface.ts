import { BaseEntity } from '../../common/interfaces/response.interface';

/**
 * 사용자 인터페이스 - 기본 사용자 정보를 정의합니다
 */
export interface User extends BaseEntity {
  email: string;
  username: string;
  password: string;
}

/**
 * 인증된 사용자 타입 - 비밀번호가 제외된 사용자 정보
 */
export type AuthenticatedUser = Omit<User, 'password'>;

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
