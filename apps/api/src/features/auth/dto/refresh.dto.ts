import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class RefreshDto {
  @IsNotEmpty({ message: "Refresh token không được để trống" })
  @IsString()
  @ApiProperty({ example: "refresh-token" })
  refresh_token!: string;
}
