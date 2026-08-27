import { IsString } from "class-validator";
import { envValidate } from "./env.validate";
import { registerAs } from "@nestjs/config";

class JwtEnvironmentVariables {
  @IsString()
  JWT_SECRET!: string;

  @IsString()
  JWT_EXPIRATION!: string;

  @IsString()
  JWT_REFRESH_EXPIRATION!: string;
}

export default registerAs("jwt", () => {
  envValidate(process.env, JwtEnvironmentVariables);

  return {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiration: process.env.JWT_EXPIRATION,
    jwtRefreshExpiration: process.env.JWT_REFRESH_EXPIRATION,
  };
});
