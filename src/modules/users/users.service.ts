// src/modules/users/users.service.ts
import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import {
  GetUsersQueryDto,
  UpdateProfileDto,
  UpdatePasswordDto,
  DeleteAccountDto,
  UserResponseDto,
} from './dto/user.dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import { AuthenticatedUser } from '../../auth/interfaces/auth.interface';
import { LocalStorageService } from './images/local-storage.service';
import { toPublicUrlOrFallback } from './images/image-path.util';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly localStorage: LocalStorageService
  ) {}

  /**
   * ID로 사용자 조회 (image는 항상 string으로 응답)
   */
  async getProfile(id: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        about: true,
        image: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    const image = toPublicUrlOrFallback(user.image);
    return { ...user, image };
  }


  /**
   * 사용자 이름 정보 수정 + about 수정
   */
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const { username, about } = dto;

    // 아무 필드 없는 빈 요청 방지
    if (username === undefined && about === undefined) {
      throw new BadRequestException('수정할 필드를 최소 1개 이상 보내주세요.');
    }

    // username 변경 시 중복 확인 (나 자신 제외)
    if (username !== undefined) {
      const dup = await this.prisma.user.findFirst({
        where: {
          username,
          NOT: { id: userId },
        },
        select: { id: true },
      });
      if (dup) {
        throw new ConflictException('이미 사용 중인 사용자명입니다.');
      }
    }
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(username !== undefined && { username }),
        ...(about !== undefined && { about }),
        updated_at: new Date(),
      },
      select: {
        id: true,
        email: true,
        username: true,
        about: true,
        image: true,
        created_at: true,
        updated_at: true,
      },
    });

    return {
      message: '프로필이 성공적으로 수정되었습니다.',
      user: updated,
    };
  }

  /**
   * 비밀번호 변경
   */
  async updatePassword(
    id: string,
    dto: UpdatePasswordDto
  ): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');

    const ok = await bcrypt.compare(dto.oldPassword, user.password);
    if (!ok) throw new ConflictException('현재 비밀번호가 일치하지 않습니다.');

    const newHashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id },
      data: { password: newHashedPassword, updated_at: new Date() },
    });

    return { message: '비밀번호가 변경 되었습니다.' };
  }

  /**
   * 회원탈퇴(사용자 삭제)
   */
  async deleteAccount(
    id: string,
    dto: DeleteAccountDto
  ): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');

    const ok = await bcrypt.compare(dto.password, user.password);
    if (!ok) throw new ConflictException('비밀번호가 일치하지 않습니다.');

    await this.prisma.user.delete({ where: { id } });

    return { message: '회원탈퇴가 정상적으로 처리되었습니다.' };
  }

  /**
   * 이메일로 사용자 조회 (인증용) - 비밀번호 포함
   */
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  /**
   * 프로필 이미지 업로드/교체 (상대경로 저장, 응답은 URL string)
   */
  async uploadImage(userId: string, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('파일이 필요합니다.');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');

    // 1) 저장 (상대경로 반환)
    const saved = await this.localStorage.saveUserAvatar({
      userId,
      buffer: file.buffer,
      mime: file.mimetype,
    });

    // 2) 이전 파일 삭제
    if (user.image) {
      await this.localStorage.removeByRelPath(user.image);
    }

    // 3) DB에 상대경로 저장
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { image: saved.relPath },
      select: { id: true, username: true, about: true, image: true },
    });

    return {
      message: '프로필 이미지가 업데이트되었습니다.',
      image: toPublicUrlOrFallback(updated.image),
    };
  }

  /**
   * 프로필 이미지 삭제
   */
  async removeImage(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { image: true },
    });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');

    if (user.image) {
      await this.localStorage.removeByRelPath(user.image);
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { image: null },
    });

    return { message: '프로필 이미지가 삭제되었습니다.' };
  }

  /**
   * 모든 사용자 조회 (페이지네이션)
   */
  async findAllUsers(
    query: GetUsersQueryDto
  ): Promise<PaginatedResponse<AuthenticatedUser>> {
    const { page = 1, limit = 20, search } = query;
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { username: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const total = await this.prisma.user.count({ where });

    const users = await this.prisma.user.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        email: true,
        username: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: { created_at: 'desc' },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: users,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }
}
