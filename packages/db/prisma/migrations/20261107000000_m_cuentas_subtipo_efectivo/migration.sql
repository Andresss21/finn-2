-- finn:manual
-- Subtipo de la cuenta de efectivo (TA-494; CH-224, 03 §3.4; MIG-16). Expansión (ADR-10, 03 §11.4; DP-31):
-- la columna llega nula, las cuentas de efectivo existentes quedan en `corriente` y recién entonces se agregan
-- las dos CHECK, NOT VALID y validadas en esta misma migración (11.2). El código anterior no escribe la
-- columna; el nuevo crea las cuentas de efectivo con OP-01, que durante TA-494 completa `corriente` (CH-229).
-- El enum y la columna son de Prisma (schema.prisma), pero van aquí para que el relleno quede antes de las
-- CHECK en una sola migración (CH-224); C4 compara el resultado con schema.prisma.
-- [CH-23] El bloqueo y el relleno van en un mismo DO. Con `prisma migrate deploy` cada sentencia de afuera es
-- su propia transacción: las CHECK se agregan cuando los diferidos del relleno ya se verificaron. Sin cuentas
-- de efectivo (una base nueva) no se escribe nada: la revisión de la siembra queda como estaba (03 §9.1).
CREATE TYPE "finn"."subtipo_efectivo" AS ENUM ('corriente', 'ahorro', 'billetera');

ALTER TABLE "finn"."cuentas" ADD COLUMN "subtipo_efectivo" "finn"."subtipo_efectivo";

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM finn.cuentas WHERE tipo = 'efectivo') THEN
    PERFORM finn.tomar_bloqueo();

    UPDATE finn.cuentas
    SET subtipo_efectivo = 'corriente'
    WHERE tipo = 'efectivo' AND subtipo_efectivo IS NULL;
  END IF;
END $$;

ALTER TABLE finn.cuentas
  ADD CONSTRAINT ck_cuentas_subtipo_efectivo
    CHECK ((tipo = 'efectivo') = (subtipo_efectivo IS NOT NULL)) NOT VALID,
  ADD CONSTRAINT ck_cuentas_billetera
    CHECK (subtipo_efectivo IS DISTINCT FROM 'billetera' OR (institucion_id IS NULL AND ultimos4 IS NULL)) NOT VALID;

ALTER TABLE finn.cuentas VALIDATE CONSTRAINT ck_cuentas_subtipo_efectivo;

ALTER TABLE finn.cuentas VALIDATE CONSTRAINT ck_cuentas_billetera;
