import { parseExpiresIn } from "@/common/utils/parse-expires-in.util";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { CookieOptions } from "express";

@Injectable()
export class CookieService {
  private readonly isProduction: boolean;
  private readonly maxAgeAccessToken: number;
  private readonly maxAgeRefreshToken: number;

  constructor(private readonly config: ConfigService) {
    this.isProduction =
      this.config.getOrThrow<boolean>("app.nodeEnv", {
        infer: true,
      }) === "production";
    this.maxAgeAccessToken = parseExpiresIn(
      this.config.getOrThrow<string>("jwt.jwtCookieExpiration", {
        infer: true,
      }),
    );
    this.maxAgeRefreshToken = parseExpiresIn(
      this.config.getOrThrow<string>("jwt.jwtCookieRefreshExpiration", {
        infer: true,
      }),
    );
  }

  getAccessTokenOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: this.isProduction ? "strict" : "lax",
      maxAge: this.maxAgeAccessToken,
    };
  }

  getRefreshTokenOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: this.isProduction ? "strict" : "lax",
      path: "/auth/refresh",
      maxAge: this.maxAgeRefreshToken,
    };
  }

  getRefreshTokenMaxAge(): number {
    return this.maxAgeRefreshToken;
  }
}
