import { plainToInstance } from "class-transformer";
import { validateSync } from "class-validator";
import { ClassConstructor } from "class-transformer";

export function envValidate<T extends object>(
  config: Record<string, unknown>,
  environmentVariables: ClassConstructor<T>,
): T {
  const validatedConfig = plainToInstance(environmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
