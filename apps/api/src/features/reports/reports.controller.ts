import { Controller, Get, Header, Query, Res } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Response } from "express";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { JwtPayload } from "@/common/types/jwt-payload.type";
import { ReportQueryDto } from "./dto";
import { ReportsService } from "./reports.service";

@ApiTags("Reports")
@ApiBearerAuth()
@Controller({ path: "reports", version: "1" })
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get("dashboard")
  @ApiOperation({ summary: "Lấy thống kê dashboard theo phạm vi quyền" })
  async dashboard(
    @CurrentUser() user: JwtPayload,
    @Query() query: ReportQueryDto,
  ) {
    return { data: await this.reportsService.getDashboard(query, user) };
  }

  @Get("tasks")
  @ApiOperation({ summary: "Lấy báo cáo công việc" })
  async tasks(@CurrentUser() user: JwtPayload, @Query() query: ReportQueryDto) {
    return { data: await this.reportsService.getTaskReport(query, user) };
  }

  @Get("tasks/export")
  @Header("Content-Type", "text/csv; charset=utf-8")
  @ApiOperation({ summary: "Xuất báo cáo công việc dạng CSV" })
  async exportTasks(
    @CurrentUser() user: JwtPayload,
    @Query() query: ReportQueryDto,
    @Res() response: Response,
  ) {
    const csv = await this.reportsService.exportTasks(query, user);
    response.setHeader(
      "Content-Disposition",
      'attachment; filename="task-report.csv"',
    );
    response.send(`\ufeff${csv}`);
  }
}
