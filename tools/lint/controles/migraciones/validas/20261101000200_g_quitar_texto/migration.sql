-- finn:contraer el código ya no lee notas.texto desde el despliegue anterior
-- AlterTable
ALTER TABLE "finn"."notas" DROP COLUMN "texto";
