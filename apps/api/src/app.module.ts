import { Module } from "@nestjs/common";
import { PrismaModule } from "./infra/db";
import { HealthModule } from "./health";
import { ConfigModule } from "@nestjs/config";
import { configs } from "./configs";
import { AuthModule } from "./features/auth/auth.module";
import { ProjectsModule } from "./features/projects";
import { UsersDepartmentsModule } from "./features/users-departments/users-departments.module";
import { TasksModule } from "./features/tasks/tasks.module";
import { NotificationsModule } from "./features/notifications/notifications.module";
import { APP_GUARD } from "@nestjs/core";
import { RolesGuard } from "./features/auth/guards/roles.guard";
import { JwtGuard } from "./features/auth/guards/jwt.guard";
import { ReportsModule } from "./features/reports/reports.module";
import { TemplatesModule } from "./features/templates/templates.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [".env"],
      isGlobal: true,
      expandVariables: true,
      cache: true,
      load: configs,
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    ProjectsModule,
    UsersDepartmentsModule,
    TasksModule,
    NotificationsModule,
    ReportsModule,
    TemplatesModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
