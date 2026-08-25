import { parseArgs } from "node:util";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/prisma/client";
import { hashPassword } from "@/common/utils/hash.util";

const adapter = new PrismaPg({ connectionString: process.env["DATABASE_URL"] });
const prisma = new PrismaClient({ adapter });

const userRoles = [
  {
    name: "Admin",
    code: "admin",
    description: "Full access to the application",
  },
  {
    name: "Project Manager",
    code: "pm",
    description: "Manages projects and project members",
  },
  {
    name: "Member",
    code: "member",
    description: "Standard project member access",
  },
];

const invitationStatuses = [
  {
    name: "Pending",
    code: "pending",
    description: "Invitation has been sent and is awaiting a response",
  },
  {
    name: "Accepted",
    code: "accepted",
    description: "Invitation has been accepted",
  },
  {
    name: "Revoked",
    code: "revoked",
    description: "Invitation has been revoked",
  },
  {
    name: "Expired",
    code: "expired",
    description: "Invitation is no longer valid because it has expired",
  },
];

const projectStatuses = [
  {
    name: "Planned",
    code: "planned",
    description: "Project has been defined and is awaiting start",
  },
  {
    name: "Active",
    code: "active",
    description: "Project is currently in progress",
  },
  {
    name: "Completed",
    code: "completed",
    description: "Project has finished successfully",
  },
  {
    name: "Cancelled",
    code: "cancelled",
    description: "Project has been stopped before completion",
  },
];

const taskStatuses = [
  {
    name: "Backlog",
    code: "backlog",
    position: 0,
    description: "Task is awaiting prioritization",
  },
  {
    name: "To Do",
    code: "todo",
    position: 1,
    description: "Task is ready to start",
  },
  {
    name: "In Progress",
    code: "in_progress",
    position: 2,
    description: "Task is currently being worked on",
  },
  {
    name: "Done",
    code: "done",
    position: 3,
    description: "Task has been completed",
  },
];

const taskPriorities = [
  {
    name: "Low",
    code: "low",
    description: "Task has low urgency",
  },
  {
    name: "Medium",
    code: "medium",
    description: "Task has normal urgency",
  },
  {
    name: "High",
    code: "high",
    description: "Task has high urgency",
  },
  {
    name: "Critical",
    code: "critical",
    description: "Task requires immediate attention",
  },
];

const notificationTypes = [
  {
    name: "Task Assigned",
    code: "task_assigned",
    description: "User has been assigned to a task",
  },
  {
    name: "Task Updated",
    code: "task_updated",
    description: "A task assigned to the user has been updated",
  },
  {
    name: "Project Updated",
    code: "project_updated",
    description: "A project the user is involved in has been updated",
  },
  {
    name: "Invitation Reminder",
    code: "invitation_reminder",
    description: "Reminder for a pending invitation",
  },
];

const adminAccount = {
  name: "System Administrator",
  email: process.env["ADMIN_EMAIL"] ?? "admin@gmail.com",
  password: process.env["ADMIN_PASSWORD"] ?? "thisisapassword123",
  roleCode: "admin",
};

async function seedDevelopment() {
  await prisma.$transaction([
    ...userRoles.map((role) =>
      prisma.userRole.upsert({
        where: { code: role.code },
        update: role,
        create: role,
      }),
    ),
    ...invitationStatuses.map((status) =>
      prisma.invitationStatus.upsert({
        where: { code: status.code },
        update: status,
        create: status,
      }),
    ),
    ...projectStatuses.map((status) =>
      prisma.projectStatus.upsert({
        where: { code: status.code },
        update: status,
        create: status,
      }),
    ),
    ...taskStatuses.map((status) =>
      prisma.taskStatus.upsert({
        where: { code: status.code },
        update: status,
        create: status,
      }),
    ),
    ...taskPriorities.map((priority) =>
      prisma.taskPriority.upsert({
        where: { code: priority.code },
        update: priority,
        create: priority,
      }),
    ),
    ...notificationTypes.map((type) =>
      prisma.notificationType.upsert({
        where: { code: type.code },
        update: type,
        create: type,
      }),
    ),
  ]);

  const adminPasswordHash = await hashPassword(adminAccount.password);

  await prisma.$transaction(async (tx) => {
    const adminUser = await tx.user.upsert({
      where: { email: adminAccount.email },
      update: {
        name: adminAccount.name,
        passwordHash: adminPasswordHash,
        avatarUrl: `https://api.dicebear.com/10.x/initials/svg?seed=${encodeURIComponent(adminAccount.name)}`,
      },
      create: {
        name: adminAccount.name,
        email: adminAccount.email,
        passwordHash: adminPasswordHash,
        avatarUrl: `https://api.dicebear.com/10.x/initials/svg?seed=${encodeURIComponent(adminAccount.name)}`,
      },
    });

    await tx.membership.upsert({
      where: { userId: adminUser.id },
      update: { role: { connect: { code: adminAccount.roleCode } } },
      create: {
        user: { connect: { id: adminUser.id } },
        role: { connect: { code: adminAccount.roleCode } },
      },
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
