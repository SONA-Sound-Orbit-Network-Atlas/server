import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join, posix } from 'path';
import { randomUUID } from 'crypto';

export type SavedObject = {
  relPath: string; // "users/<id>/avatar-uuid.jpg"
  absPath: string; // 실제 절대경로
};

@Injectable()
export class LocalStorageService {
  private root = process.env.UPLOAD_DIR || 'uploads';

  private async ensureDir(dir: string) {
    await fs.mkdir(dir, { recursive: true });
  }

  private extFromMime(mime: string) {
    if (/png/i.test(mime)) return 'png';
    if (/jpe?g/i.test(mime)) return 'jpg';
    if (/webp/i.test(mime)) return 'webp';
    return null;
  }

  async saveUserAvatar(params: {
    userId: string;
    buffer: Buffer;
    mime: string;
  }): Promise<SavedObject> {
    const ext = this.extFromMime(params.mime);
    if (!ext)
      throw new InternalServerErrorException('지원하지 않는 이미지 유형');

    const fileName = `avatar-${randomUUID()}.${ext}`;
    const relDirPosix = posix.join('users', params.userId);
    const relPathPosix = posix.join(relDirPosix, fileName);

    const absDir = join(process.cwd(), this.root, 'users', params.userId);
    const absPath = join(absDir, fileName);

    try {
      await this.ensureDir(absDir);
      await fs.writeFile(absPath, params.buffer);
    } catch (e: any) {
      throw new InternalServerErrorException(`파일 저장 실패: ${e.message}`);
    }

    return { relPath: relPathPosix, absPath };
  }

  async removeByRelPath(relPath?: string | null) {
    if (!relPath) return;
    const absPath = join(process.cwd(), this.root, relPath);
    try {
      await fs.unlink(absPath);
    } catch {
      // 없으면 무시
    }
  }
}
