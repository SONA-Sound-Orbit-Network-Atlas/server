import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * HTTP 예외를 처리하는 전역 필터
 * 모든 HTTP 예외를 일관된 형태로 응답합니다.
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();

    // 예외 메시지 추출
    const exceptionResponse = exception.getResponse();
    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as any).message ||
          '알 수 없는 오류가 발생했습니다.';

    // SONA 프로젝트 표준 에러 응답 형태: { error: { code, message } }
    const errorResponse = {
      error: {
        code: status,
        message: Array.isArray(message) ? message.join(', ') : message,
      },
      timestamp: new Date().toISOString(),
      path: ctx.getRequest().url,
    };

    response.status(status).json(errorResponse);
  }
}
