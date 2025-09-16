import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

/**
 * 요청 핸들러에서 현재 인증된 사용자 정보를 쉽게 가져오기 위한 커스텀 데코레이터
 */

export const User = createParamDecorator(
  (key: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    console.log('User Decorator - Request headers:', request.headers?.authorization);
    console.log('User Decorator - User object:', user);

    // 인증된 사용자가 없으면 예외 발생
    if (!user) {
      console.log('User Decorator - No user found, throwing UnauthorizedException');
      throw new UnauthorizedException('로그인이 필요합니다.');
    }

    //key가 있으면 특정 필드만, 없으면 전체 반환
    return key ? user[key] : user;
  }
);
