import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto, GetUsersQueryDto } from './dto/user.dto';
import { AuthenticatedUser } from './interfaces/user.interface';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import * as bcrypt from 'bcryptjs';

/**
 * 사용자 관련 비즈니스 로직을 처리하는 서비스
 */
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 새 사용자 생성
   */
  async create(createUserDto: CreateUserDto): Promise<AuthenticatedUser> {
    // 이메일 중복 확인
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });
    if (existingEmail) {
      throw new ConflictException('이미 사용 중인 이메일입니다.');
    }

    // 사용자명 중복 확인
    const existingUsername = await this.prisma.user.findUnique({
      where: { username: createUserDto.username },
    });
    if (existingUsername) {
      throw new ConflictException('이미 사용 중인 사용자명입니다.');
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // 사용자 생성 (비밀번호 제외하고 반환)
    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        username: createUserDto.username,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        username: true,
        created_at: true,
        updated_at: true,
      },
    });

    return user;
  }

  /**
   * 모든 사용자 조회 (페이지네이션)
   */
  async findAll(
    query: GetUsersQueryDto,
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

  /**
   * ID로 사용자 조회
   */
  async findOne(id: string): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    return user as AuthenticatedUser;
  }

  /**
   * 사용자 정보 수정
   */
  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<AuthenticatedUser> {
    // 사용자 존재 확인
    await this.findOne(id);

    // 사용자명 중복 확인 (변경하려는 경우)
    if (updateUserDto.username) {
      const existingUsername = await this.prisma.user.findFirst({
        where: {
          username: updateUserDto.username,
          NOT: { id },
        },
      });
      if (existingUsername) {
        throw new ConflictException('이미 사용 중인 사용자명입니다.');
      }
    }

    // 사용자 정보 수정
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: {
        id: true,
        email: true,
        username: true,
        created_at: true,
        updated_at: true,
      },
    });

    return updatedUser as AuthenticatedUser;
  }

  /**
   * 사용자 삭제
   */
  async remove(id: string): Promise<void> {
    // 사용자 존재 확인
    await this.findOne(id);

    // 사용자 삭제 (관련된 모든 데이터도 CASCADE로 삭제됨)
    await this.prisma.user.delete({
      where: { id },
    });
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
}
