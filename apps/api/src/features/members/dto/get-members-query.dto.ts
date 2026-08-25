import { OffsetPaginationQueryDto } from "@/common/dto/offset-pagination-query.dto";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class GetMembersQueryDto extends OffsetPaginationQueryDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ required: false })
  search?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ required: false })
  role?: string;
}
