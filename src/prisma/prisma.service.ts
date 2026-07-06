import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

function getDatabaseHost(databaseUrl: string | undefined): string | undefined {
  if (!databaseUrl) return undefined;

  try {
    return new URL(databaseUrl).host;
  } catch {
    return undefined;
  }
}

export function createPrismaConnectionError(error: unknown): Error {
  const errorCode =
    typeof error === "object" && error !== null && "errorCode" in error
      ? String(error.errorCode)
      : undefined;

  if (errorCode !== "P1000") {
    return error instanceof Error ? error : new Error(String(error));
  }

  const databaseHost = getDatabaseHost(process.env.DATABASE_URL);
  const hostMessage = databaseHost ? ` for ${databaseHost}` : "";

  return new Error(
    `Prisma could not authenticate with the configured Render PostgreSQL database${hostMessage}. ` +
      "Refresh the DATABASE_URL environment variable from Render's current Internal Database URL, " +
      "or rotate the database password and update the service environment variable before redeploying.",
  );
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    try {
      await this.$connect();
    } catch (error) {
      throw createPrismaConnectionError(error);
    }
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
