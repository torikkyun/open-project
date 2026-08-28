import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from "class-validator";
import { Type } from "class-transformer";
import { Priority } from "@/generated/prisma/enums";

export class CreateTaskDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: "Build landing page" })
  title!: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: "Task description", nullable: true })
  description?: string | null;

  @IsOptional()
  @IsEnum(Priority)
  @ApiPropertyOptional({
    enum: Priority,
    example: Priority.medium,
  })
  priority?: Priority;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @ApiPropertyOptional({ example: 5.5 })
  estimated_hours?: number;

  @IsDateString()
  @ApiProperty({ example: "2026-09-01" })
  start_date!: string;

  @IsDateString()
  @ApiProperty({ example: "2026-09-30" })
  end_date!: string;

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  @ApiPropertyOptional({
    type: [String],
    example: ["550e8400-e29b-41d4-a716-446655440000"],
  })
  assignee_ids?: string[];

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ example: "550e8400-e29b-41d4-a716-446655440000" })
  parent_task_id?: string;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ example: false, default: false })
  is_milestone?: boolean;

  @IsOptional()
  @IsObject()
  @ApiPropertyOptional({
    example: {
      field_id_1: "value",
      field_id_2: "value",
    },
  })
  custom_fields?: Record<string, string>;
}
