import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let prismaInstance: PrismaClient;

if (typeof window === "undefined") {
  // Suppress specific unwanted console logs (Prisma query logs and dev request logs)
  const originalWrite = process.stdout.write.bind(process.stdout);
  process.stdout.write = function (
    ...args: Parameters<typeof process.stdout.write>
  ): boolean {
    const chunk = args[0];
    const encoding = args[1];
    const callback = args[2];
    
    const str = typeof chunk === "string" ? chunk : chunk.toString();
    if (
      str.includes("prisma:query") ||
      str.includes("GET / ") ||
      str.includes("GET /sw.js ")
    ) {
      if (typeof encoding === "function") {
        (encoding as () => void)();
      } else if (typeof callback === "function") {
        (callback as (err?: Error | null) => void)(null);
      }
      return true;
    }

    return originalWrite(...args);
  } as typeof process.stdout.write;

  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  
  prismaInstance = globalForPrisma.prisma ?? new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prismaInstance;
  }
} else {
  prismaInstance = null as unknown as PrismaClient;
}

export const prisma = prismaInstance;
