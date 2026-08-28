import { parseArgs } from "node:util";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/prisma/client";
import { hashPassword } from "@/common/utils/hash.util";

const adapter = new PrismaPg({ connectionString: process.env["DATABASE_URL"] });
const prisma = new PrismaClient({ adapter });

const departments = [
  "Hành chính",
  "Kỹ thuật",
  "Sản phẩm",
  "Thiết kế",
  "Tiếp thị",
  "Tài chính",
];

const userSeeds = [
  {
    name: "System Administrator",
    email: "admin@gmail.com",
    password: "thisisapassword123",
    role: "admin",
    department: "Hành chính",
  },
  {
    name: "Project Manager",
    email: "pm@gmail.com",
    password: "thisisapassword123",
    role: "project_manager",
    department: "Sản phẩm",
  },
  {
    name: "Engineering Member",
    email: "member@gmail.com",
    password: "thisisapassword123",
    role: "member",
    department: "Kỹ thuật",
  },
  {
    name: "Guest Viewer",
    email: "guest@gmail.com",
    password: "thisisapassword123",
    role: "guest",
    department: "Thiết kế",
  },
] as const;

async function seedDevelopment() {
  await prisma.$transaction(async (tx) => {
    for (const name of departments) {
      const department = await tx.department.findFirst({ where: { name } });

      if (!department) {
        await tx.department.create({ data: { name } });
      }
    }

    const departmentMap = new Map(
      (
        await tx.department.findMany({
          select: { id: true, name: true },
        })
      ).map((department) => [department.name, department.id]),
    );

    const createdUsers = [] as Array<{
      id: string;
      email: string;
      role: string;
    }>;

    for (const seed of userSeeds) {
      const departmentId = departmentMap.get(seed.department);

      if (!departmentId) {
        continue;
      }

      const user = await tx.user.upsert({
        where: { email: seed.email },
        update: {
          name: seed.name,
          passwordHash: await hashPassword(seed.password),
          role: seed.role,
          departmentId,
          deletedAt: null,
        },
        create: {
          name: seed.name,
          email: seed.email,
          passwordHash: await hashPassword(seed.password),
          role: seed.role,
          departmentId,
        },
      });

      createdUsers.push({ id: user.id, email: user.email, role: user.role });
    }

    const projectManager = createdUsers.find(
      (user) => user.email === "pm@gmail.com",
    );
    const member = createdUsers.find(
      (user) => user.email === "member@gmail.com",
    );
    const guest = createdUsers.find((user) => user.email === "guest@gmail.com");

    if (!projectManager || !member || !guest) {
      return;
    }

    const project = await tx.project.upsert({
      where: {
        id: "00000000-0000-0000-0000-000000000001",
      },
      update: {},
      create: {
        id: "00000000-0000-0000-0000-000000000001",
        name: "Website revamp",
        description: "MVP redesign project",
        startDate: new Date("2026-08-01"),
        endDate: new Date("2026-08-31"),
        createdById: projectManager.id,
        status: "in_progress",
      },
    });

    await tx.projectMember.upsert({
      where: {
        projectId_userId: {
          projectId: project.id,
          userId: projectManager.id,
        },
      },
      update: {
        role: "manager",
        canView: true,
        canComment: true,
        canUpload: true,
        deletedAt: null,
      },
      create: {
        projectId: project.id,
        userId: projectManager.id,
        role: "manager",
        canView: true,
        canComment: true,
        canUpload: true,
      },
    });

    await tx.projectMember.upsert({
      where: {
        projectId_userId: {
          projectId: project.id,
          userId: member.id,
        },
      },
      update: {
        role: "member",
        canView: true,
        canComment: true,
        canUpload: true,
        deletedAt: null,
      },
      create: {
        projectId: project.id,
        userId: member.id,
        role: "member",
        canView: true,
        canComment: true,
        canUpload: false,
      },
    });

    await tx.projectMember.upsert({
      where: {
        projectId_userId: {
          projectId: project.id,
          userId: guest.id,
        },
      },
      update: {
        role: "guest",
        canView: true,
        canComment: false,
        canUpload: false,
        deletedAt: null,
      },
      create: {
        projectId: project.id,
        userId: guest.id,
        role: "guest",
        canView: true,
        canComment: false,
        canUpload: false,
      },
    });

    const parentTask = await tx.task.upsert({
      where: { id: "00000000-0000-0000-0000-000000000010" },
      update: {},
      create: {
        id: "00000000-0000-0000-0000-000000000010",
        projectId: project.id,
        title: "Design sprint",
        description: "Sprint planning and implementation",
        status: "in_progress",
        progressPercent: 40,
        estimatedHours: 32,
        startDate: new Date("2026-08-05"),
        endDate: new Date("2026-08-12"),
      },
    });

    const childTask = await tx.task.upsert({
      where: { id: "00000000-0000-0000-0000-000000000011" },
      update: {},
      create: {
        id: "00000000-0000-0000-0000-000000000011",
        projectId: project.id,
        parentTaskId: parentTask.id,
        title: "Create UI kit",
        description: "Build reusable UI elements",
        status: "review",
        progressPercent: 100,
        estimatedHours: 16,
        startDate: new Date("2026-08-06"),
        endDate: new Date("2026-08-10"),
      },
    });

    await tx.taskDependency.upsert({
      where: {
        predecessorTaskId_successorTaskId: {
          predecessorTaskId: childTask.id,
          successorTaskId: parentTask.id,
        },
      },
      update: {},
      create: {
        predecessorTaskId: childTask.id,
        successorTaskId: parentTask.id,
        dependencyType: "FS",
        lagDays: 1,
      },
    });

    await tx.task.upsert({
      where: { id: "00000000-0000-0000-0000-000000000012" },
      update: {},
      create: {
        id: "00000000-0000-0000-0000-000000000012",
        projectId: project.id,
        title: "QA backlog item",
        description: "Overdue item for policy validation",
        status: "todo",
        progressPercent: 10,
        estimatedHours: 8,
        startDate: new Date("2026-07-01"),
        endDate: new Date("2026-07-15"),
      },
    });

    await tx.notification.createMany({
      data: [
        {
          userId: member.id,
          type: "task_review_requested",
          content: "Task UI kit requires review",
          isRead: false,
        },
        {
          userId: member.id,
          type: "task_overdue",
          content: "QA backlog item is overdue",
          isRead: false,
        },
      ],
    });
  });
}

async function main() {
  const {
    values: { environment },
  } = parseArgs({
    options: {
      environment: { type: "string" as const },
    },
  });

  switch (environment) {
    case "development":
      await seedDevelopment();
      break;
    case "staging":
      break;
    case "production":
      break;
    default:
      break;
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async () => {
    await prisma.$disconnect();
    process.exit(1);
  });
