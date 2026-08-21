import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(private readonly config: ConfigService) {
    const connectionString = config.get("DATABASE_URL");

    const adapter = new PrismaPg({
      connectionString,
    });

    super({
      adapter,
      log: ["error", "warn"],
    });
  }

  async onModuleInit() {
    try {
      this.logger.log("Connecting to database...");
      await this.$connect();
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
