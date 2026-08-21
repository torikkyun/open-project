import { parseArgs } from "node:util";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env["DATABASE_URL"] });
const prisma = new PrismaClient({ adapter });

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
      break;
    case "production":
      break;
    case "test":
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
