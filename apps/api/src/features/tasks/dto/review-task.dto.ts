import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class ReviewTaskDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: "Looks good" })
  comment?: string;
}

export class ApproveTaskReviewDto extends ReviewTaskDto {}

export class RejectTaskReviewDto {
  @IsString()
  @ApiProperty({ example: "Please add test coverage" })
  comment!: string;
}
