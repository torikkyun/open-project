import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import type { JwtPayload } from "@/common/types/jwt-payload.type";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.getOrThrow<string>("jwt.jwtSecret", {
        infer: true,
      }),
    });
  }

  validate(payload: JwtPayload) {
    if (payload.type !== "access") {
      throw new UnauthorizedException("Loại token không hợp lệ");
    }
    return payload;
  }
}
