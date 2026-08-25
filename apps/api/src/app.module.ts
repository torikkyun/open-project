import { Module } from "@nestjs/common";
import { PrismaModule } from "./infra/db";
import { HealthModule } from "./health";
import { ConfigModule } from "@nestjs/config";
import { configs } from "./configs";
import { AuthModule } from "./features/auth/auth.module";
import { APP_GUARD } from "@nestjs/core";
import { RolesGuard } from "./features/auth/guards/roles.guard";
import { JwtGuard } from "./features/auth/guards/jwt.guard";
import { UsersModule } from "./features/users/users.module";
import { MembersModule } from "./features/members/members.module";
import { InvitationsModule } from "./features/invitations/invitations.module";

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
    UsersModule,
    MembersModule,
    InvitationsModule,
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
