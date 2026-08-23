import { parseArgs } from "node:util";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/prisma/client";

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
  ]);
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
