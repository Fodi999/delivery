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

// CRITICAL: Remove channel_binding for Vercel Edge/Serverless compatibility
// Neon pooler with channel_binding=require can cause connection issues
const connectionString = process.env.DATABASE_URL.replace(
  '&channel_binding=require',
  ''
);

console.log("🔌 Connection string configured (channel_binding removed for compatibility)");

// Serverless-safe pool: small max size, short timeouts so Vercel lambdas
// don't exhaust DB connections. The pool is cached in globalThis so it
// survives warm re-invocations in the same container.
if (!globalForPrisma.pool) {
  console.log("🔌 Creating PostgreSQL connection pool...");
  globalForPrisma.pool = new Pool({
    connectionString,
    max: 3,                        // ✅ Small pool for serverless
    idleTimeoutMillis: 10000,      // ✅ Release idle connections quickly
    connectionTimeoutMillis: 5000, // ✅ Fail fast if DB unreachable
    allowExitOnIdle: true,         // ✅ Don't block lambda shutdown
  });

  globalForPrisma.pool.on('error', (err) => {
    console.error('❌ Unexpected pool error:', err);
  });
}

const pool = globalForPrisma.pool;
const adapter = new PrismaPg(pool);

// Cache prisma client in globalThis for both dev and prod (warm containers)
if (!globalForPrisma.prisma) {
  console.log("🔌 Creating Prisma client...");
  globalForPrisma.prisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "production"
      ? ["error", "warn"]
      : ["error", "warn", "query"],
  });
}

export const prisma = globalForPrisma.prisma;
