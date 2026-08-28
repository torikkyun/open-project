import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsUUID } from "class-validator";
import { DependencyType } from "@/generated/prisma/enums";

export class CreateTaskDependencyDto {
  @IsUUID()
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000" })
  predecessor_task_id!: string;

  @IsOptional()
  @IsEnum(DependencyType)
  @ApiPropertyOptional({ enum: DependencyType, example: DependencyType.FS })
  dependency_type?: DependencyType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @ApiPropertyOptional({ example: 0, default: 0 })
  lag_days?: number;
}
