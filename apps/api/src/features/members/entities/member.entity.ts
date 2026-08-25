import { Membership } from "@/generated/prisma/client";

export class MemberEntity implements Membership {
  id!: string;
  roleId!: string;
  userId!: string;

  createdAt!: Date;
  updatedAt!: Date;

  constructor(partial: Partial<MemberEntity>) {
    Object.assign(this, partial);
  }
}
