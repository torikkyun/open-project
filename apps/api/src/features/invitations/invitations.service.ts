import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  OnModuleInit,
} from "@nestjs/common";
import { PrismaService } from "@/infra/db";
import { CreateInvitationDto } from "./dto/create-invitation.dto";
import { AcceptInvitationDto } from "./dto/accept-invitation.dto";
import { AuthenticatedUser } from "@/common/types/auth-user.type";
import { hashPassword } from "@/common/utils/hash.util";
import { randomBytes } from "crypto";
import { Prisma } from "@/generated/prisma/client";

@Injectable()
export class InvitationsService implements OnModuleInit {
  private invitationStatusIds: Record<string, string> = {};
  private readonly requiredStatusCodes = [
    "pending",
    "accepted",
    "revoked",
    "expired",
  ];

  private readonly logger = new Logger(InvitationsService.name, {
    timestamp: true,
  });
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    const statuses = await this.prisma.invitationStatus.findMany({
      where: { code: { in: this.requiredStatusCodes } },
      select: { code: true, id: true },
    });

    const foundCodes = statuses.map((status) => status.code);
    const missingCodes = this.requiredStatusCodes.filter(
      (code) => !foundCodes.includes(code),
    );

    if (missingCodes.length) {
      throw new Error(
        `Missing invitation statuses: ${missingCodes.join(", ")}`,
      );
    }

    this.invitationStatusIds = Object.fromEntries(
      statuses.map((status) => [status.code, status.id]),
    );
  }

  async createInvitation(dto: CreateInvitationDto, inviterId: string) {
    try {
      const existingInvitation = await this.prisma.invitation.findFirst({
        where: {
          email: dto.email,
          status: { code: "pending" },
          expiresAt: { gt: new Date() },
        },
      });

      if (existingInvitation) {
        throw new ConflictException(
          "Đã tồn tại lời mời đang chờ cho email này",
        );
      }

      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await this.prisma.invitation.create({
        data: {
          email: dto.email,
          token,
          expiresAt,
          role: { connect: { id: dto.roleId } },
          status: { connect: { id: this.invitationStatusIds["pending"] } },
          invitedBy: { connect: { id: inviterId } },
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException("Email đã được sử dụng trong lời mời khác");
      }
      throw error;
    }
  }

  async acceptInvitation(
    token: string,
    dto: AcceptInvitationDto,
    user?: AuthenticatedUser,
  ) {
    const invitation = await this.prisma.invitation.findFirst({
      where: {
        token,
        status: { code: "pending" },
        expiresAt: { gt: new Date() },
      },
      include: { role: true },
    });

    if (!invitation) {
      throw new BadRequestException("Invitation không tồn tại hoặc đã hết hạn");
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const stillPending = await tx.invitation.count({
          where: { id: invitation.id, status: { code: "pending" } },
        });

        if (!stillPending) {
          throw new ConflictException("Invitation đã được xử lý");
        }

        const targetUser = await this.resolveTargetUser(
          tx,
          invitation.email,
          dto,
          user,
        );

        await tx.membership.create({
          data: {
            user: { connect: { id: targetUser.id } },
            role: { connect: { id: invitation.role.id } },
          },
        });

        return tx.invitation.update({
          where: { id: invitation.id },
          data: {
            acceptedAt: new Date(),
            user: { connect: { id: targetUser.id } },
            status: { connect: { id: this.invitationStatusIds["accepted"] } },
          },
        });
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === "P2002" || error.code === "P2034")
      ) {
        throw new ConflictException("Invitation đã được xử lý");
      }
      throw error;
    }
  }

  private async resolveTargetUser(
    tx: Prisma.TransactionClient,
    email: string,
    dto: AcceptInvitationDto,
    user?: AuthenticatedUser,
  ) {
    if (user) {
      const current = await tx.user.findUnique({
        where: { id: user.id },
        include: { membership: true },
      });

      if (!current) {
        throw new BadRequestException("Người dùng không hợp lệ");
      }

      if (current.email !== email) {
        throw new ConflictException(
          "Email người dùng hiện tại không trùng với invitation",
        );
      }

      this.assertNotMember(current.membership);
      return current;
    }

    const existingUser = await tx.user.findUnique({
      where: { email },
      include: { membership: true },
    });

    if (existingUser) {
      this.assertNotMember(existingUser.membership);
      return existingUser;
    }

    if (!dto.name || !dto.password) {
      throw new BadRequestException(
        "Tên và mật khẩu là bắt buộc để tạo tài khoản mới",
      );
    }

    return tx.user.create({
      data: {
        email,
        name: dto.name,
        passwordHash: await hashPassword(dto.password),
        avatarUrl: `https://api.dicebear.com/10.x/initials/svg?seed=${encodeURIComponent(
          dto.name,
        )}`,
      },
    });
  }

  private assertNotMember(membership: { id: string } | null) {
    if (membership) {
      throw new ConflictException("Người dùng đã là thành viên của workspace");
    }
  }
}
