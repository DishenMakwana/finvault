import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:root1234@127.0.0.1:5432/postgres?schema=finvault',
  },
  migrations: {
    path: 'prisma/migrations',
    seed: 'bun prisma/seeds/seed.ts',
  },
});
