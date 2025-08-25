import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT 토큰을 검증하는 가드
 * 보호된 라우트에 사용됩니다.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
