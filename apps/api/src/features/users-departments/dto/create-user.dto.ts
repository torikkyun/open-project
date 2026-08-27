import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from "class-validator";
import { UserRole } from "@/generated/prisma/enums";

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: "Nguyễn Văn A" })
  name!: string;

  @IsEmail()
  @ApiProperty({ example: "nguyenvana@gmail.com" })
  email!: string;

  @IsEnum(UserRole)
  @ApiProperty({ enum: UserRole, example: UserRole.member })
  role!: UserRole;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ example: "550e8400-e29b-41d4-a716-446655440000" })
  department_id?: string;
}
