import { IsNotEmpty, IsString } from "class-validator";

export class UpdateMemberRoleDto {
  @IsString({ message: "Role phải là chuỗi" })
  @IsNotEmpty({ message: "Role không được để trống" })
  role!: string;
}
