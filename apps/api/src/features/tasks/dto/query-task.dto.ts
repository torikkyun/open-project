import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString, IsUUID } from "class-validator";
import { OffsetPaginationQueryDto } from "@/common/dto/offset-pagination-query.dto";
import { Priority, TaskStatus } from "@/generated/prisma/enums";

export class QueryTaskDto extends OffsetPaginationQueryDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: "Build landing page" })
  search?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  @ApiPropertyOptional({
    enum: TaskStatus,
    example: TaskStatus.todo,
  })
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(Priority)
  @ApiPropertyOptional({
    enum: Priority,
    example: Priority.medium,
  })
  priority?: Priority;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ example: "550e8400-e29b-41d4-a716-446655440000" })
  assignee_id?: string;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ example: "550e8400-e29b-41d4-a716-446655440000" })
  parent_task_id?: string;
}
