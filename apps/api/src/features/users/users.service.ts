import { Prisma } from "@/generated/prisma/client";
import { PrismaService } from "@/infra/db";
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { UserEntity } from "./entities/user.entity";
import { UpdateUserDto } from "./dto/update-user.dto";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException("Người dùng không tồn tại");
    }

    return new UserEntity(user);
  }

  async updateUser(id: string, dto: UpdateUserDto) {
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: dto,
      });

      return new UserEntity(user);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException("Email đã được sử dụng");
      }
    }
  }
}
