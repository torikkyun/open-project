import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import type { JwtPayload } from "@/common/types/jwt-payload.type";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "@/infra/db";
import { ROLES_KEY } from "@/common/decorators/roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      user?: JwtPayload;
    }>();

    const roles = request.user?.roles ?? [];

    if (!roles.length) {
      throw new ForbiddenException(
        "Bạn không có quyền truy cập vào tài nguyên này.",
      );
    }

    const normalizedRoles = roles.map((value) => value.toLowerCase());
    const hasRole = requiredRoles.some((requiredRole) =>
      normalizedRoles.includes(requiredRole.toLowerCase()),
    );

    if (!hasRole) {
      throw new ForbiddenException(
        "Bạn không có quyền truy cập vào tài nguyên này.",
      );
    }

    return true;
  }
}
