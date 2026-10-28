// packages/db/prisma.config.ts — Prisma ORM 7 (03-base-de-datos.md, 10.2)
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

const sombra = process.env['SHADOW_DATABASE_URL'];

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: {
    // CLI (migrate, diff): pooler en modo sesión (5432) con el usuario finn_migraciones.
    url: env('DIRECT_URL'),
    // Solo en desarrollo local, para `migrate dev --create-only`. Sin la variable no se declara
    // (exactOptionalPropertyTypes del tsconfig del repositorio; TA-051).
    ...(sombra === undefined ? {} : { shadowDatabaseUrl: sombra }),
  },
});
