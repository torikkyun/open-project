import { Module } from "@nestjs/common";
import { PrismaModule } from "./infra/db";
import { HealthModule } from "./health";
import { ConfigModule } from "@nestjs/config";
import { configs } from "./configs";
import { AuthModule } from "./features/auth/auth.module";
import { APP_GUARD } from "@nestjs/core";
import { RolesGuard } from "./common/guards/roles.guard";
import { JwtGuard } from "./common/guards/jwt.guard";

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
