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

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

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

  async login(user: AuthenticatedUser) {
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
    });

    return { accessToken };
  }
}
