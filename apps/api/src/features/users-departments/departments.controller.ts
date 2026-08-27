import { Controller, Get, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { DepartmentQueryDto } from "./dto";
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
}
