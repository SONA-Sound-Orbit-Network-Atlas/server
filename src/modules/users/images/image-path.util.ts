import { join } from 'path';
import { promises as fs } from 'fs';

/**
 * 상대경로가 없으면 기본 아바타로 대체해 항상 string 반환.
 * 디스크 접근(I/O) 없음 → 빠름.
 */
export function toPublicUrlOrFallback(
  relPath?: string | null,
  customFallback?: string
) {
  const base = process.env.STATIC_BASE_URL || 'http://localhost:3000';
  const fallback =
    customFallback ?? `${base}/uploads/images/defaults/avatar.png`;

  if (!relPath) return fallback;

  // 혹시 앞에 슬래시가 붙어도 안전하게
  const cleaned = String(relPath).replace(/^\/+/, '');
  return `${base}/uploads/${cleaned}`;
}

/**
 * 상대경로의 실제 파일 존재까지 확인해, 없으면 기본 아바타로 대체(항상 string).
 * 디스크 접근(I/O) 발생 → 필요한 곳에서만 사용.
 */
export async function toPublicUrlEnsured(
  relPath?: string | null,
  customFallback?: string
) {
  const base = process.env.STATIC_BASE_URL || 'http://localhost:3000';
  const fallback =
    customFallback ?? `${base}/uploads/images/defaults/avatar.png`;

  if (!relPath) return fallback;

  try {
    const abs = join(
      process.cwd(),
      process.env.UPLOAD_DIR || 'uploads',
      relPath
    );
    await fs.access(abs);
    return `${base}/uploads/${String(relPath).replace(/^\/+/, '')}`;
  } catch {
    return fallback;
  }
}
