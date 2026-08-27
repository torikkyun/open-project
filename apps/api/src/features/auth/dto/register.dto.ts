import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";

export class CreateAuthDto {
  @IsNotEmpty({ message: "Tên không được để trống" })
  @IsString()
  @ApiProperty({ example: "Nguyễn Văn A" })
  name!: string;

  @IsEmail({}, { message: "Email không hợp lệ" })
  @ApiProperty({ example: "nguyenvana@gmail.com" })
  email!: string;

  @IsNotEmpty({ message: "Mật khẩu không được để trống" })
  @MinLength(8, { message: "Mật khẩu phải từ 8 ký tự trở lên" })
  @ApiProperty({ example: "thisisapassword123" })
  password!: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: "invite-token" })
  invite_token?: string;
}

export class RegisterDto extends CreateAuthDto {}
