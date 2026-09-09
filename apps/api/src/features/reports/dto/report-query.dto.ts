import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsDateString,
  IsEnum,
  IsIn,
  IsOptional,
  IsUUID,
} from "class-validator";
import { TaskStatus } from "@/generated/prisma/enums";

export class ReportQueryDto {
  @IsOptional()
  @IsIn(["all", "mine"])
  @ApiPropertyOptional({ enum: ["all", "mine"] })
  scope?: "all" | "mine";

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ description: "Giới hạn báo cáo trong một dự án" })
  project_id?: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ description: "Ngày bắt đầu lọc task" })
  date_from?: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ description: "Ngày kết thúc lọc task" })
  date_to?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  @ApiPropertyOptional({ enum: TaskStatus })
  status?: TaskStatus;
}
