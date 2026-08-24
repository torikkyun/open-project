import { Module } from "@nestjs/common";
import { CookieService } from "./cookie.service";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { LocalStrategy } from "./strategies/local.strategy";
import { JwtStrategy } from "./strategies/jwt.strategy";

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const jwt = configService.getOrThrow<{
          jwtSecret: string;
          jwtCookieExpiration: string;
        }>("jwt", {
          infer: true,
        });
        return {
          secret: jwt.jwtSecret,
          signOptions: {
            expiresIn: jwt.jwtCookieExpiration,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, CookieService, LocalStrategy, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
