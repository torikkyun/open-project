import { User } from "@/generated/prisma/client";
import { Exclude } from "class-transformer";

export class UserEntity implements User {
  id!: string;
  name!: string;
  email!: string;
  avatarUrl!: string;

  @Exclude()
  passwordHash!: string;

  createdAt!: Date;
  updatedAt!: Date;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}
