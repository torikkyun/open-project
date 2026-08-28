import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DependencyType } from "@/generated/prisma/enums";
import { PrismaService } from "@/infra/db";
import { CreateTaskDependencyDto } from "./dto/create-task-dependency.dto";

@Injectable()
export class TaskDependenciesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(taskId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, deletedAt: null },
      select: { id: true },
    });

    if (!task) {
      throw new NotFoundException("Không tìm thấy công việc");
    }

    const [predecessors, successors] = await Promise.all([
      this.prisma.taskDependency.findMany({
        where: {
          successorTaskId: taskId,
          deletedAt: null,
          predecessorTask: { deletedAt: null },
        },
        select: {
          id: true,
          dependencyType: true,
          lagDays: true,
          predecessorTask: { select: { id: true, title: true } },
        },
      }),
      this.prisma.taskDependency.findMany({
        where: {
          predecessorTaskId: taskId,
          deletedAt: null,
          successorTask: { deletedAt: null },
        },
        select: {
          id: true,
          dependencyType: true,
          lagDays: true,
          successorTask: { select: { id: true, title: true } },
        },
      }),
    ]);

    return {
      predecessors: predecessors.map((dependency) => ({
        id: dependency.id,
        task: dependency.predecessorTask,
        dependency_type: dependency.dependencyType,
        lag_days: dependency.lagDays,
      })),
      successors: successors.map((dependency) => ({
        id: dependency.id,
        task: dependency.successorTask,
        dependency_type: dependency.dependencyType,
        lag_days: dependency.lagDays,
      })),
    };
  }

  async create(
    taskId: string,
    createTaskDependencyDto: CreateTaskDependencyDto,
  ) {
    const successorTask = await this.prisma.task.findFirst({
      where: { id: taskId, deletedAt: null },
      select: { id: true, projectId: true },
    });

    if (!successorTask) {
      throw new NotFoundException("Không tìm thấy công việc");
    }

    const predecessorTask = await this.prisma.task.findFirst({
      where: {
        id: createTaskDependencyDto.predecessor_task_id,
        projectId: successorTask.projectId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!predecessorTask) {
      throw new NotFoundException("Không tìm thấy công việc tiền nhiệm");
    }

    if (predecessorTask.id === successorTask.id) {
      throw new BadRequestException("Công việc không thể phụ thuộc chính nó");
    }

    const pendingTaskIds = [successorTask.id];
    const visitedTaskIds = new Set<string>();

    while (pendingTaskIds.length) {
      const currentTaskId = pendingTaskIds.shift()!;

      if (currentTaskId === predecessorTask.id) {
        throw new BadRequestException("Phát hiện phụ thuộc vòng");
      }

      if (visitedTaskIds.has(currentTaskId)) {
        continue;
      }

      visitedTaskIds.add(currentTaskId);

      const dependencies = await this.prisma.taskDependency.findMany({
        where: {
          predecessorTaskId: currentTaskId,
          deletedAt: null,
          successorTask: { deletedAt: null },
        },
        select: { successorTaskId: true },
      });

      for (const dependency of dependencies) {
        pendingTaskIds.push(dependency.successorTaskId);
      }
    }

    const dependency = await this.prisma.taskDependency.create({
      data: {
        predecessorTaskId: predecessorTask.id,
        successorTaskId: successorTask.id,
        dependencyType:
          createTaskDependencyDto.dependency_type ?? DependencyType.FS,
        lagDays: createTaskDependencyDto.lag_days ?? 0,
      },
      select: {
        id: true,
        predecessorTaskId: true,
        successorTaskId: true,
        dependencyType: true,
        lagDays: true,
      },
    });

    return {
      id: dependency.id,
      predecessor_task_id: dependency.predecessorTaskId,
      successor_task_id: dependency.successorTaskId,
      dependency_type: dependency.dependencyType,
      lag_days: dependency.lagDays,
    };
  }

  async remove(taskId: string, dependencyId: string) {
    const dependency = await this.prisma.taskDependency.findFirst({
      where: {
        id: dependencyId,
        successorTaskId: taskId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!dependency) {
      throw new NotFoundException("Không tìm thấy phụ thuộc công việc");
    }

    await this.prisma.taskDependency.updateMany({
      where: { id: dependency.id, deletedAt: null },
      data: { deletedAt: new Date() },
    });

    return { id: dependency.id };
  }
}
