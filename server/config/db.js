import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const getDatabaseUrl = () => {
  let dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.warn("DATABASE_URL is not defined in environment variables");
    return "";
  }

  try {
    const parsed = new URL(dbUrl);
    // Supabase Supavisor session mode on port 5432 has a hard limit of 15 connections (EMAXCONNSESSION).
    // Port 6543 is Supabase's transaction pooler mode, designed for high-concurrency ORM/Node servers.
    if (parsed.hostname.includes("pooler.supabase.com") && parsed.port === "5432") {
      parsed.port = "6543";
      if (!parsed.searchParams.has("pgbouncer")) {
        parsed.searchParams.set("pgbouncer", "true");
      }
      dbUrl = parsed.toString();
    }
  } catch (err) {
    // If URL parsing fails, fallback to raw string
  }

  return dbUrl;
};

const prismaPool = new Pool({
  connectionString: getDatabaseUrl(),
  max: 15,                         // more headroom for health probes + crons + requests
  idleTimeoutMillis: 60000,        // keep warm connections longer (handshakes to Supabase are expensive)
  connectionTimeoutMillis: 20000,  // fail slower instead of killing the request mid-flight
  keepAlive: true,                 // TCP keepalive so dead connections are detected quickly
  keepAliveInitialDelayMillis: 10000,
});

prismaPool.on("error", (err) => {
  console.error("Unexpected error on idle pg client:", err.message || err);
});

const adapter = new PrismaPg(prismaPool);
const prisma = new PrismaClient({
  adapter,
  log: ["error", "warn"],
});

let isConnected = false;

const connectPrisma = async () => {
  try {
    if (!isConnected) {
      await prisma.$connect();
      isConnected = true;
      console.log("Prisma Client connected to database");
    }
    return prisma;
  } catch (err) {
    console.error("Failed to connect Prisma Client:", err.message || err);
    isConnected = false;
    throw err;
  }
};

const disconnectPrisma = async () => {
  try {
    if (isConnected) {
      await prisma.$disconnect();
      if (prismaPool) {
        await prismaPool.end();
      }
      isConnected = false;
      console.log("Prisma Client disconnected");
    }
  } catch (err) {
    console.error("Error disconnecting Prisma Client:", err.message || err);
  }
};

// Connect immediately on startup
connectPrisma().catch((err) => {
  console.error("Critical error initializing Prisma:", err.message || err);
  console.log("Server will start but database operations may fail until connection is established");
});

// Handle graceful shutdown
process.on("beforeExit", async () => {
  await disconnectPrisma();
});

process.on("SIGINT", async () => {
  await disconnectPrisma();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await disconnectPrisma();
  process.exit(0);
});

process.once("SIGUSR2", async () => {
  await disconnectPrisma();
  process.kill(process.pid, "SIGUSR2");
});

export { prisma, connectPrisma, disconnectPrisma };