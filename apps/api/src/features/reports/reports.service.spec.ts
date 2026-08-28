import { ReportsService } from "./reports.service";

describe("ReportsService", () => {
  it("aggregates dashboard totals and scoped task metrics", async () => {
    const prisma = {
      project: {
        count: jest.fn().mockResolvedValue(2),
        groupBy: jest
          .fn()
          .mockResolvedValue([{ status: "in_progress", _count: { _all: 2 } }]),
      },
      task: {
        count: jest
          .fn()
          .mockResolvedValueOnce(4)
          .mockResolvedValueOnce(1)
          .mockResolvedValueOnce(2)
          .mockResolvedValueOnce(1),
        groupBy: jest.fn().mockResolvedValue([
          { status: "todo", _count: { _all: 1 } },
          { status: "in_progress", _count: { _all: 2 } },
          { status: "review", _count: { _all: 1 } },
        ]),
        aggregate: jest.fn().mockResolvedValue({
          _sum: { estimatedHours: 10, actualHours: 6 },
          _avg: { progressPercent: 50 },
        }),
      },
    };
    const access = { assertProjectAccess: jest.fn() };
    const service = new ReportsService(prisma as never, access as never);

    const result = await service.getDashboard(
      {},
      { sub: "user", roles: ["member"] },
    );

    expect(result.projects.total).toBe(2);
    expect(result.tasks.total).toBe(4);
    expect(result.tasks.backlog).toBe(3);
    expect(result.tasks.overdue).toBe(1);
    expect(result.tasks.assigned_to_me).toBe(2);
    expect(result.hours).toEqual({ estimated: 10, actual: 6 });
  });
});
