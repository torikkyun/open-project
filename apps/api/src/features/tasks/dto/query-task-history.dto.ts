import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional } from "class-validator";
import { OffsetPaginationQueryDto } from "@/common/dto/offset-pagination-query.dto";

enum TaskHistoryType {
  status = "status",
  progress = "progress",
  assignee = "assignee",
}

export class QueryTaskHistoryDto extends OffsetPaginationQueryDto {
  @IsOptional()
  @IsEnum(TaskHistoryType)
  @ApiPropertyOptional({
    enum: TaskHistoryType,
    example: TaskHistoryType.status,
  })
  type?: TaskHistoryType;
}
