import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, Length } from "class-validator";

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Length(2, 120, { message: "Tên phải từ 2 đến 120 ký tự" })
  @ApiPropertyOptional({ example: "Nguyễn Văn B" })
  name?: string;
}
