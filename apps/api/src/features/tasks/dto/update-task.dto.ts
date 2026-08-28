import { PartialType } from "@nestjs/swagger";
import { IsNumber, IsOptional, Min, Max } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { CreateTaskDto } from "./create-task.dto";

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @ApiPropertyOptional({ example: 3.0 })
  actual_hours?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  @ApiPropertyOptional({ example: 75, minimum: 0, maximum: 100 })
  progress_percent?: number;
}
