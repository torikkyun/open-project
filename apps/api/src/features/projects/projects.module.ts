import { Module } from "@nestjs/common";
import { ProjectsController } from "./projects.controller";
import { ProjectsService } from "./projects.service";
import { ProjectAccessService } from "./project-access.service";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [NotificationsModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, ProjectAccessService],
  exports: [ProjectsService, ProjectAccessService],
})
export class ProjectsModule {}
