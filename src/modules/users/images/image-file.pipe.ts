import {
  BadRequestException,
  Injectable,
  MaxFileSizeValidator,
  ParseFilePipe,
  FileTypeValidator,
} from '@nestjs/common';

@Injectable()
export class ImageFileParsePipe extends ParseFilePipe {
  constructor() {
    super({
      validators: [
        new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
        // mimetype 예: "image/png", "image/jpeg", "image/webp"
        new FileTypeValidator({ fileType: /\/(png|jpe?g|webp)$/i }),
      ],
      exceptionFactory: (error: unknown) => {
        // Nest의 ParseFilePipe는 보통 string 메시지를 넘겨줍니다.
        if (typeof error === 'string' && error.trim().length > 0) {
          throw new BadRequestException(error);
        }
        throw new BadRequestException('유효하지 않은 이미지 파일입니다.');
      },
    });
  }
}
