import { ProjectAccessService } from "./project-access.service";

describe("ProjectAccessService", () => {
  let service: ProjectAccessService;

  beforeEach(() => {
    service = new ProjectAccessService({} as any);
  });

  it("allows admin to manage project regardless of membership", async () => {
    await expect(
      service.assertProjectAccess(
        {
          sub: "user-1",
          roles: ["admin"],
        } as any,
        "project-1",
        "manage",
      ),
    ).resolves.toBeUndefined();
  });

  it("denies guest when canView is false", async () => {
    const member = {
      projectId: "project-1",
      userId: "user-2",
      role: "guest",
      canView: false,
      canComment: false,
      canUpload: false,
    };

    service.getProjectMembership = jest.fn().mockResolvedValue(member);

    await expect(
      service.assertProjectAccess(
        { sub: "user-2", roles: ["guest"] } as any,
        "project-1",
        "view",
      ),
    ).rejects.toThrow("không có quyền");
  });

  it("allows assigned member to update task", async () => {
    service.getProjectMembership = jest.fn().mockResolvedValue({
      projectId: "project-1",
      userId: "user-3",
      role: "member",
      canView: true,
      canComment: true,
      canUpload: false,
    });

    service.canUpdateTask = jest.fn().mockResolvedValue(true);

    await expect(
      service.assertTaskAccess(
        { sub: "user-3", roles: ["member"] } as any,
        {
          id: "task-1",
          projectId: "project-1",
          assignees: [{ userId: "user-3" }],
        },
        "update",
      ),
    ).resolves.toBeUndefined();
  });
});
