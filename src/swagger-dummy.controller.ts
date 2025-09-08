import { Controller } from '@nestjs/common';

/**
 * Swagger 문서 생성을 위한 더미 컨트롤러입니다.
 * 의존성 주입 없이 최소한의 구조만 제공하여
 * NestJS 애플리케이션이 성공적으로 초기화될 수 있도록 합니다.
 */
@Controller()
export class SwaggerDummyController {
  // 의존성 없는 빈 컨트롤러
}
