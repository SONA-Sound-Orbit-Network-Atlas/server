import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    const auth = req.headers['authorization'];
    // 토큰 없으면 그냥 통과 (user: undefined)
    if (!auth) return true;
    return super.canActivate(ctx);
  }
  handleRequest(err: any, user: any) {
    // 토큰이 있더라도 유효하지 않으면 에러 대신 user를 비워서 통과
    if (err) return null;
    return user ?? null;
  }
}
