import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, Length } from "class-validator";
import { LoginDto } from "./login.dto";

export class RegisterDto extends LoginDto {
  @IsNotEmpty({ message: "Tên không được để trống" })
  @Length(2, 120, { message: "Tên phải từ 2 đến 120 ký tự" })
  @ApiProperty({ example: "Nguyen Van A" })
  name!: string;
}
