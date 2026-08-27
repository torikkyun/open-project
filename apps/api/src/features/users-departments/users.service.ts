import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomBytes } from "crypto";
import { PrismaService } from "@/infra/db";
import { hashPassword } from "@/common/utils/hash.util";
import { getOffsetPagination } from "@/common/utils/pagination.util";
import { UserRole } from "@/generated/prisma/enums";
import { CreateUserDto, UpdateUserDto, UserQueryDto } from "./dto";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: UserQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const { skip, take } = getOffsetPagination(page, limit);
    const where = {
      deletedAt: null,
      ...(query.search
        ? {
            OR: [
              {
                name: { contains: query.search, mode: "insensitive" as const },
              },
              {
                email: { contains: query.search, mode: "insensitive" as const },
              },
            ],
          }
        : {}),
      ...(query.role ? { role: query.role as UserRole } : {}),
      ...(query.department_id ? { departmentId: query.department_id } : {}),
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: { select: { id: true, name: true } },
          createdAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        created_at: user.createdAt,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // TODO: cần sửa lại
  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.prisma.user.findFirst({
      where: { email: createUserDto.email, deletedAt: null },
    });

    if (existingUser) {
      throw new ConflictException("Email đã tồn tại");
    }

    const generatedPassword = randomBytes(32).toString("hex");

    const user = await this.prisma.user.create({
      data: {
        name: createUserDto.name,
        email: createUserDto.email,
        role: createUserDto.role,
        departmentId: createUserDto.department_id,
        passwordHash: await hashPassword(generatedPassword),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        departmentId: true,
        createdAt: true,
      },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department_id: user.departmentId,
      created_at: user.createdAt,
      password: generatedPassword,
      warning:
        "Mật khẩu này chỉ hiển thị một lần. Vui lòng gửi cho người dùng qua kênh an toàn và yêu cầu đổi mật khẩu ngay sau khi đăng nhập.",
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: { select: { id: true, name: true } },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException("Không tìm thấy người dùng");
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      created_at: user.createdAt,
      updated_at: user.updatedAt,
    };
  }

  // TODO: cần sửa lại, đang dùng updateMany để tránh lỗi khi có nhiều bản ghi trùng id (không nên xảy ra, nhưng vẫn cần xử lý), đổi lại dùng update cho an toàn
  async update(id: string, updateUserDto: UpdateUserDto) {
    const existingUser = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existingUser) {
      throw new NotFoundException("Không tìm thấy người dùng");
    }

    if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
      const emailOwner = await this.prisma.user.findFirst({
        where: { email: updateUserDto.email, deletedAt: null },
      });

      if (emailOwner) {
        throw new ConflictException("Email đã tồn tại");
      }
    }

    await this.prisma.user.updateMany({
      where: { id, deletedAt: null },
      data: {
        ...(updateUserDto.name !== undefined
          ? { name: updateUserDto.name }
          : {}),
        ...(updateUserDto.email !== undefined
          ? { email: updateUserDto.email }
          : {}),
        ...(updateUserDto.role !== undefined
          ? { role: updateUserDto.role }
          : {}),
        ...(updateUserDto.department_id !== undefined
          ? { departmentId: updateUserDto.department_id }
          : {}),
      },
    });

    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        departmentId: true,
        updatedAt: true,
      },
    });

    return {
      id: user!.id,
      name: user!.name,
      email: user!.email,
      role: user!.role,
      department_id: user!.departmentId,
      updated_at: user!.updatedAt,
    };
  }

  /*
    Vấn đề: Chỉ kiểm tra TaskAssignee, nhưng user có thể là:
      createdBy của Project (ràng buộc onDelete: Restrict)
      createdBy của Template (ràng buộc Restrict)
      Thành viên ProjectMember (ràng buộc Cascade ở schema, nhưng nếu xóa sẽ mất dữ liệu thành viên)
      Người tạo comment, attachment, notification...
      Nếu không kiểm tra, khi xóa user mà vẫn còn ràng buộc Restrict, Prisma sẽ throw lỗi, dẫn đến 500 Internal Server Error.
    TODO: cần sửa lại
  */
  async remove(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException("Không tìm thấy người dùng");
    }

    const activeTaskAssignment = await this.prisma.taskAssignee.findFirst({
      where: { userId: id, deletedAt: null },
      select: { id: true },
    });

    if (activeTaskAssignment) {
      throw new ConflictException("Người dùng đang được gán công việc");
    }

    await this.prisma.user.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }
}
