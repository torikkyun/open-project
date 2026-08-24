import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "../../../common/decorators/roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<{
      user: { roles: Array<string | { name: string }> };
    }>();

    const hasRole = requiredRoles.some((role) =>
      user.roles.some((userRole) =>
        typeof userRole === "string"
          ? userRole === role
          : userRole.name === role,
      ),
    );

    if (!hasRole) {
      throw new ForbiddenException(
        "Bạn không có quyền truy cập vào tài nguyên này.",
      );
    }

    return true;
  }
}
