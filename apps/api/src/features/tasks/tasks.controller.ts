import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Roles } from "@/common/decorators/roles.decorator";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { JwtPayload } from "@/common/types/jwt-payload.type";
import { JwtGuard as JwtAuthGuard } from "../auth/guards/jwt.guard";
import {
  CreateTaskDto,
  CreateTaskDependencyDto,
  ApproveTaskReviewDto,
  QueryTaskDto,
  RejectTaskReviewDto,
  UpdateTaskDto,
  UpdateTaskStatusDto,
} from "./dto";

import { TasksService } from "./tasks.service";
import { TaskDependenciesService } from "./task-dependencies.service";

@ApiTags("Tasks")
@Controller({ path: "", version: "1" })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly taskDependenciesService: TaskDependenciesService,
  ) {}

  @Get("projects/:project_id/tasks")
  @ApiOperation({ summary: "Lấy danh sách công việc trong dự án" })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Param("project_id", ParseUUIDPipe) projectId: string,
    @Query() query: QueryTaskDto,
  ) {
    const result = await this.tasksService.findAll(projectId, query, user);
    return { data: result.data, meta: result.meta };
  }

  @Post("projects/:project_id/tasks")
  @Roles("admin", "project_manager", "member")
  @ApiOperation({ summary: "Tạo công việc mới trong dự án" })
  async create(
    @CurrentUser() user: JwtPayload,
    @Param("project_id", ParseUUIDPipe) projectId: string,
    @Body() createTaskDto: CreateTaskDto,
  ) {
    return {
      data: await this.tasksService.create(projectId, createTaskDto, user),
      message: "Tạo công việc thành công",
    };
  }

  @Get("tasks/:id")
  @ApiOperation({ summary: "Lấy thông tin chi tiết công việc" })
  async findOne(
    @CurrentUser() user: JwtPayload,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return { data: await this.tasksService.findOne(id, user) };
  }

  @Put("tasks/:id")
  @Roles("admin", "project_manager", "member")
  @ApiOperation({ summary: "Cập nhật thông tin công việc" })
  async update(
    @CurrentUser() user: JwtPayload,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return {
      data: await this.tasksService.update(id, updateTaskDto, user),
      message: "Cập nhật công việc thành công",
    };
  }

  @Patch("tasks/:id/status")
  @Roles("admin", "project_manager", "member")
  @ApiOperation({ summary: "Cập nhật trạng thái công việc" })
  async updateStatus(
    @CurrentUser() user: JwtPayload,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateTaskStatusDto: UpdateTaskStatusDto,
  ) {
    return {
      data: await this.tasksService.updateStatus(
        id,
        updateTaskStatusDto.status,
        user,
      ),
      message: "Cập nhật trạng thái công việc thành công",
    };
  }

  @Post("tasks/:id/review/approve")
  @Roles("admin", "project_manager")
  @ApiOperation({ summary: "Phê duyệt công việc đang ở trạng thái Review" })
  async approveReview(
    @CurrentUser() user: JwtPayload,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() reviewTaskDto: ApproveTaskReviewDto,
  ) {
    return {
      data: await this.tasksService.approveReview(
        id,
        reviewTaskDto.comment,
        user,
      ),
      message: "Phê duyệt công việc thành công",
    };
  }

  @Post("tasks/:id/review/reject")
  @Roles("admin", "project_manager")
  @ApiOperation({ summary: "Từ chối công việc, yêu cầu chỉnh sửa" })
  async rejectReview(
    @CurrentUser() user: JwtPayload,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() reviewTaskDto: RejectTaskReviewDto,
  ) {
    return {
      data: await this.tasksService.rejectReview(
        id,
        reviewTaskDto.comment,
        user,
      ),
      message: "Từ chối công việc thành công",
    };
  }

  @Delete("tasks/:id")
  @Roles("admin", "project_manager")
  @ApiOperation({ summary: "Xóa công việc" })
  async remove(
    @CurrentUser() user: JwtPayload,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    await this.tasksService.remove(id, user);
    return { message: "Xóa công việc thành công" };
  }

  @Get("tasks/:id/history")
  @ApiOperation({ summary: "Lấy lịch sử thay đổi công việc" })
  async getHistory(
    @CurrentUser() user: JwtPayload,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return { data: await this.tasksService.getHistory(id, user) };
  }

  @Get("tasks/:task_id/dependencies")
  @ApiOperation({ summary: "Lấy danh sách phụ thuộc của công việc" })
  async findDependencies(@Param("task_id", ParseUUIDPipe) taskId: string) {
    return { data: await this.taskDependenciesService.findAll(taskId) };
  }

  @Post("tasks/:task_id/dependencies")
  @Roles("admin", "project_manager")
  @ApiOperation({ summary: "Tạo phụ thuộc công việc" })
  async createDependency(
    @Param("task_id", ParseUUIDPipe) taskId: string,
    @Body() createTaskDependencyDto: CreateTaskDependencyDto,
  ) {
    return {
      data: await this.taskDependenciesService.create(
        taskId,
        createTaskDependencyDto,
      ),
      message: "Tạo phụ thuộc công việc thành công",
    };
  }

  @Delete("tasks/:task_id/dependencies/:dependency_id")
  @Roles("admin", "project_manager")
  @ApiOperation({ summary: "Xóa phụ thuộc công việc" })
  async removeDependency(
    @Param("task_id", ParseUUIDPipe) taskId: string,
    @Param("dependency_id", ParseUUIDPipe) dependencyId: string,
  ) {
    await this.taskDependenciesService.remove(taskId, dependencyId);
    return { message: "Xóa phụ thuộc công việc thành công" };
  }
}
