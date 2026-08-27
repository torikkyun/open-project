import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsEnum, IsOptional, IsUUID } from "class-validator";
import { ProjectRole } from "@/generated/prisma/enums";

export class AddProjectMemberDto {
  @IsUUID()
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000" })
  user_id!: string;

  @IsEnum(ProjectRole)
  @ApiProperty({ enum: ProjectRole, example: ProjectRole.member })
  role!: keyof typeof ProjectRole;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ example: true, default: true })
  can_view?: boolean = true;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ example: false, default: false })
  can_comment?: boolean = false;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ example: false, default: false })
  can_upload?: boolean = false;
}
