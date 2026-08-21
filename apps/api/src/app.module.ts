import { Module } from "@nestjs/common";
import { PrismaModule } from "./infra/db";
import { HealthModule } from "./health";

@Module({
  imports: [PrismaModule, HealthModule],
})
export class AppModule {}
