import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from "class-validator";
import { OffsetPaginationQueryDto } from "@/common/dto/offset-pagination-query.dto";
import { ProjectStatus } from "@/generated/prisma/enums";

export class ProjectQueryDto extends OffsetPaginationQueryDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: "Website redesign" })
  search?: string;

  @IsOptional()
  @IsEnum(ProjectStatus)
  @ApiPropertyOptional({
    enum: ProjectStatus,
    example: ProjectStatus.not_started,
  })
  status?: ProjectStatus;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ example: "550e8400-e29b-41d4-a716-446655440000" })
  manager_id?: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ example: "2026-09-01" })
  start_date_from?: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ example: "2026-09-30" })
  start_date_to?: string;
}
