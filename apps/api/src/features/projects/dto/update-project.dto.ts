import { ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { IsEnum, IsOptional } from "class-validator";
import { ProjectStatus } from "@/generated/prisma/enums";
import { CreateProjectDto } from "./create-project.dto";

export class UpdateProjectDto extends PartialType(CreateProjectDto) {
  @IsOptional()
  @IsEnum(ProjectStatus)
  @ApiPropertyOptional({
    enum: ProjectStatus,
    example: ProjectStatus.not_started,
  })
  status?: ProjectStatus;
}
