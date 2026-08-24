import { IsString } from "class-validator";
import { envValidate } from "./env.validate";
import { registerAs } from "@nestjs/config";

class JwtEnvironmentVariables {
  @IsString()
  JWT_SECRET!: string;

  @IsString()
  JWT_COOKIE_EXPIRATION!: string;

  @IsString()
  JWT_COOKIE_REFRESH_EXPIRATION!: string;
}

export default registerAs("jwt", () => {
  envValidate(process.env, JwtEnvironmentVariables);

  return {
    jwtSecret: process.env.JWT_SECRET,
    jwtCookieExpiration: process.env.JWT_COOKIE_EXPIRATION,
    jwtCookieRefreshExpiration: process.env.JWT_COOKIE_REFRESH_EXPIRATION,
  };
});
