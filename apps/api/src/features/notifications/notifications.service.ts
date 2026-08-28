import {
  Injectable,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { NotificationType } from "@/generated/prisma/enums";
import { PrismaService } from "@/infra/db";
import { getOffsetPagination } from "@/common/utils/pagination.util";

type UserContext = { sub: string; roles: string[] };

@Injectable()
export class NotificationsService implements OnModuleInit, OnModuleDestroy {
  private overdueTimer?: NodeJS.Timeout;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    void this.notifyOverdueTasks().catch(() => undefined);
    this.overdueTimer = setInterval(() => {
      void this.notifyOverdueTasks().catch(() => undefined);
    }, 60_000);
    this.overdueTimer.unref();
  }

  onModuleDestroy() {
    if (this.overdueTimer) clearInterval(this.overdueTimer);
  }

  async create(
    userIds: string[],
    type: NotificationType,
    content: string,
    excludeUserId?: string,
  ) {
    const recipients = [
      ...new Set(userIds.filter((userId) => userId !== excludeUserId)),
    ];
    if (!recipients.length) return;

    await this.prisma.notification.createMany({
      data: recipients.map((userId) => ({ userId, type, content })),
    });
  }

  async notifyTaskParticipants(
    taskId: string,
    type: NotificationType,
    content: string,
    excludeUserId?: string,
  ) {
    const assignees = await this.prisma.taskAssignee.findMany({
      where: { taskId, deletedAt: null },
      select: { userId: true },
    });
    await this.create(
      assignees.map((assignee) => assignee.userId),
      type,
      content,
      excludeUserId,
    );
  }

  async list(user: UserContext, page = 1, limit = 10) {
    const { skip, take } = getOffsetPagination(page, limit);
    const where = { userId: user.sub, deletedAt: null };
    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { ...where, isRead: false } }),
    ]);

    return {
      data: notifications.map((notification) => this.serialize(notification)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      unread_count: unreadCount,
    };
  }

  async unreadCount(user: UserContext) {
    return {
      unread_count: await this.prisma.notification.count({
        where: { userId: user.sub, deletedAt: null, isRead: false },
      }),
    };
  }

  async markRead(id: string, user: UserContext) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId: user.sub, deletedAt: null },
      select: { id: true },
    });
    if (!notification) throw new NotFoundException("Không tìm thấy thông báo");

    const updated = await this.prisma.notification.update({
      where: { id: notification.id },
      data: { isRead: true, readAt: new Date() },
    });
    return this.serialize(updated);
  }

  async markAllRead(user: UserContext) {
    const result = await this.prisma.notification.updateMany({
      where: { userId: user.sub, deletedAt: null, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { updated_count: result.count };
  }

  async notifyOverdueTasks(now = new Date()) {
    const tasks = await this.prisma.task.findMany({
      where: {
        deletedAt: null,
        endDate: { lt: now },
        status: { notIn: ["done", "canceled"] },
      },
      select: { id: true, title: true },
    });

    for (const task of tasks) {
      const assignees = await this.prisma.taskAssignee.findMany({
        where: { taskId: task.id, deletedAt: null },
        select: { userId: true },
      });
      const recipients = assignees.map((assignee) => assignee.userId);
      const existing = await this.prisma.notification.findMany({
        where: {
          type: NotificationType.task_overdue,
          content: `Công việc "${task.title}" đã quá hạn`,
          userId: { in: recipients },
          createdAt: {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          },
        },
        select: { userId: true },
      });
      const existingIds = new Set(
        existing.map((notification) => notification.userId),
      );
      await this.create(
        recipients.filter((userId) => !existingIds.has(userId)),
        NotificationType.task_overdue,
        `Công việc "${task.title}" đã quá hạn`,
      );
    }
  }

  private serialize(notification: {
    id: string;
    userId: string;
    type: NotificationType;
    content: string;
    isRead: boolean;
    readAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: notification.id,
      user_id: notification.userId,
      type: notification.type,
      content: notification.content,
      is_read: notification.isRead,
      read_at: notification.readAt,
      created_at: notification.createdAt,
      updated_at: notification.updatedAt,
    };
  }
}
