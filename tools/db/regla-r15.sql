-- R15 (CT-02; 03 §11.6, 07 §4.4): el reloj de la base tiene una sola fuente. Corre dentro de C5 (tools/db/plantilla.ts).
-- 1) finn.ahora() y finn.instante() tienen exactamente el cuerpo de producción.
-- 2) Ninguna otra función de finn llama now(), clock_timestamp(), statement_timestamp(), transaction_timestamp() ni CURRENT_TIMESTAMP,
--    salvo finn.hoy() (aprobada en 03, DB-08) .
-- 3) [CH-24] Ningún DEFAULT de una columna de finn usa esas funciones: llega con g_instantes_ahora (TA-057).
-- 4) No existe finn.desfase() (solo la instala tools/pruebas/reloj-simulado.sql).
WITH f AS (SELECT p.proname, pg_get_function_identity_arguments(p.oid) a, p.prosrc FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'finn')
SELECT 'R15 cuerpo de ahora(): ' || btrim(prosrc) FROM f WHERE proname = 'ahora' AND btrim(prosrc) <> 'SELECT now()'
UNION ALL SELECT 'R15 cuerpo de instante(): ' || btrim(prosrc) FROM f WHERE proname = 'instante' AND btrim(prosrc) <> 'SELECT clock_timestamp()'
UNION ALL SELECT 'R15 falta ' || x FROM unnest(ARRAY['ahora','instante']) x WHERE NOT EXISTS (SELECT 1 FROM f WHERE proname = x)
UNION ALL SELECT 'R15 reloj directo en ' || proname || '(' || a || ')' FROM f
  WHERE proname NOT IN ('ahora','instante','hoy') AND prosrc ~* '\m(now|clock_timestamp|statement_timestamp|transaction_timestamp)\s*\(|current_timestamp'
UNION ALL SELECT 'R15 existe finn.desfase()' FROM f WHERE proname = 'desfase';
