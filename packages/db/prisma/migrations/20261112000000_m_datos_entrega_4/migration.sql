-- finn:manual
-- Datos de la entrega 4 que Finn no guardaba (TA-599; CH-254, 03 §3.4, §3.9 y §3.19; MIG-17). Expansión (ADR-10,
-- 03 §11.4; DP-31): las tres columnas llegan nulas y no se rellenan, porque lo de antes no se reconstruye: las cuentas
-- y categorías ya archivadas quedan sin fecha («Archivada») y los movimientos anteriores, sin regla (no cuentan en
-- «Usada N veces»). No escribe datos, así que no toma el bloqueo. Las columnas, el índice y la FK son de Prisma
-- (schema.prisma), pero van aquí con las dos CHECK en una sola migración (DT-01); C4 compara el resultado con
-- schema.prisma. Una activa nunca tiene fecha de archivo: OP-05 y OP-10 la vuelven a nula al desarchivar.
ALTER TABLE "finn"."cuentas" ADD COLUMN "archivada_el" DATE;

ALTER TABLE "finn"."categorias" ADD COLUMN "archivada_el" DATE;

ALTER TABLE "finn"."movimientos" ADD COLUMN "regla_id" UUID;

CREATE INDEX "ix_movimientos_regla" ON "finn"."movimientos"("regla_id");

ALTER TABLE "finn"."movimientos" ADD CONSTRAINT "fk_movimientos_regla" FOREIGN KEY ("regla_id") REFERENCES "finn"."reglas_comercio"("id") ON DELETE SET NULL ON UPDATE RESTRICT;

ALTER TABLE finn.cuentas
  ADD CONSTRAINT ck_cuentas_archivada_el CHECK (archivada OR archivada_el IS NULL);

ALTER TABLE finn.categorias
  ADD CONSTRAINT ck_categorias_archivada_el CHECK (archivada OR archivada_el IS NULL);
