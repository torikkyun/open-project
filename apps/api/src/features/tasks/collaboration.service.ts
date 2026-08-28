import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "@/infra/db";
import { ProjectAccessService } from "../projects/project-access.service";
import { CreateCommentDto, UpdateCommentDto } from "./dto";
import { createReadStream, existsSync, mkdirSync } from "node:fs";
import { basename, join, resolve, sep } from "node:path";
import { randomUUID } from "node:crypto";
import { NotificationsService } from "../notifications/notifications.service";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

@Injectable()
export class CollaborationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccessService: ProjectAccessService,
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private uploadRoot() {
    const root = resolve(
      this.configService.get<string>("UPLOAD_PATH") ??
        join(process.cwd(), "uploads"),
    );
    mkdirSync(root, { recursive: true });
    return root;
  }

  private serializeComment(comment: {
    id: string;
    taskId: string;
    userId: string;
    parentCommentId: string | null;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    user: { id: string; name: string };
    attachments: Array<{
      id: string;
      fileName: string;
      fileSize: bigint;
      mimeType: string | null;
      createdAt: Date;
    }>;
  }) {
    return {
      id: comment.id,
      task_id: comment.taskId,
      user: comment.user,
      parent_comment_id: comment.parentCommentId,
      content: comment.content,
      attachments: comment.attachments.map((attachment) => ({
        id: attachment.id,
        file_name: attachment.fileName,
        file_size: Number(attachment.fileSize),
        mime_type: attachment.mimeType,
        created_at: attachment.createdAt,
      })),
      created_at: comment.createdAt,
      updated_at: comment.updatedAt,
    };
  }

  private commentInclude() {
    return {
      user: { select: { id: true, name: true } },
      attachments: {
        where: { deletedAt: null },
        select: {
          id: true,
          fileName: true,
          fileSize: true,
          mimeType: true,
          createdAt: true,
        },
      },
    } as const;
  }

  async listComments(taskId: string, user: { sub: string; roles: string[] }) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, deletedAt: null },
      select: { id: true, projectId: true },
    });
    if (!task) throw new NotFoundException("Không tìm thấy công việc");
    await this.projectAccessService.assertProjectAccess(
      user,
      task.projectId,
      "view",
    );

    const comments = await this.prisma.comment.findMany({
      where: { taskId, deletedAt: null },
      include: this.commentInclude(),
      orderBy: { createdAt: "asc" },
    });
    return comments.map((comment) => this.serializeComment(comment));
  }

  async createComment(
    taskId: string,
    dto: CreateCommentDto,
    user: { sub: string; roles: string[] },
  ) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, deletedAt: null },
      select: { id: true, projectId: true },
    });
    if (!task) throw new NotFoundException("Không tìm thấy công việc");
    await this.projectAccessService.assertProjectAccess(
      user,
      task.projectId,
      "comment",
    );

    if (dto.parent_comment_id) {
      const parent = await this.prisma.comment.findFirst({
        where: { id: dto.parent_comment_id, taskId, deletedAt: null },
        select: { id: true },
      });
      if (!parent)
        throw new BadRequestException("parent_comment_id không hợp lệ");
    }

    const comment = await this.prisma.comment.create({
      data: {
        taskId,
        userId: user.sub,
        content: dto.content,
        parentCommentId: dto.parent_comment_id ?? null,
      },
      include: this.commentInclude(),
    });
    await this.notificationsService.notifyTaskParticipants(
      taskId,
      "comment_added",
      `Có bình luận mới trong công việc: ${dto.content.slice(0, 120)}`,
      user.sub,
    );
    return this.serializeComment(comment);
  }

  async updateComment(
    commentId: string,
    dto: UpdateCommentDto,
    user: { sub: string; roles: string[] },
  ) {
    const comment = await this.prisma.comment.findFirst({
      where: { id: commentId, deletedAt: null },
      select: { id: true, userId: true, task: { select: { projectId: true } } },
    });
    if (!comment) throw new NotFoundException("Không tìm thấy bình luận");
    await this.projectAccessService.assertProjectAccess(
      user,
      comment.task.projectId,
      "comment",
    );
    if (comment.userId !== user.sub && !user.roles.includes("admin")) {
      throw new ForbiddenException("Bạn không có quyền sửa bình luận này.");
    }

    const updated = await this.prisma.comment.update({
      where: { id: commentId },
      data: { content: dto.content },
      include: this.commentInclude(),
    });
    return this.serializeComment(updated);
  }

  async deleteComment(
    commentId: string,
    user: { sub: string; roles: string[] },
  ) {
    const comment = await this.prisma.comment.findFirst({
      where: { id: commentId, deletedAt: null },
      select: { id: true, userId: true, task: { select: { projectId: true } } },
    });
    if (!comment) throw new NotFoundException("Không tìm thấy bình luận");
    await this.projectAccessService.assertProjectAccess(
      user,
      comment.task.projectId,
      "comment",
    );
    if (comment.userId !== user.sub && !user.roles.includes("admin")) {
      throw new ForbiddenException("Bạn không có quyền xóa bình luận này.");
    }
    await this.prisma.comment.update({
      where: { id: commentId },
      data: { deletedAt: new Date() },
    });
    return { id: commentId };
  }

  private async targetProjectId(target: {
    projectId?: string;
    taskId?: string;
    commentId?: string;
  }) {
    if (target.projectId) {
      const project = await this.prisma.project.findFirst({
        where: { id: target.projectId, deletedAt: null },
        select: { id: true },
      });
      if (!project) throw new NotFoundException("Không tìm thấy dự án");
      return project.id;
    }

    if (target.taskId) {
      const task = await this.prisma.task.findFirst({
        where: { id: target.taskId, deletedAt: null },
        select: { projectId: true },
      });
      if (!task) throw new NotFoundException("Không tìm thấy công việc");
      return task.projectId;
    }

    const comment = await this.prisma.comment.findFirst({
      where: { id: target.commentId, deletedAt: null },
      select: { task: { select: { projectId: true } } },
    });
    if (!comment) throw new NotFoundException("Không tìm thấy bình luận");
    return comment.task.projectId;
  }

  async upload(
    file: Express.Multer.File | undefined,
    target: { projectId?: string; taskId?: string; commentId?: string },
    user: { sub: string; roles: string[] },
  ) {
    if (!file) throw new BadRequestException("Tệp tải lên là bắt buộc");
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException("Kích thước tệp tối đa là 10 MB");
    }
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException("Loại tệp không được hỗ trợ");
    }

    const projectId = await this.targetProjectId(target);
    await this.projectAccessService.assertProjectAccess(
      user,
      projectId,
      "upload",
    );

    const root = this.uploadRoot();
    const storedName = `${randomUUID()}${this.extension(file.originalname)}`;
    const storedPath = join(root, storedName);
    const sourcePath = resolve(file.path);
    if (sourcePath !== storedPath) {
      const data = await import("node:fs/promises");
      await data.rename(sourcePath, storedPath);
    }

    const attachment = await this.prisma.attachment.create({
      data: {
        projectId: target.projectId ?? projectId,
        taskId: target.taskId ?? null,
        commentId: target.commentId ?? null,
        userId: user.sub,
        fileName: basename(file.originalname),
        filePath: storedName,
        fileSize: BigInt(file.size),
        mimeType: file.mimetype,
      },
      select: {
        id: true,
        fileName: true,
        fileSize: true,
        mimeType: true,
        createdAt: true,
      },
    });
    return {
      id: attachment.id,
      file_name: attachment.fileName,
      file_size: Number(attachment.fileSize),
      mime_type: attachment.mimeType,
      created_at: attachment.createdAt,
    };
  }

  private extension(fileName: string) {
    const extension = fileName.slice(fileName.lastIndexOf("."));
    return /^[.][a-z0-9]{1,10}$/i.test(extension)
      ? extension.toLowerCase()
      : "";
  }

  async download(attachmentId: string, user: { sub: string; roles: string[] }) {
    const attachment = await this.prisma.attachment.findFirst({
      where: { id: attachmentId, deletedAt: null },
      select: {
        id: true,
        fileName: true,
        filePath: true,
        mimeType: true,
        projectId: true,
        taskId: true,
        commentId: true,
      },
    });
    if (!attachment) throw new NotFoundException("Không tìm thấy tệp");
    const projectId = await this.targetProjectId({
      projectId: attachment.projectId ?? undefined,
      taskId: attachment.taskId ?? undefined,
      commentId: attachment.commentId ?? undefined,
    });
    await this.projectAccessService.assertProjectAccess(
      user,
      projectId,
      "view",
    );

    const root = this.uploadRoot();
    const path = resolve(root, basename(attachment.filePath));
    if (!path.startsWith(`${root}${sep}`) || !existsSync(path)) {
      throw new NotFoundException("Không tìm thấy tệp lưu trữ");
    }
    return {
      stream: createReadStream(path),
      fileName: attachment.fileName,
      mimeType: attachment.mimeType ?? "application/octet-stream",
    };
  }
}
