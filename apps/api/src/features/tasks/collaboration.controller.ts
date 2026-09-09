import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import type { Response } from "express";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import type { JwtPayload } from "@/common/types/jwt-payload.type";
import { CreateCommentDto, UpdateCommentDto } from "./dto";
import { CollaborationService } from "./collaboration.service";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

const uploadDestination =
  process.env["UPLOAD_PATH"] ?? join(process.cwd(), "uploads");
mkdirSync(uploadDestination, { recursive: true });

@Controller({ path: "", version: "1" })
@ApiBearerAuth()
@ApiTags("Collaboration")
export class CollaborationController {
  constructor(private readonly collaborationService: CollaborationService) {}

  @Get("tasks/:task_id/comments")
  async listComments(
    @CurrentUser() user: JwtPayload,
    @Param("task_id", ParseUUIDPipe) taskId: string,
  ) {
    return { data: await this.collaborationService.listComments(taskId, user) };
  }

  @Post("tasks/:task_id/comments")
  async createComment(
    @CurrentUser() user: JwtPayload,
    @Param("task_id", ParseUUIDPipe) taskId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return {
      data: await this.collaborationService.createComment(taskId, dto, user),
      message: "Tạo bình luận thành công",
    };
  }

  @Patch("comments/:id")
  async updateComment(
    @CurrentUser() user: JwtPayload,
    @Param("id", ParseUUIDPipe) commentId: string,
    @Body() dto: UpdateCommentDto,
  ) {
    return {
      data: await this.collaborationService.updateComment(commentId, dto, user),
    };
  }

  @Delete("comments/:id")
  async deleteComment(
    @CurrentUser() user: JwtPayload,
    @Param("id", ParseUUIDPipe) commentId: string,
  ) {
    await this.collaborationService.deleteComment(commentId, user);
    return { message: "Xóa bình luận thành công" };
  }

  @Post("projects/:project_id/attachments")
  @UseInterceptors(CollaborationController.fileInterceptor())
  async uploadProjectAttachment(
    @CurrentUser() user: JwtPayload,
    @Param("project_id", ParseUUIDPipe) projectId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return {
      data: await this.collaborationService.upload(file, { projectId }, user),
      message: "Tải tệp lên thành công",
    };
  }

  @Post("tasks/:task_id/attachments")
  @UseInterceptors(CollaborationController.fileInterceptor())
  async uploadTaskAttachment(
    @CurrentUser() user: JwtPayload,
    @Param("task_id", ParseUUIDPipe) taskId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return {
      data: await this.collaborationService.upload(file, { taskId }, user),
      message: "Tải tệp lên thành công",
    };
  }

  @Get("tasks/:task_id/attachments")
  async listTaskAttachments(
    @CurrentUser() user: JwtPayload,
    @Param("task_id", ParseUUIDPipe) taskId: string,
  ) {
    return {
      data: await this.collaborationService.listTaskAttachments(taskId, user),
    };
  }

  @Post("comments/:comment_id/attachments")
  @UseInterceptors(CollaborationController.fileInterceptor())
  async uploadCommentAttachment(
    @CurrentUser() user: JwtPayload,
    @Param("comment_id", ParseUUIDPipe) commentId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return {
      data: await this.collaborationService.upload(file, { commentId }, user),
      message: "Tải tệp lên thành công",
    };
  }

  @Get("attachments/:id/download")
  async download(
    @CurrentUser() user: JwtPayload,
    @Param("id", ParseUUIDPipe) attachmentId: string,
    @Res() response: Response,
  ) {
    const file = await this.collaborationService.download(attachmentId, user);
    response.set({
      "Content-Type": file.mimeType,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(file.fileName)}"`,
    });
    file.stream.pipe(response);
  }

  private static fileInterceptor() {
    return FileInterceptor("file", {
      storage: diskStorage({
        destination: uploadDestination,
        filename: (_request, file, callback) => {
          callback(null, `${randomUUID()}.upload`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
    });
  }
}
