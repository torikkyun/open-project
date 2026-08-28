import { BadRequestException } from "@nestjs/common";
import { TaskDependenciesService } from "./task-dependencies.service";

describe("TaskDependenciesService", () => {
  it("rejects a dependency that creates a cycle", async () => {
    const prisma = {
      task: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce({ id: "successor", projectId: "project" })
          .mockResolvedValueOnce({ id: "predecessor" }),
      },
      taskDependency: {
        findMany: jest
          .fn()
          .mockResolvedValueOnce([{ successorTaskId: "predecessor" }]),
      },
    };
    const service = new TaskDependenciesService(prisma as never);

    await expect(
      service.create("successor", { predecessor_task_id: "predecessor" }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.taskDependency.findMany).toHaveBeenCalled();
  });

  it("rejects a predecessor from another project", async () => {
    const prisma = {
      task: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce({ id: "successor", projectId: "project" })
          .mockResolvedValueOnce(null),
      },
    };
    const service = new TaskDependenciesService(prisma as never);

    await expect(
      service.create("successor", { predecessor_task_id: "other-task" }),
    ).rejects.toThrow("Không tìm thấy công việc tiền nhiệm");
  });
});
