import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // CLI (db push / migrate) uses the session-pooler direct connection.
    // The app runtime uses DATABASE_URL (transaction pooler) via @prisma/adapter-pg in config/db.js.
    url: env("DIRECT_URL"),
  },
});