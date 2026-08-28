import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@/infra/db";
import { ProjectStatus, ProjectRole } from "@/generated/prisma/enums";
import { getOffsetPagination } from "@/common/utils/pagination.util";
import { AddProjectMemberDto, CreateProjectDto, UpdateProjectDto } from "./dto";
import { ProjectAccessService } from "./project-access.service";
import { NotificationsService } from "../notifications/notifications.service";

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccessService: ProjectAccessService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(
    query: {
      page?: number;
      limit?: number;
      search?: string;
      status?: ProjectStatus;
      manager_id?: string;
      start_date_from?: string | Date;
      start_date_to?: string | Date;
    } = {},
    actingUser?: { sub: string; roles: string[] },
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const { skip, take } = getOffsetPagination(page, limit);

    const where = {
      deletedAt: null,
      ...(actingUser &&
      !actingUser.roles.some((role) =>
        ["admin", "project_manager"].includes(role.toLowerCase()),
      )
        ? {
            members: {
              some: {
                userId: actingUser.sub,
                canView: true,
                deletedAt: null,
              },
            },
          }
        : {}),
      ...(query.search
        ? {
            name: {
              contains: query.search,
              mode: "insensitive" as const,
            },
          }
        : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.manager_id ? { createdById: query.manager_id } : {}),
      ...(query.start_date_from || query.start_date_to
        ? {
            startDate: {
              ...(query.start_date_from
                ? { gte: new Date(query.start_date_from) }
                : {}),
              ...(query.start_date_to
                ? { lte: new Date(query.start_date_to) }
                : {}),
            },
          }
        : {}),
    };

    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          startDate: true,
          endDate: true,
          createdBy: { select: { id: true, name: true } },
          createdAt: true,
          _count: {
            select: {
              members: true,
              tasks: true,
            },
          },
        },
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      data: projects.map((project) => ({
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        start_date: project.startDate,
        end_date: project.endDate,
        created_by: project.createdBy,
        members_count: project._count.members,
        tasks_count: project._count.tasks,
        created_at: project.createdAt,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async create(createProjectDto: CreateProjectDto, createdById: string) {
    const startDate = new Date(createProjectDto.start_date);
    const endDate = new Date(createProjectDto.end_date);

    if (endDate < startDate) {
      throw new BadRequestException(
        "end_date phải lớn hơn hoặc bằng start_date",
      );
    }

    return this.prisma.$transaction(async (tx) => {
      if (createProjectDto.template_id) {
        const template = await tx.template.findUnique({
          where: { id: createProjectDto.template_id },
          select: { id: true },
        });

        if (!template) {
          throw new BadRequestException("template_id không tồn tại");
        }
      }

      const uniqueMemberIds = [...new Set(createProjectDto.member_ids ?? [])];

      if (uniqueMemberIds.length) {
        const validUsers = await tx.user.findMany({
          where: {
            id: { in: uniqueMemberIds },
            deletedAt: null,
          },
          select: { id: true },
        });

        const validUserIds = new Set(validUsers.map((user) => user.id));
        const invalidMemberIds = uniqueMemberIds.filter(
          (userId) => !validUserIds.has(userId),
        );

        if (invalidMemberIds.length) {
          throw new BadRequestException(
            `member_ids không hợp lệ: ${invalidMemberIds.join(", ")}`,
          );
        }
      }

      const project = await tx.project.create({
        data: {
          name: createProjectDto.name,
          description: createProjectDto.description ?? null,
          startDate,
          endDate,
          createdById,
          templateId: createProjectDto.template_id ?? null,
          status: ProjectStatus.not_started,
        },
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          startDate: true,
          endDate: true,
          createdById: true,
          templateId: true,
          createdAt: true,
        },
      });

      if (uniqueMemberIds.length) {
        await tx.projectMember.createMany({
          data: uniqueMemberIds.map((userId) => ({
            projectId: project.id,
            userId,
            role: ProjectRole.member,
          })),
        });
      }
      return project;
    });
  }

  async findOne(id: string, actingUser?: { sub: string; roles: string[] }) {
    if (actingUser) {
      await this.projectAccessService.assertProjectAccess(
        actingUser,
        id,
        "view",
      );
    }

    const project = await this.prisma.project.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        startDate: true,
        endDate: true,
        createdBy: { select: { id: true, name: true } },
        members: {
          where: { deletedAt: null },
          select: {
            user: { select: { id: true, name: true } },
            role: true,
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!project) {
      throw new NotFoundException("Không tìm thấy dự án");
    }

    return {
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      start_date: project.startDate,
      end_date: project.endDate,
      created_by: project.createdBy,
      members: project.members.map((member) => ({
        id: member.user.id,
        name: member.user.name,
        role: member.role,
      })),
      tasks_count: project._count.tasks,
      created_at: project.createdAt,
      updated_at: project.updatedAt,
    };
  }

  async update(
    id: string,
    updateProjectDto: UpdateProjectDto,
    actingUser?: { sub: string; roles: string[] },
  ) {
    if (actingUser) {
      await this.projectAccessService.assertProjectAccess(
        actingUser,
        id,
        "manage",
      );
    }

    const existingProject = await this.prisma.project.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, startDate: true, endDate: true },
    });

    if (!existingProject) {
      throw new NotFoundException("Không tìm thấy dự án");
    }

    const nextStartDate =
      updateProjectDto.start_date !== undefined
        ? new Date(updateProjectDto.start_date)
        : existingProject.startDate;
    const nextEndDate =
      updateProjectDto.end_date !== undefined
        ? new Date(updateProjectDto.end_date)
        : existingProject.endDate;

    if (nextEndDate < nextStartDate) {
      throw new BadRequestException(
        "end_date phải lớn hơn hoặc bằng start_date",
      );
    }

    const project = await this.prisma.project.update({
      where: { id },
      data: {
        ...(updateProjectDto.name !== undefined
          ? { name: updateProjectDto.name }
          : {}),
        ...(updateProjectDto.description !== undefined
          ? { description: updateProjectDto.description }
          : {}),
        ...(updateProjectDto.start_date !== undefined
          ? { startDate: nextStartDate }
          : {}),
        ...(updateProjectDto.end_date !== undefined
          ? { endDate: nextEndDate }
          : {}),
        ...(updateProjectDto.status !== undefined
          ? { status: updateProjectDto.status }
          : {}),
      },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        startDate: true,
        endDate: true,
        updatedAt: true,
      },
    });

    return {
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      start_date: project.startDate,
      end_date: project.endDate,
      updated_at: project.updatedAt,
    };
  }

  /*
   * Khi soft delete project (deletedAt), các bảng con như tasks, milestones, attachments vẫn giữ nguyên. Nếu sau này truy vấn task mà không lọc theo deletedAt của project, có thể lấy task thuộc project đã xóa. Nên cân nhắc soft delete cascade hoặc luôn lọc deletedAt khi join. Không phải lỗi critical nếu đã có lọc trong query.
   */
  async remove(id: string, actingUser?: { sub: string; roles: string[] }) {
    if (actingUser) {
      await this.projectAccessService.assertProjectAccess(
        actingUser,
        id,
        "manage",
      );
    }

    const project = await this.prisma.project.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });

    if (!project) {
      throw new NotFoundException("Không tìm thấy dự án");
    }

    await this.prisma.project.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { id: project.id };
  }

  async archive(id: string, actingUser?: { sub: string; roles: string[] }) {
    if (actingUser) {
      await this.projectAccessService.assertProjectAccess(
        actingUser,
        id,
        "manage",
      );
    }

    const project = await this.prisma.project.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });

    if (!project) {
      throw new NotFoundException("Không tìm thấy dự án");
    }

    const updatedProject = await this.prisma.project.update({
      where: { id },
      data: { status: ProjectStatus.archived },
      select: { id: true, status: true, updatedAt: true },
    });

    return {
      id: updatedProject.id,
      status: updatedProject.status,
      updated_at: updatedProject.updatedAt,
    };
  }

  async addMember(
    projectId: string,
    addProjectMemberDto: AddProjectMemberDto,
    actingUser?: { sub: string; roles: string[] },
  ) {
    if (actingUser) {
      await this.projectAccessService.assertProjectAccess(
        actingUser,
        projectId,
        "manage",
      );
    }

    const project = await this.prisma.project.findFirst({
      where: { id: projectId, deletedAt: null },
      select: { id: true },
    });

    if (!project) {
      throw new NotFoundException("Không tìm thấy dự án");
    }

    const user = await this.prisma.user.findFirst({
      where: { id: addProjectMemberDto.user_id, deletedAt: null },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException("Không tìm thấy người dùng");
    }

    const existingMember = await this.prisma.projectMember.findFirst({
      where: {
        projectId,
        userId: addProjectMemberDto.user_id,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (existingMember) {
      throw new BadRequestException("Người dùng đã có trong dự án");
    }

    const member = await this.prisma.projectMember.create({
      data: {
        projectId,
        userId: addProjectMemberDto.user_id,
        role: addProjectMemberDto.role,
        canView: addProjectMemberDto.can_view ?? true,
        canComment: addProjectMemberDto.can_comment ?? false,
        canUpload: addProjectMemberDto.can_upload ?? false,
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
    await this.notificationsService.create(
      [member.userId],
      "project_added",
      `Bạn đã được thêm vào dự án ${projectId}`,
      actingUser?.sub,
    );
    return member;
  }

  async removeMember(
    projectId: string,
    userId: string,
    actingUser?: { sub: string; roles: string[] },
  ) {
    if (actingUser) {
      await this.projectAccessService.assertProjectAccess(
        actingUser,
        projectId,
        "manage",
      );
    }

    const project = await this.prisma.project.findFirst({
      where: { id: projectId, deletedAt: null },
      select: { id: true },
    });

    if (!project) {
      throw new NotFoundException("Không tìm thấy dự án");
    }

    const member = await this.prisma.projectMember.findFirst({
      where: { projectId, userId, deletedAt: null },
      select: { id: true },
    });

    if (!member) {
      throw new NotFoundException("Không tìm thấy thành viên trong dự án");
    }

    await this.prisma.projectMember.update({
      where: { id: member.id },
      data: { deletedAt: new Date() },
    });

    return { id: member.id };
  }
}
