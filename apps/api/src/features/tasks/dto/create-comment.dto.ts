import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from "class-validator";

export class CreateCommentDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: "This task is ready for review." })
  content!: string;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  parent_comment_id?: string;

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  @ApiPropertyOptional({
    type: [String],
    example: ["550e8400-e29b-41d4-a716-446655440000"],
  })
  attachment_ids?: string[];
}
