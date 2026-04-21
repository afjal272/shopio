import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",

  migrations: {
    path: "prisma/migrations",

    // 🔥 ये missing था
    seed: "tsx prisma/seed.ts"
  },

  datasource: {
    url: process.env["DATABASE_URL"],
  },
});