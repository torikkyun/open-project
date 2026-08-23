import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, Length } from "class-validator";

export class LoginDto {
  @IsEmail({}, { message: "Email không hợp lệ" })
  @ApiProperty({ example: "nguyenvana@gmail.com" })
  email!: string;

  @IsNotEmpty({ message: "Mật khẩu không được để trống" })
  @Length(8, 32, { message: "Mật khẩu phải từ 8 đến 32 ký tự" })
  @ApiProperty({ example: "thisisapassword123" })
  password!: string;
}
