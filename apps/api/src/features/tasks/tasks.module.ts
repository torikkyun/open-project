import { Module } from "@nestjs/common";
import { TasksController } from "./tasks.controller";
import { TaskDependenciesService } from "./task-dependencies.service";
import { TasksService } from "./tasks.service";
import { ProjectAccessService } from "../projects/project-access.service";
import { CollaborationController } from "./collaboration.controller";
import { CollaborationService } from "./collaboration.service";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [NotificationsModule],
  controllers: [TasksController, CollaborationController],
  providers: [
    TasksService,
    TaskDependenciesService,
    ProjectAccessService,
    CollaborationService,
  ],
  exports: [TasksService, ProjectAccessService],
})
export class TasksModule {}
