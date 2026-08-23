import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name, { timestamp: true });

  constructor(private readonly config: ConfigService) {
    const nodeEnv = config.getOrThrow<string>("app.nodeEnv", { infer: true });
    const connectionString = config.getOrThrow<string>("db.databaseUrl", {
      infer: true,
    });

    const adapter = new PrismaPg({
      connectionString,
    });

    super({
      adapter,
      log: nodeEnv === "development" ? ["warn", "error"] : [],
    });
  }

  async onModuleInit() {
    try {
      this.logger.log("Connecting to database...");
      await this.$connect();
      await this.$executeRaw`SELECT 1`;
      this.logger.log("Successfully connected to database");
    } catch (error) {
      this.logger.error("Failed to connect to database", error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log("Disconnected from database");
  }
}
