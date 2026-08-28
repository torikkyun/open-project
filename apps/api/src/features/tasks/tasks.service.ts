import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@/infra/db";
import { Priority, TaskStatus } from "@/generated/prisma/enums";
import { getOffsetPagination } from "@/common/utils/pagination.util";
import { CreateTaskDto, UpdateTaskDto, QueryTaskDto } from "./dto";
import { ProjectAccessService } from "../projects/project-access.service";
import { NotificationsService } from "../notifications/notifications.service";

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccessService: ProjectAccessService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(
    projectId: string,
    query: QueryTaskDto,
    actingUser?: { sub: string; roles: string[] },
  ) {
    if (actingUser) {
      await this.projectAccessService.assertProjectAccess(
        actingUser,
        projectId,
        "view",
      );
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const { skip, take } = getOffsetPagination(page, limit);

    const where = {
      projectId,
      deletedAt: null,
      ...(query.search
        ? {
            OR: [
              {
                title: { contains: query.search, mode: "insensitive" as const },
              },
              {
                description: {
                  contains: query.search,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
      ...(query.parent_task_id ? { parentTaskId: query.parent_task_id } : {}),
      ...(query.assignee_id
        ? {
            assignees: {
              some: {
                userId: query.assignee_id,
                deletedAt: null,
              },
            },
          }
        : {}),
    };

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          description: true,
          priority: true,
          status: true,
          progressPercent: true,
          estimatedHours: true,
          actualHours: true,
          startDate: true,
          endDate: true,
          isMilestone: true,
          parentTaskId: true,
          assignees: {
            where: { deletedAt: null },
            select: {
              user: { select: { id: true, name: true } },
            },
          },
          _count: {
            select: { subtasks: true },
          },
          createdAt: true,
        },
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      data: tasks.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        progress_percent: task.progressPercent,
        estimated_hours: task.estimatedHours,
        actual_hours: task.actualHours,
        start_date: task.startDate,
        end_date: task.endDate,
        is_milestone: task.isMilestone,
        assignees: task.assignees.map((assignee) => ({
          id: assignee.user.id,
          name: assignee.user.name,
        })),
        parent_task_id: task.parentTaskId,
        subtasks_count: task._count.subtasks,
        created_at: task.createdAt,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async create(
    projectId: string,
    createTaskDto: CreateTaskDto,
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
      select: { id: true, startDate: true, endDate: true },
    });

    if (!project) {
      throw new NotFoundException("Không tìm thấy dự án");
    }

    if (createTaskDto.parent_task_id) {
      const parentTask = await this.prisma.task.findFirst({
        where: {
          id: createTaskDto.parent_task_id,
          projectId,
          deletedAt: null,
        },
        select: { id: true },
      });

      if (!parentTask) {
        throw new NotFoundException("Không tìm thấy công việc cha");
      }
    }

    const taskStartDate = createTaskDto.start_date
      ? new Date(createTaskDto.start_date)
      : project.startDate;
    const taskEndDate = createTaskDto.end_date
      ? new Date(createTaskDto.end_date)
      : project.endDate;

    if (taskStartDate > taskEndDate) {
      throw new BadRequestException(
        "end_date phải lớn hơn hoặc bằng start_date",
      );
    }

    if (taskStartDate < project.startDate || taskEndDate > project.endDate) {
      throw new BadRequestException(
        "task date phải nằm trong khoảng thời gian của dự án",
      );
    }

    const assigneeIds = [...new Set(createTaskDto.assignee_ids ?? [])];

    if (assigneeIds.length) {
      const validMembers = await this.prisma.projectMember.findMany({
        where: {
          projectId,
          userId: { in: assigneeIds },
          deletedAt: null,
        },
        select: { userId: true },
      });

      const validUserIds = new Set(validMembers.map((member) => member.userId));
      const invalidUserIds = assigneeIds.filter(
        (userId) => !validUserIds.has(userId),
      );

      if (invalidUserIds.length) {
        throw new BadRequestException(
          `assignee_ids không hợp lệ: ${invalidUserIds.join(", ")}`,
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const task = await tx.task.create({
        data: {
          projectId,
          title: createTaskDto.title,
          description: createTaskDto.description ?? null,
          priority: createTaskDto.priority ?? Priority.medium,
          estimatedHours: createTaskDto.estimated_hours,
          startDate: taskStartDate,
          endDate: taskEndDate,
          isMilestone: createTaskDto.is_milestone ?? false,
          parentTaskId: createTaskDto.parent_task_id ?? null,
          status: TaskStatus.todo,
          progressPercent: 0,
        },
        select: {
          id: true,
          projectId: true,
          title: true,
          description: true,
          priority: true,
          status: true,
          progressPercent: true,
          estimatedHours: true,
          actualHours: true,
          startDate: true,
          endDate: true,
          isMilestone: true,
          parentTaskId: true,
          createdAt: true,
        },
      });

      if (assigneeIds.length) {
        await tx.taskAssignee.createMany({
          data: assigneeIds.map((userId) => ({
            taskId: task.id,
            userId,
          })),
        });
      }

      const result = {
        id: task.id,
        project_id: task.projectId,
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        progress_percent: task.progressPercent,
        estimated_hours: task.estimatedHours,
        actual_hours: task.actualHours,
        start_date: task.startDate,
        end_date: task.endDate,
        is_milestone: task.isMilestone,
        parent_task_id: task.parentTaskId,
        assignee_ids: assigneeIds,
        created_at: task.createdAt,
      };
      await this.notificationsService.create(
        assigneeIds,
        "task_assigned",
        `Bạn được giao công việc "${task.title}"`,
        actingUser?.sub,
      );
      return result;
    });
  }

  async findOne(id: string, actingUser?: { sub: string; roles: string[] }) {
    const task = await this.prisma.task.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        projectId: true,
        title: true,
        description: true,
        priority: true,
        status: true,
        progressPercent: true,
        estimatedHours: true,
        actualHours: true,
        startDate: true,
        endDate: true,
        isMilestone: true,
        project: { select: { id: true, name: true } },
        parentTask: { select: { id: true, title: true } },
        subtasks: {
          where: { deletedAt: null },
          select: { id: true, title: true, status: true },
        },
        assignees: {
          where: { deletedAt: null },
          select: {
            user: { select: { id: true, name: true } },
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!task) {
      throw new NotFoundException("Không tìm thấy công việc");
    }

    if (actingUser) {
      await this.projectAccessService.assertProjectAccess(
        actingUser,
        task.projectId,
        "view",
      );
    }

    return {
      id: task.id,
      project_id: task.projectId,
      project_name: task.project.name,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      progress_percent: task.progressPercent,
      estimated_hours: task.estimatedHours,
      actual_hours: task.actualHours,
      start_date: task.startDate,
      end_date: task.endDate,
      is_milestone: task.isMilestone,
      parent_task: task.parentTask,
      subtasks: task.subtasks,
      assignees: task.assignees.map((assignee) => ({
        id: assignee.user.id,
        name: assignee.user.name,
      })),
      created_at: task.createdAt,
      updated_at: task.updatedAt,
    };
  }

  async update(
    id: string,
    updateTaskDto: UpdateTaskDto,
    actingUser?: { sub: string; roles: string[] },
  ) {
    const task = await this.prisma.task.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        projectId: true,
        startDate: true,
        endDate: true,
        parentTaskId: true,
        assignees: {
          where: { deletedAt: null },
          select: { userId: true },
        },
      },
    });

    if (!task) {
      throw new NotFoundException("Không tìm thấy công việc");
    }

    if (actingUser) {
      await this.projectAccessService.assertTaskAccess(
        actingUser,
        { projectId: task.projectId, assignees: task.assignees },
        "update",
      );
    }

    const nextStartDate =
      updateTaskDto.start_date !== undefined
        ? new Date(updateTaskDto.start_date)
        : task.startDate;
    const nextEndDate =
      updateTaskDto.end_date !== undefined
        ? new Date(updateTaskDto.end_date)
        : task.endDate;

    if (nextStartDate && nextEndDate && nextEndDate < nextStartDate) {
      throw new BadRequestException(
        "end_date phải lớn hơn hoặc bằng start_date",
      );
    }

    const parentTaskId =
      updateTaskDto.parent_task_id !== undefined
        ? updateTaskDto.parent_task_id
        : task.parentTaskId;

    if (parentTaskId && parentTaskId === id) {
      throw new BadRequestException(
        "parent_task_id không được là chính task hiện tại",
      );
    }

    if (parentTaskId) {
      const parentTask = await this.prisma.task.findFirst({
        where: {
          id: parentTaskId,
          projectId: task.projectId,
          deletedAt: null,
        },
        select: { id: true },
      });

      if (!parentTask) {
        throw new NotFoundException("Không tìm thấy công việc cha");
      }
    }

    const assigneeIds = updateTaskDto.assignee_ids
      ? [...new Set(updateTaskDto.assignee_ids)]
      : undefined;

    if (assigneeIds?.length) {
      const validMembers = await this.prisma.projectMember.findMany({
        where: {
          projectId: task.projectId,
          userId: { in: assigneeIds },
          deletedAt: null,
        },
        select: { userId: true },
      });

      const validUserIds = new Set(validMembers.map((member) => member.userId));
      const invalidUserIds = assigneeIds.filter(
        (userId) => !validUserIds.has(userId),
      );

      if (invalidUserIds.length) {
        throw new BadRequestException(
          `assignee_ids không hợp lệ: ${invalidUserIds.join(", ")}`,
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedTask = await tx.task.update({
        where: { id },
        data: {
          ...(updateTaskDto.title !== undefined
            ? { title: updateTaskDto.title }
            : {}),
          ...(updateTaskDto.description !== undefined
            ? { description: updateTaskDto.description }
            : {}),
          ...(updateTaskDto.priority !== undefined
            ? { priority: updateTaskDto.priority }
            : {}),
          ...(updateTaskDto.estimated_hours !== undefined
            ? { estimatedHours: updateTaskDto.estimated_hours }
            : {}),
          ...(updateTaskDto.actual_hours !== undefined
            ? { actualHours: updateTaskDto.actual_hours }
            : {}),
          ...(updateTaskDto.start_date !== undefined
            ? { startDate: new Date(updateTaskDto.start_date) }
            : {}),
          ...(updateTaskDto.end_date !== undefined
            ? { endDate: new Date(updateTaskDto.end_date) }
            : {}),
          ...(updateTaskDto.progress_percent !== undefined
            ? { progressPercent: updateTaskDto.progress_percent }
            : {}),
          ...(updateTaskDto.parent_task_id !== undefined
            ? { parentTaskId: updateTaskDto.parent_task_id }
            : {}),
          ...(updateTaskDto.is_milestone !== undefined
            ? { isMilestone: updateTaskDto.is_milestone }
            : {}),
        },
        select: {
          id: true,
          title: true,
          description: true,
          priority: true,
          progressPercent: true,
          estimatedHours: true,
          actualHours: true,
          startDate: true,
          endDate: true,
          status: true,
          updatedAt: true,
        },
      });

      if (assigneeIds !== undefined) {
        await tx.taskAssignee.deleteMany({
          where: { taskId: id, deletedAt: null },
        });

        if (assigneeIds.length) {
          await tx.taskAssignee.createMany({
            data: assigneeIds.map((userId) => ({
              taskId: id,
              userId,
            })),
          });
        }
      }

      const result = {
        id: updatedTask.id,
        title: updatedTask.title,
        description: updatedTask.description,
        priority: updatedTask.priority,
        progress_percent: updatedTask.progressPercent,
        estimated_hours: updatedTask.estimatedHours,
        actual_hours: updatedTask.actualHours,
        start_date: updatedTask.startDate,
        end_date: updatedTask.endDate,
        status: updatedTask.status,
        updated_at: updatedTask.updatedAt,
      };
      await this.notificationsService.create(
        assigneeIds ?? task.assignees.map((assignee) => assignee.userId),
        "task_updated",
        `Công việc "${updatedTask.title}" đã được cập nhật`,
        actingUser?.sub,
      );
      if (assigneeIds !== undefined) {
        await this.notificationsService.create(
          assigneeIds,
          "task_assigned",
          `Bạn được giao công việc "${updatedTask.title}"`,
          actingUser?.sub,
        );
      }
      return result;
    });
  }

  async updateStatus(
    id: string,
    status: TaskStatus,
    actingUser?: { sub: string; roles: string[] },
  ) {
    const task = await this.prisma.task.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        projectId: true,
        status: true,
        assignees: {
          where: { deletedAt: null },
          select: { userId: true },
        },
      },
    });

    if (!task) {
      throw new NotFoundException("Không tìm thấy công việc");
    }

    if (actingUser) {
      await this.projectAccessService.assertTaskAccess(
        actingUser,
        { projectId: task.projectId, assignees: task.assignees },
        "update",
      );
    }

    const currentStatus = task.status;
    const validTransitions: Record<TaskStatus, TaskStatus[]> = {
      todo: [TaskStatus.in_progress, TaskStatus.canceled],
      in_progress: [TaskStatus.review, TaskStatus.done, TaskStatus.canceled],
      review: [TaskStatus.in_progress, TaskStatus.done, TaskStatus.canceled],
      done: [TaskStatus.in_progress, TaskStatus.canceled],
      canceled: [TaskStatus.in_progress],
    };

    if (!validTransitions[currentStatus]?.includes(status)) {
      throw new BadRequestException("invalid status transition");
    }

    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: { status },
      select: { id: true, status: true, updatedAt: true },
    });

    const result = {
      id: updatedTask.id,
      status: updatedTask.status,
      updated_at: updatedTask.updatedAt,
    };
    await this.notificationsService.notifyTaskParticipants(
      id,
      status === TaskStatus.review
        ? "task_review_requested"
        : "task_status_changed",
      `Công việc đã chuyển sang trạng thái ${status}`,
      actingUser?.sub,
    );
    return result;
  }

  async approveReview(
    id: string,
    comment?: string,
    actingUser?: { sub: string; roles: string[] },
  ) {
    const task = await this.prisma.task.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        projectId: true,
        status: true,
      },
    });

    if (!task) {
      throw new NotFoundException("Không tìm thấy công việc");
    }

    if (actingUser) {
      await this.projectAccessService.assertProjectAccess(
        actingUser,
        task.projectId,
        "manage",
      );
    }

    if (task.status !== TaskStatus.review) {
      throw new BadRequestException("task not in review status");
    }

    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: {
        status: TaskStatus.done,
        ...(comment !== undefined ? { description: comment } : {}),
      },
      select: { id: true, status: true, updatedAt: true },
    });

    const result = {
      id: updatedTask.id,
      status: updatedTask.status,
      updated_at: updatedTask.updatedAt,
    };
    await this.notificationsService.notifyTaskParticipants(
      id,
      "task_review_approved",
      `Công việc đã được duyệt${comment ? `: ${comment}` : ""}`,
      actingUser?.sub,
    );
    return result;
  }

  async rejectReview(
    id: string,
    comment: string,
    actingUser?: { sub: string; roles: string[] },
  ) {
    const task = await this.prisma.task.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        projectId: true,
        status: true,
      },
    });

    if (!task) {
      throw new NotFoundException("Không tìm thấy công việc");
    }

    if (actingUser) {
      await this.projectAccessService.assertProjectAccess(
        actingUser,
        task.projectId,
        "manage",
      );
    }

    if (task.status !== TaskStatus.review) {
      throw new BadRequestException("task not in review status");
    }

    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: {
        status: TaskStatus.in_progress,
        ...(comment ? { description: comment } : {}),
      },
      select: { id: true, status: true, updatedAt: true },
    });

    const result = {
      id: updatedTask.id,
      status: updatedTask.status,
      updated_at: updatedTask.updatedAt,
    };
    await this.notificationsService.notifyTaskParticipants(
      id,
      "task_review_rejected",
      `Công việc cần chỉnh sửa${comment ? `: ${comment}` : ""}`,
      actingUser?.sub,
    );
    return result;
  }

  async remove(id: string, actingUser?: { sub: string; roles: string[] }) {
    const task = await this.prisma.task.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, projectId: true },
    });

    if (!task) {
      throw new NotFoundException("Không tìm thấy công việc");
    }

    if (actingUser) {
      await this.projectAccessService.assertProjectAccess(
        actingUser,
        task.projectId,
        "manage",
      );
    }

    await this.prisma.task.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { id: task.id };
  }
}
