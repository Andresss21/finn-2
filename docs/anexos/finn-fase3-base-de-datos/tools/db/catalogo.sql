-- tools/db/catalogo.sql
-- Instantánea normalizada de los objetos que Prisma no representa (11.6).
-- Salida: una línea por objeto, ordenada. Se compara con prisma/catalogo-esperado.txt.
-- Uso: psql "$URL" -X -A -t -q -f tools/db/catalogo.sql > catalogo-actual.txt

WITH finn AS (SELECT oid FROM pg_namespace WHERE nspname = 'finn'),
lineas AS (
  -- CHECK
  SELECT format('check|%s|%s|%s', c.conrelid::regclass, c.conname, pg_get_constraintdef(c.oid)) AS l
  FROM pg_constraint c WHERE c.connamespace = (SELECT oid FROM finn) AND c.contype = 'c'
  UNION ALL
  -- Índices de expresión o parciales (los que Prisma no representa)
  SELECT format('indice|%s', pg_get_indexdef(i.indexrelid))
  FROM pg_index i JOIN pg_class t ON t.oid = i.indrelid
  WHERE t.relnamespace = (SELECT oid FROM finn) AND (i.indexprs IS NOT NULL OR i.indpred IS NOT NULL)
  UNION ALL
  -- Triggers (incluidos los de restricción diferida) y su estado
  SELECT format('trigger|%s|%s|%s', tg.tgrelid::regclass, tg.tgenabled, pg_get_triggerdef(tg.oid))
  FROM pg_trigger tg JOIN pg_class t ON t.oid = tg.tgrelid
  WHERE t.relnamespace = (SELECT oid FROM finn) AND NOT tg.tgisinternal
  UNION ALL
  -- Funciones: firma, seguridad, configuración y huella del cuerpo
  SELECT format('funcion|%s(%s)|definer=%s|config=%s|cuerpo=%s',
                p.proname, pg_get_function_identity_arguments(p.oid), p.prosecdef,
                coalesce(array_to_string(p.proconfig, ','), ''), md5(p.prosrc))
  FROM pg_proc p WHERE p.pronamespace = (SELECT oid FROM finn)
  UNION ALL
  -- RLS y comentario de clase por tabla
  SELECT format('tabla|%s|rls=%s|force=%s|%s', t.relname, t.relrowsecurity, t.relforcerowsecurity,
                coalesce(obj_description(t.oid, 'pg_class'), ''))
  FROM pg_class t WHERE t.relnamespace = (SELECT oid FROM finn) AND t.relkind = 'r'
  UNION ALL
  -- Políticas (deben ser cero)
  SELECT format('politica|%s|%s', pol.polrelid::regclass, pol.polname)
  FROM pg_policy pol JOIN pg_class t ON t.oid = pol.polrelid WHERE t.relnamespace = (SELECT oid FROM finn)
  UNION ALL
  -- Secuencias
  SELECT format('secuencia|%s', s.relname)
  FROM pg_class s WHERE s.relnamespace = (SELECT oid FROM finn) AND s.relkind = 'S'
  UNION ALL
  -- Privilegios sobre tablas, secuencias, funciones y el esquema
  SELECT format('privilegio|%s|%s|%s', o.objeto, CASE WHEN a.grantee = 0 THEN 'PUBLIC' ELSE a.grantee::regrole::text END, a.privilege_type)
  FROM (
    SELECT c.relname AS objeto, c.relacl AS acl, c.relowner AS dueno FROM pg_class c
    WHERE c.relnamespace = (SELECT oid FROM finn) AND c.relkind IN ('r', 'S')
    UNION ALL
    SELECT p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')', p.proacl, p.proowner FROM pg_proc p
    WHERE p.pronamespace = (SELECT oid FROM finn)
    UNION ALL
    SELECT 'esquema finn', n.nspacl, n.nspowner FROM pg_namespace n WHERE n.nspname = 'finn'
  ) o
  CROSS JOIN LATERAL aclexplode(coalesce(o.acl, acldefault('r', o.dueno))) a
  WHERE a.grantee <> o.dueno
)
SELECT l FROM lineas ORDER BY l;
