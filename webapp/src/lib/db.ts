import { PrismaClient } from "@/generated/classroom/client";
import { PrismaPg } from "@prisma/adapter-pg";
const globalDb = globalThis as unknown as { classroomDb?: PrismaClient };
export const db =
  globalDb.classroomDb ??
  new PrismaClient({
    adapter: new PrismaPg({
      connectionString: process.env.DATABASE_URL,
      max: Number(process.env.DB_POOL_LIMIT ?? 5),
    }),
  });
if (process.env.NODE_ENV !== "production") globalDb.classroomDb = db;
