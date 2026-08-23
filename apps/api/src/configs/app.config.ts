import { registerAs } from "@nestjs/config";
import { IsEnum, IsNumber, Max, Min } from "class-validator";
import { envValidate } from "./env.validate";

enum Environment {
  Development = "development",
  Production = "production",
  Test = "test",
  Provision = "provision",
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV!: Environment;

  @IsNumber()
  @Min(0)
  @Max(65535)
  PORT!: number;
}

export default registerAs("app", () => {
  envValidate(process.env, EnvironmentVariables);

  return {
    nodeEnv: process.env.NODE_ENV,
    port: Number(process.env.PORT),
  };
});
