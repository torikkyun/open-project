import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "@/infra/db";
import { JwtService } from "@nestjs/jwt";
import { RegisterDto } from "./dto/register.dto";
import { hashPassword, verifyPassword } from "@/common/utils/hash.util";
import { AuthenticatedUser } from "@/common/types/auth-user.type";
import { Prisma } from "@/generated/prisma/client";
import { randomBytes } from "crypto";
import { CookieService } from "./cookie.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly cookieService: CookieService,
  ) {}

  private async upsertRefreshToken(
    userId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    const token = randomBytes(64).toString("hex");
    const expiresAt = new Date(
      Date.now() + this.cookieService.getRefreshTokenMaxAge(),
    );

    const result = await client.refreshToken.upsert({
      where: { userId },
      create: {
        token,
        expiresAt,
        user: { connect: { id: userId } },
      },
      update: {
        token,
        expiresAt,
      },
      select: { token: true },
    });

    return result.token;
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, passwordHash: true },
    });

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      throw new UnauthorizedException("Email hoặc mật khẩu không đúng");
    }

    return { id: user.id, email: user.email, name: user.name };
  }

  async register({ name, email, password }: RegisterDto) {
    try {
      const user = await this.prisma.user.create({
        data: {
          name,
          email,
          passwordHash: await hashPassword(password),
          avatarUrl: `https://api.dicebear.com/10.x/initials/svg?seed=${encodeURIComponent(name)}`,
        },
        select: { id: true, email: true, name: true },
      });

      return this.login({ id: user.id, email: user.email, name: user.name });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException("Email đã được sử dụng");
      }
      throw error;
    }
  }

  private async getUserRoles(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { membership: { include: { role: true } } },
    });

    const role = user?.membership?.role;
    return role ? [role.code, role.name] : [];
  }

  async login(user: AuthenticatedUser) {
    const roles = await this.getUserRoles(user.id);
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      roles,
    });

    const refreshToken = await this.upsertRefreshToken(user.id);

    return { accessToken, refreshToken };
  }

  async refresh(token: string) {
    if (!token) {
      throw new UnauthorizedException("Refresh token không hợp lệ");
    }
    const result = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.refreshToken.findUnique({
        where: { token },
        include: { user: true },
      });

      if (!existing || !existing.user) {
        throw new UnauthorizedException("Refresh token không hợp lệ");
      }

      if (existing.expiresAt < new Date()) {
        await tx.refreshToken.delete({ where: { id: existing.id } });
        throw new UnauthorizedException("Refresh token đã hết hạn");
      }

      await tx.refreshToken.delete({ where: { id: existing.id } });
      const newRefreshToken = await this.upsertRefreshToken(
        existing.user.id,
        tx,
      );

      return { user: existing.user, refreshToken: newRefreshToken };
    });

    const roles = await this.getUserRoles(result.user.id);
    const accessToken = await this.jwtService.signAsync({
      sub: result.user.id,
      email: result.user.email,
      roles,
    });

    return { accessToken, refreshToken: result.refreshToken };
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }
}
