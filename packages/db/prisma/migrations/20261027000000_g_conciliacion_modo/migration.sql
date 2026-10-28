-- CreateEnum
CREATE TYPE "finn"."modo_conciliacion" AS ENUM ('estado_cuenta', 'saldo');

-- AlterTable
ALTER TABLE "finn"."conciliaciones" ADD COLUMN     "modo" "finn"."modo_conciliacion" NOT NULL DEFAULT 'estado_cuenta';

