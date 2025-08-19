import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * 모든 HTTP 요청/응답을 로깅하는 인터셉터
 * 요청 시작 시간과 응답 시간을 측정하여 성능 모니터링에 활용
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;
    const now = Date.now();

    this.logger.log(`🚀 ${method} ${url} - 요청 시작`);

    return next.handle().pipe(
      tap(() => {
        const responseTime = Date.now() - now;
        this.logger.log(`✅ ${method} ${url} - 응답 완료 (${responseTime}ms)`);
      }),
    );
  }
}
