import { BadRequestException } from "@nestjs/common";
import { TaskStatus } from "@/generated/prisma/enums";
import { TasksService } from "./tasks.service";

function createService(prisma: Record<string, unknown>) {
  return new TasksService(
    prisma as never,
    { assertProjectAccess: jest.fn(), assertTaskAccess: jest.fn() } as never,
    { create: jest.fn(), notifyTaskParticipants: jest.fn() } as never,
  );
}

describe("TasksService business rules", () => {
  const taskId = "11111111-1111-4111-8111-111111111111";
  const projectId = "22222222-2222-4222-8222-222222222222";
  const user = {
    sub: "33333333-3333-4333-8333-333333333333",
    roles: ["member"],
  };

  it("rejects an update outside the project date range", async () => {
    const prisma = {
      project: {
        findFirst: jest.fn().mockResolvedValue({
          startDate: new Date("2026-08-01"),
          endDate: new Date("2026-08-31"),
        }),
      },
      task: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce({
            id: taskId,
            projectId,
            title: "Task",
            status: TaskStatus.todo,
            progressPercent: 0,
            estimatedHours: null,
            actualHours: null,
            startDate: new Date("2026-08-10"),
            endDate: new Date("2026-08-12"),
            parentTaskId: null,
            assignees: [],
          })
          .mockResolvedValueOnce({
            startDate: new Date("2026-08-01"),
            endDate: new Date("2026-08-31"),
          }),
      },
    };
    const service = createService(prisma);

    await expect(
      service.update(
        taskId,
        {
          start_date: "2026-07-31",
          end_date: "2026-08-12",
        },
        user,
      ),
    ).rejects.toThrow("task date phải nằm trong khoảng thời gian của dự án");
  });

  it("rejects a parent cycle through multiple hierarchy levels", async () => {
    const prisma = {
      project: {
        findFirst: jest.fn().mockResolvedValue({
          startDate: new Date("2026-08-01"),
          endDate: new Date("2026-08-31"),
        }),
      },
      task: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce({
            id: taskId,
            projectId,
            title: "Task",
            status: TaskStatus.todo,
            progressPercent: 0,
            estimatedHours: null,
            actualHours: null,
            startDate: new Date("2026-08-10"),
            endDate: new Date("2026-08-12"),
            parentTaskId: null,
            assignees: [],
          })
          .mockResolvedValueOnce({ id: "parent-1", parentTaskId: "parent-2" })
          .mockResolvedValueOnce({ id: "parent-2", parentTaskId: taskId }),
      },
    };
    const service = createService(prisma);

    await expect(
      service.update(taskId, { parent_task_id: "parent-1" }, user),
    ).rejects.toThrow("Không thể tạo vòng lặp trong phân cấp task");
  });

  it("requires review before a task can be completed", async () => {
    const prisma = {
      task: {
        findFirst: jest.fn().mockResolvedValue({
          id: taskId,
          projectId,
          status: TaskStatus.in_progress,
          assignees: [],
        }),
      },
    };
    const service = createService(prisma);

    await expect(
      service.updateStatus(taskId, TaskStatus.done, user),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect((prisma.task as { update?: jest.Mock }).update).toBeUndefined();
  });

  it("rejects actual hours above the estimate", async () => {
    const prisma = {
      project: {
        findFirst: jest.fn().mockResolvedValue({
          startDate: new Date("2026-08-01"),
          endDate: new Date("2026-08-31"),
        }),
      },
      task: {
        findFirst: jest.fn().mockResolvedValue({
          id: taskId,
          projectId,
          status: TaskStatus.todo,
          progressPercent: 0,
          estimatedHours: 3,
          actualHours: 1,
          startDate: new Date("2026-08-10"),
          endDate: new Date("2026-08-12"),
          parentTaskId: null,
          assignees: [],
        }),
      },
    };
    const service = createService(prisma);

    await expect(
      service.update(taskId, { actual_hours: 4 }, user),
    ).rejects.toThrow("actual_hours không được lớn hơn estimated_hours");
  });
});
