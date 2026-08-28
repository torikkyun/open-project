import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@/infra/db";
import type { JwtPayload } from "@/common/types/jwt-payload.type";

export type ProjectPermission = "view" | "comment" | "upload" | "manage";

@Injectable()
export class ProjectAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async getProjectMembership(projectId: string, userId: string) {
    return this.prisma.projectMember.findFirst({
      where: {
        projectId,
        userId,
        deletedAt: null,
      },
      select: {
        projectId: true,
        userId: true,
        role: true,
        canView: true,
        canComment: true,
        canUpload: true,
      },
    });
  }

  private hasGlobalAccess(user: Pick<JwtPayload, "roles">) {
    const roles = (user.roles ?? []).map((role) => role.toLowerCase());
    return roles.includes("admin") || roles.includes("project_manager");
  }

  async assertProjectAccess(
    user: Pick<JwtPayload, "sub" | "roles">,
    projectId: string,
    permission: ProjectPermission = "view",
  ) {
    if (this.hasGlobalAccess(user)) {
      return;
    }

    const membership = await this.getProjectMembership(projectId, user.sub);

    if (!membership) {
      throw new ForbiddenException("Bạn không có quyền truy cập dự án này.");
    }

    switch (permission) {
      case "view":
        if (!membership.canView) {
          throw new ForbiddenException("Bạn không có quyền xem dự án này.");
        }
        return;
      case "comment":
        if (!membership.canComment) {
          throw new ForbiddenException(
            "Bạn không có quyền bình luận trong dự án này.",
          );
        }
        return;
      case "upload":
        if (!membership.canUpload) {
          throw new ForbiddenException(
            "Bạn không có quyền tải lên tệp trong dự án này.",
          );
        }
        return;
      case "manage":
        if (membership.role === "manager") {
          return;
        }
        throw new ForbiddenException("Bạn không có quyền quản lý dự án này.");
      default:
        throw new ForbiddenException("Bạn không có quyền truy cập dự án này.");
    }
  }

  async canUpdateTask(
    user: Pick<JwtPayload, "sub" | "roles">,
    task: {
      id?: string;
      projectId: string;
      assignees?: Array<{ userId: string }>;
    },
  ) {
    if (this.hasGlobalAccess(user)) {
      return true;
    }

    const membership = await this.getProjectMembership(
      task.projectId,
      user.sub,
    );
    if (!membership) {
      return false;
    }

    if (membership.role === "manager") {
      return true;
    }

    return (task.assignees ?? []).some(
      (assignee) => assignee.userId === user.sub,
    );
  }

  async assertTaskAccess(
    user: Pick<JwtPayload, "sub" | "roles">,
    task: {
      id?: string;
      projectId: string;
      assignees?: Array<{ userId: string }>;
    },
    permission: "view" | "comment" | "upload" | "update" = "view",
  ) {
    const projectPermissionMap = {
      view: "view",
      comment: "comment",
      upload: "upload",
      update: "manage",
    } as const;

    if (permission !== "update") {
      await this.assertProjectAccess(
        user,
        task.projectId,
        projectPermissionMap[permission],
      );
      return;
    }

    if (!(await this.canUpdateTask(user, task))) {
      throw new ForbiddenException(
        "Bạn không có quyền cập nhật công việc này.",
      );
    }
  }

  async assertProjectExists(projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, deletedAt: null },
      select: { id: true },
    });

    if (!project) {
      throw new NotFoundException("Không tìm thấy dự án");
    }

    return project;
  }
}
