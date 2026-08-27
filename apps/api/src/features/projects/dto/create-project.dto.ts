import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from "class-validator";

export class CreateProjectDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: "Website redesign" })
  name!: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: "Project description", nullable: true })
  description?: string | null;

  @IsDateString()
  @ApiProperty({ example: "2026-09-01" })
  start_date!: string;

  @IsDateString()
  @ApiProperty({ example: "2026-09-30" })
  end_date!: string;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ example: "550e8400-e29b-41d4-a716-446655440000" })
  template_id?: string;

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  @ApiPropertyOptional({
    type: [String],
    example: ["550e8400-e29b-41d4-a716-446655440000"],
  })
  member_ids?: string[];
}
