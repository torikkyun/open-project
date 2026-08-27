import { Module } from "@nestjs/common";
import { DepartmentsController } from "./departments.controller";
import { DepartmentsService } from "./departments.service";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";

@Module({
  controllers: [UsersController, DepartmentsController],
  providers: [UsersService, DepartmentsService],
  exports: [UsersService, DepartmentsService],
})
export class UsersDepartmentsModule {}
