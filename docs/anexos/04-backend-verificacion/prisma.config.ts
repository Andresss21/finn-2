import { defineConfig } from 'prisma/config';
export default defineConfig({ schema: 'prisma/schema.prisma', datasource: { url: 'postgresql://finn_app:a@127.0.0.1:5433/finn' } });
