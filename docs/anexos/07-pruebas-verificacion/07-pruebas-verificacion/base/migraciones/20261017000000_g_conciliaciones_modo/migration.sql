-- CF-01 (prototipo equivalente a lo que generaría Prisma; la Fase 8 la regenera)
CREATE TYPE "finn"."modo_conciliacion" AS ENUM ('estado_cuenta', 'saldo');
ALTER TABLE "finn"."conciliaciones" ADD COLUMN "modo" "finn"."modo_conciliacion" NOT NULL DEFAULT 'estado_cuenta';
