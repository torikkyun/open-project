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
import { DepartmentQueryDto } from "./dto";
import { CreateDepartmentDto, UpdateDepartmentDto } from "./dto";
import { Roles } from "@/common/decorators/roles.decorator";
import { DepartmentsService } from "./departments.service";

@ApiTags("Departments")
@ApiBearerAuth()
@Controller({ path: "departments", version: "1" })
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get()
  @ApiOperation({ summary: "Lấy danh sách phòng ban" })
  async findAll(@Query() query: DepartmentQueryDto) {
    const result = await this.departmentsService.findAll(query);
    return { data: result.data, meta: result.meta };
  }

  @Post()
  @Roles("admin")
  async create(@Body() dto: CreateDepartmentDto) {
    return { data: await this.departmentsService.create(dto) };
  }

  @Put(":id")
  @Roles("admin")
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateDepartmentDto,
  ) {
    return { data: await this.departmentsService.update(id, dto) };
  }

  @Delete(":id")
  @Roles("admin")
  async remove(@Param("id", ParseUUIDPipe) id: string) {
    await this.departmentsService.remove(id);
    return { message: "Xóa phòng ban thành công" };
  }
}
