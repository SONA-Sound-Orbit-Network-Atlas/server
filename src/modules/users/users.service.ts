import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import {
  GetUsersQueryDto,
  UpdateUsernameDto,
  UpdatePasswordDto,
  DeleteAccountDto,
  UserResponseDto,
  CreateAboutDto,
} from './dto/user.dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import { AuthenticatedUser } from '../../auth/interfaces/auth.interface';

/**
 * 사용자 관련 비즈니스 로직을 처리하는 서비스
 */
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * ID로 사용자 조회
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
    return user as UserResponseDto;
  }

  /**
   * 사용자 이름 정보 수정
   */
  async updateUsername(
    id: string,
    dto: UpdateUsernameDto
  ): Promise<UserResponseDto> {
    const { username } = dto;

    // 사용자명 중복 확인
    const existingUser = await this.prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      throw new ConflictException('이미 사용 중인 사용자명입니다.');
    }

    // 사용자명 업데이트
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { username, updated_at: new Date() },
      select: {
        id: true,
        email: true,
        username: true,
        created_at: true,
        updated_at: true,
      },
    });

    return updatedUser as UserResponseDto;
  }

  /**
   * 비밀번호 변경
   */
  async updatePassword(
    id: string,
    dto: UpdatePasswordDto
  ): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

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
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');

    const ok = await bcrypt.compare(dto.password, user.password);
    if (!ok) throw new ConflictException('비밀번호가 일치하지 않습니다.');

    await this.prisma.user.delete({
      where: { id },
    });

    return { message: '회원탈퇴가 정상적으로 처리되었습니다.' };
  }

  /**
   * 이메일로 사용자 조회 (인증용) - 비밀번호 포함
   */
  async findByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    return user;
  }

  /*
   * 자기소개 생성/수정
   */
  async createAbout(id: string, dto: CreateAboutDto): Promise<UserResponseDto> {
    const { about } = dto;
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { about, updated_at: new Date() },
      select: {
        id: true,
        email: true,
        username: true,
        about: true,
        created_at: true,
        updated_at: true,
      },
    });
    return updatedUser as UserResponseDto;
  }

  /**
   * 나중에 사용가능성을 위해 남겨둠
   * 모든 사용자 조회 (페이지네이션)
   */
  async findAllUsers(
    query: GetUsersQueryDto
  ): Promise<PaginatedResponse<AuthenticatedUser>> {
    const { page = 1, limit = 20, search } = query;
    const skip = (page - 1) * limit;

    // 검색 조건 설정
    const where = search
      ? {
          OR: [
            { username: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    // 총 개수 조회
    const total = await this.prisma.user.count({ where });

    // 사용자 목록 조회 (비밀번호 제외)
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
