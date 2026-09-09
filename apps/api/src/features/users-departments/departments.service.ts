import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/infra/db";
import { getOffsetPagination } from "@/common/utils/pagination.util";
import {
  CreateDepartmentDto,
  DepartmentQueryDto,
  UpdateDepartmentDto,
} from "./dto";

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: DepartmentQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const { skip, take } = getOffsetPagination(page, limit);
    const where = { deletedAt: null };

    const [departments, total] = await Promise.all([
      this.prisma.department.findMany({
        where,
        skip,
        take,
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      this.prisma.department.count({ where }),
    ]);

    return {
      data: departments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async create(dto: CreateDepartmentDto) {
    return this.prisma.department.create({ data: { name: dto.name } });
  }

  async update(id: string, dto: UpdateDepartmentDto) {
    const department = await this.prisma.department.findFirst({
      where: { id, deletedAt: null },
    });
    if (!department) throw new NotFoundException("Không tìm thấy phòng ban");
    return this.prisma.department.update({
      where: { id },
      data: dto.name === undefined ? {} : { name: dto.name },
    });
  }

  async remove(id: string) {
    const department = await this.prisma.department.findFirst({
      where: { id, deletedAt: null },
    });
    if (!department) throw new NotFoundException("Không tìm thấy phòng ban");
    await this.prisma.department.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
