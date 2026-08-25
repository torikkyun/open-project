import { IsEmail, IsUUID } from "class-validator";

export class CreateInvitationDto {
  @IsEmail({}, { message: "Email không hợp lệ" })
  email!: string;

  @IsUUID("4", { message: "RoleId phải là UUID hợp lệ" })
  roleId!: string;
}
