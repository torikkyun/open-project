import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString, IsUUID } from "class-validator";
import { UserRole } from "@/generated/prisma/enums";
import { OffsetPaginationQueryDto } from "@/common/dto/offset-pagination-query.dto";

export class UserQueryDto extends OffsetPaginationQueryDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: "Nguyễn" })
  search?: string;

  @IsOptional()
  @IsEnum(UserRole)
  @ApiPropertyOptional({ enum: UserRole, example: UserRole.member })
  role?: keyof typeof UserRole;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ example: "550e8400-e29b-41d4-a716-446655440000" })
  department_id?: string;
}
