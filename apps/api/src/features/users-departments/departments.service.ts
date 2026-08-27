import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/infra/db";
import { getOffsetPagination } from "@/common/utils/pagination.util";
import { DepartmentQueryDto } from "./dto";

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
}
