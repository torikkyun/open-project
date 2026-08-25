import { Prisma } from "@/generated/prisma/client";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@/infra/db";
import { GetMembersQueryDto } from "./dto/get-members-query.dto";
import { getOffsetPagination } from "@/common/utils/pagination.util";

@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMembers(query: GetMembersQueryDto) {
    const { page = 1, limit = 10, search, role } = query;
    const { take, skip } = getOffsetPagination(page, limit);

    const where: Prisma.UserWhereInput = {};

    if (role) {
      where.membership = {
        role: {
          OR: [
            { code: { equals: role, mode: "insensitive" } },
            { name: { equals: role, mode: "insensitive" } },
          ],
        },
      };
    } else {
      where.membership = { isNot: null };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, users] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { name: "asc" },
        include: { membership: { include: { role: true } } },
      }),
    ]);

    return {
      data: users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        role: user.membership?.role,
        joinedAt: user.membership?.createdAt,
      })),
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  async updateRole(userId: string, roleCode: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { userId },
      include: { role: true },
    });

    if (!membership) {
      throw new NotFoundException("Người dùng không phải thành viên workspace");
    }

    const newRole = await this.prisma.userRole.findFirst({
      where: {
        OR: [
          { code: roleCode },
          { name: { equals: roleCode, mode: "insensitive" } },
        ],
      },
    });

    if (!newRole) {
      throw new BadRequestException("Role không hợp lệ");
    }

    if (newRole.id === membership.roleId) {
      return membership;
    }

    await this.prisma.$transaction(async (tx) => {
      await this.assertNotLastAdmin(tx, membership, newRole.code);

      await tx.membership.update({
        where: { userId },
        data: { role: { connect: { id: newRole.id } } },
      });
    });

    return this.prisma.membership.findUnique({
      where: { userId },
      include: { role: true },
    });
  }

  async removeMember(userId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { userId },
      include: { role: true },
    });

    if (!membership) {
      throw new NotFoundException("Người dùng không phải thành viên workspace");
    }

    await this.prisma.$transaction(async (tx) => {
      await this.assertNotLastAdmin(tx, membership, null);

      await tx.membership.delete({ where: { userId } });
    });
  }

  private async assertNotLastAdmin(
    tx: Prisma.TransactionClient,
    membership: { role: { code: string } },
    downgradeTo: string | null,
  ) {
    if (membership.role.code !== "admin" || downgradeTo === "admin") {
      return;
    }

    const adminCount = await tx.membership.count({
      where: { role: { code: "admin" } },
    });

    if (adminCount <= 1) {
      throw new ConflictException(
        "Không thể hạ role admin cuối cùng của workspace",
      );
    }
  }
}
