import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export class CreateTemplateTaskDto {
  @IsNotEmpty()
  @IsString()
  title!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  start_offset_days?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  duration_days?: number;
}

export class CreateTemplateDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: "Website launch" })
  name!: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  description?: string;

  @IsOptional()
  @IsArray()
  @ApiPropertyOptional({ type: [CreateTemplateTaskDto] })
  tasks?: CreateTemplateTaskDto[];
}
