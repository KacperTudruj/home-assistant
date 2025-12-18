import { defineConfig } from "prisma/config";

export default defineConfig({
      // @ts-expect-error prisma 7 types are incomplete
  migrate: {
    datasourceUrl: process.env.DATABASE_URL,
  },
});
