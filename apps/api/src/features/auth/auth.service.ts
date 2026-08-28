import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "@/infra/db";
import { JwtService, type JwtSignOptions } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { LoginDto, RefreshDto, RegisterDto } from "./dto";
import { hashPassword, verifyPassword } from "@/common/utils/hash.util";
import { AuthenticatedUser } from "@/common/types/auth-user.type";

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  // TODO: Kiểm tra invite token (của guest) trước khi tạo user
  async register(registerDto: RegisterDto) {
    const existingUser = await this.prisma.user.findFirst({
      where: { email: registerDto.email, deletedAt: null },
    });

    if (existingUser) {
      throw new ConflictException("Email đã tồn tại");
    }

    const user = await this.prisma.user.create({
      data: {
        name: registerDto.name,
        email: registerDto.email,
        passwordHash: await hashPassword(registerDto.password),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return user;
  }

  private async validateUser(
    email: string,
    password: string,
  ): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findFirst({
      where: { email, deletedAt: null },
    });

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      throw new UnauthorizedException("Thông tin đăng nhập không hợp lệ");
    }

    return { id: user.id, email: user.email, name: user.name };
  }

  async login(dto: LoginDto) {
    const authenticatedUser = await this.validateUser(dto.email, dto.password);
    const user = await this.prisma.user.findFirst({
      where: { id: authenticatedUser.id, deletedAt: null },
      include: {
        projectMembers: {
          where: { deletedAt: null },
          orderBy: { createdAt: "asc" },
          select: {
            projectId: true,
            canView: true,
            canComment: true,
            canUpload: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException("Thông tin đăng nhập không hợp lệ");
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      name: user.name,
      roles: [user.role],
      type: "access",
    });
    const refreshToken = await this.jwtService.signAsync(
      { sub: user.id, type: "refresh" },
      {
        expiresIn: this.configService.getOrThrow<string>(
          "jwt.jwtRefreshExpiration",
          { infer: true },
        ) as JwtSignOptions["expiresIn"],
      },
    );
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department_id: user.departmentId,
        project_permissions: user.projectMembers.map((projectMember) => ({
          project_id: projectMember.projectId,
          can_view: projectMember.canView,
          can_comment: projectMember.canComment,
          can_upload: projectMember.canUpload,
        })),
      },
    };
  }

  async refresh(refreshDto: RefreshDto) {
    const payload = await this.jwtService.verifyAsync<{
      sub: string;
      type: string;
    }>(refreshDto.refresh_token);

    if (payload.type !== "refresh") {
      throw new UnauthorizedException("Refresh token không hợp lệ");
    }

    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, deletedAt: null },
    });

    if (!user) {
      throw new UnauthorizedException("Refresh token không hợp lệ");
    }

    return {
      access_token: await this.jwtService.signAsync({
        sub: user.id,
        email: user.email,
        name: user.name,
        roles: [user.role],
        type: "access",
      }),
    };
  }

  logout() {
    return {};
  }
}
