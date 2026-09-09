import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/infra/db";
import { CreateTemplateDto, UpdateTemplateDto } from "./dto";

@Injectable()
export class TemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.template.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      include: {
        tasks: { where: { deletedAt: null }, orderBy: { createdAt: "asc" } },
      },
    });
  }

  async findOne(id: string) {
    const template = await this.prisma.template.findFirst({
      where: { id, deletedAt: null },
      include: {
        tasks: { where: { deletedAt: null }, orderBy: { createdAt: "asc" } },
      },
    });
    if (!template) throw new NotFoundException("Không tìm thấy template");
    return template;
  }

  async create(dto: CreateTemplateDto, createdById: string) {
    return this.prisma.template.create({
      data: {
        name: dto.name,
        description: dto.description,
        createdById,
        tasks: dto.tasks?.length
          ? {
              create: dto.tasks.map((task) => ({
                title: task.title,
                startOffsetDays: task.start_offset_days ?? 0,
                durationDays: task.duration_days ?? 1,
              })),
            }
          : undefined,
      },
      include: { tasks: true },
    });
  }

  async update(id: string, dto: UpdateTemplateDto) {
    await this.findOne(id);
    return this.prisma.$transaction(async (tx) => {
      if (dto.tasks) {
        await tx.templateTask.updateMany({
          where: { templateId: id, deletedAt: null },
          data: { deletedAt: new Date() },
        });
        await tx.templateTask.createMany({
          data: dto.tasks.map((task) => ({
            templateId: id,
            title: task.title,
            startOffsetDays: task.start_offset_days ?? 0,
            durationDays: task.duration_days ?? 1,
          })),
        });
      }
      return tx.template.update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.description !== undefined
            ? { description: dto.description }
            : {}),
        },
        include: { tasks: { where: { deletedAt: null } } },
      });
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.template.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
