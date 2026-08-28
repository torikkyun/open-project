import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "@/infra/db";
import { ProjectAccessService } from "../projects/project-access.service";
import { TaskStatus } from "@/generated/prisma/enums";
import { ReportQueryDto } from "./dto";

type ReportUser = { sub: string; roles: string[] };

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccessService: ProjectAccessService,
  ) {}

  private hasGlobalAccess(user: ReportUser) {
    return user.roles.some((role) =>
      ["admin", "project_manager"].includes(role.toLowerCase()),
    );
  }

  private async getTaskWhere(query: ReportQueryDto, user: ReportUser) {
    if (query.date_from && query.date_to && query.date_from > query.date_to) {
      throw new BadRequestException("date_from phải nhỏ hơn hoặc bằng date_to");
    }

    if (query.project_id) {
      await this.projectAccessService.assertProjectAccess(
        user,
        query.project_id,
        "view",
      );
    }

    const projectScope = {
      project: {
        deletedAt: null,
        ...(this.hasGlobalAccess(user)
          ? {}
          : {
              members: {
                some: { userId: user.sub, canView: true, deletedAt: null },
              },
            }),
      },
    };

    const from = query.date_from ? new Date(query.date_from) : undefined;
    const to = query.date_to ? new Date(query.date_to) : undefined;

    return {
      deletedAt: null,
      ...projectScope,
      ...(query.project_id ? { projectId: query.project_id } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(from || to
        ? {
            AND: [
              ...(to ? [{ startDate: { lte: to } }] : []),
              ...(from ? [{ endDate: { gte: from } }] : []),
            ],
          }
        : {}),
    };
  }

  private toNumber(value: unknown) {
    return Number(value ?? 0);
  }

  async getDashboard(query: ReportQueryDto, user: ReportUser) {
    const taskWhere = await this.getTaskWhere(query, user);
    const projectWhere = query.project_id
      ? { id: query.project_id, deletedAt: null }
      : {
          deletedAt: null,
          ...(this.hasGlobalAccess(user)
            ? {}
            : {
                members: {
                  some: { userId: user.sub, canView: true, deletedAt: null },
                },
              }),
        };
    const now = new Date();
    const overdueWhere = {
      ...taskWhere,
      endDate: { lt: now },
      status: { notIn: [TaskStatus.done, TaskStatus.canceled] },
    };

    const [
      projectsTotal,
      projectsByStatus,
      tasksTotal,
      tasksByStatus,
      hours,
      overdue,
      assigned,
      review,
    ] = await Promise.all([
      this.prisma.project.count({ where: projectWhere }),
      this.prisma.project.groupBy({
        by: ["status"],
        where: projectWhere,
        _count: { _all: true },
      }),
      this.prisma.task.count({ where: taskWhere }),
      this.prisma.task.groupBy({
        by: ["status"],
        where: taskWhere,
        _count: { _all: true },
      }),
      this.prisma.task.aggregate({
        where: taskWhere,
        _sum: { estimatedHours: true, actualHours: true },
        _avg: { progressPercent: true },
      }),
      this.prisma.task.count({ where: overdueWhere }),
      this.prisma.task.count({
        where: {
          ...taskWhere,
          assignees: { some: { userId: user.sub, deletedAt: null } },
        },
      }),
      this.prisma.task.count({
        where: { ...taskWhere, status: TaskStatus.review },
      }),
    ]);

    return {
      projects: {
        total: projectsTotal,
        by_status: Object.fromEntries(
          projectsByStatus.map((item) => [item.status, item._count._all]),
        ),
      },
      tasks: {
        total: tasksTotal,
        by_status: Object.fromEntries(
          tasksByStatus.map((item) => [item.status, item._count._all]),
        ),
        backlog: tasksByStatus
          .filter(
            (item) =>
              item.status === TaskStatus.todo ||
              item.status === TaskStatus.in_progress,
          )
          .reduce((total, item) => total + item._count._all, 0),
        overdue,
        needing_review: review,
        assigned_to_me: assigned,
      },
      progress_percent: Number(hours._avg.progressPercent ?? 0),
      hours: {
        estimated: this.toNumber(hours._sum.estimatedHours),
        actual: this.toNumber(hours._sum.actualHours),
      },
      sla: { overdue_tasks: overdue },
      generated_at: now,
    };
  }

  async getTaskReport(query: ReportQueryDto, user: ReportUser) {
    const where = await this.getTaskWhere(query, user);
    const tasks = await this.prisma.task.findMany({
      where,
      orderBy: [{ endDate: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        title: true,
        projectId: true,
        status: true,
        progressPercent: true,
        estimatedHours: true,
        actualHours: true,
        startDate: true,
        endDate: true,
        project: { select: { name: true } },
        assignees: {
          where: { deletedAt: null },
          select: { user: { select: { name: true } } },
        },
      },
    });

    return tasks.map((task) => ({
      id: task.id,
      project_id: task.projectId,
      project_name: task.project.name,
      title: task.title,
      status: task.status,
      progress_percent: task.progressPercent,
      estimated_hours: this.toNumber(task.estimatedHours),
      actual_hours: this.toNumber(task.actualHours),
      start_date: task.startDate,
      end_date: task.endDate,
      overdue: Boolean(
        task.endDate &&
        task.endDate < new Date() &&
        task.status !== TaskStatus.done &&
        task.status !== TaskStatus.canceled,
      ),
      assignees: task.assignees
        .map((assignee) => assignee.user.name)
        .join(", "),
    }));
  }

  async exportTasks(query: ReportQueryDto, user: ReportUser) {
    const rows = await this.getTaskReport(query, user);
    const columns = [
      "id",
      "project_id",
      "project_name",
      "title",
      "status",
      "progress_percent",
      "estimated_hours",
      "actual_hours",
      "start_date",
      "end_date",
      "overdue",
      "assignees",
    ] as const;
    const escape = (value: unknown) =>
      `"${String(value ?? "").replaceAll('"', '""')}"`;
    return [
      columns.join(","),
      ...rows.map((row) =>
        columns.map((column) => escape(row[column])).join(","),
      ),
    ].join("\r\n");
  }
}
