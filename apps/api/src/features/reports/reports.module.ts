import { Module } from "@nestjs/common";
import { ReportsController } from "./reports.controller";
import { ReportsService } from "./reports.service";
import { ProjectAccessService } from "../projects/project-access.service";

@Module({
  controllers: [ReportsController],
  providers: [ReportsService, ProjectAccessService],
})
export class ReportsModule {}
