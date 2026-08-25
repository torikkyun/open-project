import { IsNotEmpty, IsOptional, Length } from "class-validator";

export class AcceptInvitationDto {
  @IsOptional()
  @IsNotEmpty({ message: "Tên không được để trống" })
  @Length(2, 120, { message: "Tên phải từ 2 đến 120 ký tự" })
  name?: string;

  @IsOptional()
  @IsNotEmpty({ message: "Mật khẩu không được để trống" })
  @Length(8, 32, { message: "Mật khẩu phải từ 8 đến 32 ký tự" })
  password?: string;
}
