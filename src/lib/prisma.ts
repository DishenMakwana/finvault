import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getSchemaFromUrl(urlStr: string): string {
  try {
    const parsed = new URL(urlStr);
    return (
      parsed.searchParams.get("schema") || process.env.DB_SCHEMA || "public"
    );
  } catch {
    return process.env.DB_SCHEMA || "public";
  }
}

function createPrismaClient() {
  const connectionString =
    process.env.DATABASE_URL ||
    "postgresql://postgres:root1234@127.0.0.1:5432/postgres?schema=finvault";
  const schema = getSchemaFromUrl(connectionString);
  const adapter = new PrismaPg(
    {
      connectionString,
      max: 10,
      min: 2,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    },
    { schema }
  );

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
