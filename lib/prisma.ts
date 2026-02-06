import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

// Validate DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is not defined!");
  throw new Error("DATABASE_URL environment variable is required");
}

// Create connection pool
if (!globalForPrisma.pool) {
  console.log("🔌 Creating PostgreSQL connection pool...");
  globalForPrisma.pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10, // Maximum pool size
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
  
  // Test connection
  globalForPrisma.pool.on('error', (err) => {
    console.error('❌ Unexpected pool error:', err);
  });
  
  globalForPrisma.pool.on('connect', () => {
    console.log('✅ PostgreSQL pool connected');
  });
}

const pool = globalForPrisma.pool;
const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "production" 
      ? ["error", "warn"] 
      : ["error", "warn", "query"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
