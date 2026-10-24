// packages/db/prisma.config.ts — Prisma ORM 7 (03-base-de-datos.md, 10.2)
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: {
    // CLI (migrate, diff): pooler en modo sesión (5432) con el usuario finn_migraciones.
    url: env('DIRECT_URL'),
    // Solo en desarrollo local, para `migrate dev --create-only`.
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
  },
});
