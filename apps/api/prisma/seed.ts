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

const adminAccount = {
  name: process.env["ADMIN_NAME"] ?? "System Administrator",
  email: process.env["ADMIN_EMAIL"] ?? "admin@gmail.com",
  password: process.env["ADMIN_PASSWORD"] ?? "thisisapassword123",
  department: "Hành chính",
};

async function seedDevelopment() {
  const adminPasswordHash = await hashPassword(adminAccount.password);

  await prisma.$transaction(async (tx) => {
    for (const name of departments) {
      const department = await tx.department.findFirst({ where: { name } });

      if (!department) {
        await tx.department.create({ data: { name } });
      }
    }

    const adminDepartment = await tx.department.findFirstOrThrow({
      where: { name: adminAccount.department },
    });

    await tx.user.upsert({
      where: { email: adminAccount.email },
      update: {
        name: adminAccount.name,
        passwordHash: adminPasswordHash,
        role: "admin",
        departmentId: adminDepartment.id,
        deletedAt: null,
      },
      create: {
        name: adminAccount.name,
        email: adminAccount.email,
        passwordHash: adminPasswordHash,
        role: "admin",
        departmentId: adminDepartment.id,
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
