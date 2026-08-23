import { IsString } from "class-validator";
import { envValidate } from "./env.validate";
import { registerAs } from "@nestjs/config";

class DatabaseEnvironmentVariables {
  @IsString()
  DATABASE_URL!: string;
}

export default registerAs("db", () => {
  envValidate(process.env, DatabaseEnvironmentVariables);

  return {
    databaseUrl: process.env.DATABASE_URL,
  };
});
