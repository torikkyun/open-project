import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { QueryBus } from "@nestjs/cqrs";
import { PERMISSIONS_KEY } from "@/common/decorators/require-permissions.decorator";
import { GetUserPermissionsQuery } from "@/modules/role/application/queries/get-user-permissions/query";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly queryBus: QueryBus,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    if (!userId) throw new ForbiddenException("Missing user context");

    const userPermissions: string[] = await this.queryBus.execute(
      new GetUserPermissionsQuery(userId),
    );

    const hasAll = required.every((code) => userPermissions.includes(code));
    if (!hasAll) {
      throw new ForbiddenException("Insufficient permissions");
    }

    return true;
  }
}
