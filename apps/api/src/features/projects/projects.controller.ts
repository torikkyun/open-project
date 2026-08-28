import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Roles } from "@/common/decorators/roles.decorator";
import {
  AddProjectMemberDto,
  CreateProjectDto,
  ProjectQueryDto,
  UpdateProjectDto,
} from "./dto";
import { ProjectsService } from "./projects.service";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { JwtPayload } from "@/common/types/jwt-payload.type";

@ApiTags("Projects")
@Controller({ path: "projects", version: "1" })
@ApiBearerAuth()
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: "Lấy danh sách dự án" })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: ProjectQueryDto,
  ) {
    const result = await this.projectsService.findAll(query, user);
    return { data: result.data, meta: result.meta };
  }

  @Post()
  @Roles("admin", "project_manager")
  @ApiOperation({ summary: "Tạo dự án mới" })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() createProjectDto: CreateProjectDto,
  ) {
    return {
      data: await this.projectsService.create(createProjectDto, user.sub),
      message: "Tạo dự án thành công",
    };
  }

  /*
    TODO: thêm project guard kiểm tra xem user có quyền truy cập dự án cụ thể hay không
  */
  @Get(":id")
  @ApiOperation({ summary: "Lấy thông tin chi tiết dự án" })
  async findOne(
    @CurrentUser() user: JwtPayload,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return { data: await this.projectsService.findOne(id, user) };
  }

  @Put(":id")
  @Roles("admin", "project_manager")
  @ApiOperation({ summary: "Cập nhật thông tin dự án" })
  async update(
    @CurrentUser() user: JwtPayload,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return {
      data: await this.projectsService.update(id, updateProjectDto, user),
      message: "Cập nhật dự án thành công",
    };
  }

  @Delete(":id")
  @Roles("admin", "project_manager")
  @ApiOperation({ summary: "Xóa dự án" })
  async remove(
    @CurrentUser() user: JwtPayload,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    await this.projectsService.remove(id, user);
    return { message: "Xóa dự án thành công" };
  }

  @Post(":id/archive")
  @Roles("admin", "project_manager")
  @ApiOperation({ summary: "Lưu trữ dự án" })
  async archive(
    @CurrentUser() user: JwtPayload,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return {
      data: await this.projectsService.archive(id, user),
      message: "Lưu trữ dự án thành công",
    };
  }

  @Post(":id/members")
  @Roles("admin", "project_manager")
  @ApiOperation({ summary: "Thêm thành viên vào dự án" })
  async addMember(
    @CurrentUser() user: JwtPayload,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() addProjectMemberDto: AddProjectMemberDto,
  ) {
    return {
      data: await this.projectsService.addMember(id, addProjectMemberDto, user),
      message: "Thêm thành viên thành công",
    };
  }

  @Delete(":id/members/:user_id")
  @Roles("admin", "project_manager")
  @ApiOperation({ summary: "Xóa thành viên khỏi dự án" })
  async removeMember(
    @CurrentUser() user: JwtPayload,
    @Param("id", ParseUUIDPipe) id: string,
    @Param("user_id", ParseUUIDPipe) userId: string,
  ) {
    await this.projectsService.removeMember(id, userId, user);
    return { message: "Xóa thành viên thành công" };
  }
}
