import { BaseEntity } from '../../../common/interfaces/response.interface';

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
