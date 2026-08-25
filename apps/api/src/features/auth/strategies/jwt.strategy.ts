import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import type { Request } from "express";
import type { JwtPayload } from "@/common/types/jwt-payload.type";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req.cookies.accessToken,
      ]),
      secretOrKey: configService.getOrThrow<string>("jwt.jwtSecret", {
        infer: true,
      }),
    });
  }

  validate(payload: JwtPayload) {
    return payload;
  }
}
