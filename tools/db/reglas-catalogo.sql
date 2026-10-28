-- tools/db/reglas-catalogo.sql
-- Reglas que el esquema debe cumplir siempre (11.6, 12). Cada consulta devuelve las
-- violaciones; la CI falla si alguna devuelve filas. No depende de la instantánea:
-- detecta también tablas nuevas a las que les falte algo.
-- Uso: psql "$URL" -X -A -t -q -v ON_ERROR_STOP=1 -f tools/db/reglas-catalogo.sql

WITH finn AS (SELECT oid FROM pg_namespace WHERE nspname = 'finn'),
tablas AS (
  SELECT t.oid, t.relname, coalesce(obj_description(t.oid, 'pg_class'), '') AS clase
  FROM pg_class t WHERE t.relnamespace = (SELECT oid FROM finn) AND t.relkind = 'r'
),
tiene AS (
  SELECT t.relname, array_agg(tg.tgname::text) AS triggers
  FROM tablas t LEFT JOIN pg_trigger tg ON tg.tgrelid = t.oid AND NOT tg.tgisinternal
  GROUP BY t.relname
),
violaciones AS (
  -- R1 RLS activado y no forzado en todas las tablas (8.1)
  SELECT 'R1 sin RLS: ' || relname AS v FROM pg_class
  WHERE relnamespace = (SELECT oid FROM finn) AND relkind = 'r' AND (NOT relrowsecurity OR relforcerowsecurity)
  UNION ALL
  -- R2 ninguna política (8.1)
  SELECT 'R2 política: ' || polname FROM pg_policy pol JOIN tablas t ON t.oid = pol.polrelid
  UNION ALL
  -- R3 toda tabla declara su clase (0.4), salvo la de Prisma
  SELECT 'R3 sin clase: ' || relname FROM tablas
  WHERE relname <> '_prisma_migrations' AND clase NOT IN ('finn:clase=M', 'finn:clase=H', 'finn:clase=I', 'finn:clase=T')
  UNION ALL
  -- R4 triggers de concurrencia por clase (5.5)
  SELECT 'R4 falta a_exigir_bloqueo: ' || t.relname FROM tablas t JOIN tiene x USING (relname)
  WHERE t.clase IN ('finn:clase=M', 'finn:clase=H') AND NOT 'a_exigir_bloqueo' = ANY (x.triggers)
  UNION ALL
  SELECT 'R4 falta trigger de revisión: ' || t.relname FROM tablas t JOIN tiene x USING (relname)
  WHERE t.clase = 'finn:clase=M'
    AND NOT (x.triggers @> ARRAY['b_avanzar_revision', 'c_estampar_revision', 'y_registrar_eliminacion'])
  UNION ALL
  SELECT 'R4 columna revision ausente: ' || t.relname FROM tablas t
  WHERE t.clase = 'finn:clase=M'
    AND NOT EXISTS (SELECT 1 FROM pg_attribute a WHERE a.attrelid = t.oid AND a.attname = 'revision' AND NOT a.attisdropped)
  UNION ALL
  SELECT 'R4 trigger de hechos en tabla [I] o [T]: ' || t.relname FROM tablas t JOIN tiene x USING (relname)
  WHERE t.clase IN ('finn:clase=I', 'finn:clase=T')
    AND x.triggers && ARRAY['a_exigir_bloqueo', 'b_avanzar_revision', 'c_estampar_revision', 'y_registrar_eliminacion']
  UNION ALL
  -- R5 tablas [I] protegidas (4.5.6)
  SELECT 'R5 falta e_solo_insercion: ' || t.relname FROM tablas t JOIN tiene x USING (relname)
  WHERE t.clase = 'finn:clase=I' AND NOT 'e_solo_insercion' = ANY (x.triggers)
  UNION ALL
  -- R6 todos los triggers habilitados
  SELECT 'R6 trigger deshabilitado: ' || tg.tgrelid::regclass || '.' || tg.tgname
  FROM pg_trigger tg JOIN tablas t ON t.oid = tg.tgrelid WHERE NOT tg.tgisinternal AND tg.tgenabled <> 'O'
  UNION ALL
  -- R7 ninguna clave foránea sale del esquema finn (ADR-22, 8.6)
  SELECT 'R7 FK fuera de finn: ' || c.conname FROM pg_constraint c
  WHERE c.connamespace = (SELECT oid FROM finn) AND c.contype = 'f'
    AND (SELECT relnamespace FROM pg_class WHERE oid = c.confrelid) <> (SELECT oid FROM finn)
  UNION ALL
  -- R8 ningún objeto de finn depende de un esquema de usuario distinto de finn (auth, extensions, public…)
  SELECT DISTINCT 'R8 dependencia externa: ' || pg_describe_object(d.classid, d.objid, d.objsubid)
                  || ' → ' || pg_describe_object(d.refclassid, d.refobjid, d.refobjsubid)
  FROM pg_depend d
  JOIN LATERAL (SELECT (pg_identify_object(d.classid, d.objid, 0)).schema AS esquema) o ON true
  JOIN LATERAL (SELECT (pg_identify_object(d.refclassid, d.refobjid, 0)).schema AS esquema) r ON true
  WHERE o.esquema = 'finn' AND r.esquema IS NOT NULL
    AND r.esquema NOT IN ('finn', 'pg_catalog', 'information_schema')
  UNION ALL
  -- R9 ningún cuerpo de función menciona esquemas de Supabase (plpgsql no registra dependencias)
  SELECT 'R9 función menciona un esquema externo: ' || p.proname FROM pg_proc p
  WHERE p.pronamespace = (SELECT oid FROM finn)
    AND p.prosrc ~* '\m(auth|storage|extensions|realtime|vault|public)\.'
  UNION ALL
  -- R10 funciones SECURITY DEFINER con search_path fijo (DB-11)
  SELECT 'R10 definer sin search_path: ' || p.proname FROM pg_proc p
  WHERE p.pronamespace = (SELECT oid FROM finn) AND p.prosecdef
    AND NOT coalesce(p.proconfig, '{}') @> ARRAY['search_path=finn, pg_catalog']
  UNION ALL
  -- R11 ningún privilegio para PUBLIC ni para los roles de Supabase (8.3)
  SELECT 'R11 privilegio a ' || CASE WHEN a.grantee = 0 THEN 'PUBLIC' ELSE a.grantee::regrole::text END || ' sobre ' || o.objeto
  FROM (
    SELECT c.relname AS objeto, c.relacl AS acl, c.relowner AS dueno FROM pg_class c
    WHERE c.relnamespace = (SELECT oid FROM finn) AND c.relkind IN ('r', 'S', 'v', 'm')
    UNION ALL
    SELECT p.proname, p.proacl, p.proowner FROM pg_proc p WHERE p.pronamespace = (SELECT oid FROM finn)
    UNION ALL
    SELECT 'esquema finn', nspacl, nspowner FROM pg_namespace WHERE nspname = 'finn'
  ) o
  CROSS JOIN LATERAL aclexplode(coalesce(o.acl, acldefault('r', o.dueno))) a
  WHERE a.grantee = 0
     OR a.grantee IN (SELECT oid FROM pg_roles WHERE rolname IN ('anon', 'authenticated', 'service_role'))
  UNION ALL
  -- R12 sin DEFAULT nextval() sobre secuencias no propias de la columna (lección de 11.3)
  SELECT 'R12 DEFAULT nextval de secuencia compartida: ' || ad.adrelid::regclass || '.' || a.attname
  FROM pg_attrdef ad JOIN pg_attribute a ON a.attrelid = ad.adrelid AND a.attnum = ad.adnum
  JOIN pg_class t ON t.oid = ad.adrelid
  WHERE t.relnamespace = (SELECT oid FROM finn)
    AND pg_get_expr(ad.adbin, ad.adrelid) LIKE 'nextval(%'
    AND pg_get_serial_sequence(ad.adrelid::regclass::text, a.attname) IS NULL
  UNION ALL
  -- R13 un solo dueño para todo el esquema
  SELECT 'R13 dueño distinto: ' || relname FROM pg_class
  WHERE relnamespace = (SELECT oid FROM finn) AND relowner <> (SELECT nspowner FROM pg_namespace WHERE nspname = 'finn')
  UNION ALL
  SELECT 'R13 dueño distinto: ' || proname FROM pg_proc
  WHERE pronamespace = (SELECT oid FROM finn) AND proowner <> (SELECT nspowner FROM pg_namespace WHERE nspname = 'finn')
)
SELECT v FROM violaciones ORDER BY v;

-- R14 (EN-2, 04 §10.2), portado de 04-backend-verificacion.zip: sql/03_regla_r14.sql (FX-6).
-- R14 (EN-2): finn.purgar_eliminaciones() existe con la forma aprobada. Devuelve una fila por cada violación.
WITH f AS (
  SELECT p.oid, p.prosecdef, p.proconfig, pg_get_userbyid(p.proowner) AS dueno,
         pg_get_function_identity_arguments(p.oid) AS args, p.proacl
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'finn' AND p.proname = 'purgar_eliminaciones'
)
SELECT 'R14' AS regla, 'falta finn.purgar_eliminaciones()' AS detalle WHERE NOT EXISTS (SELECT 1 FROM f)
UNION ALL SELECT 'R14', 'debe ser sin parámetros (plazo fijo)' FROM f WHERE args <> ''
UNION ALL SELECT 'R14', 'debe ser SECURITY DEFINER' FROM f WHERE NOT prosecdef
UNION ALL SELECT 'R14', 'search_path fijo finn, pg_catalog' FROM f WHERE NOT coalesce('search_path=finn, pg_catalog' = ANY (proconfig), false)
UNION ALL SELECT 'R14', 'dueño debe ser finn_migraciones' FROM f WHERE dueno <> 'finn_migraciones'
UNION ALL SELECT 'R14', 'EXECUTE de ' || coalesce(nullif(g.grantee_name, ''), 'PUBLIC') FROM f,
  LATERAL (SELECT CASE WHEN a.grantee = 0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END AS grantee_name
           FROM aclexplode(coalesce(f.proacl, acldefault('f', (SELECT proowner FROM pg_proc WHERE oid = f.oid)))) a
           WHERE a.privilege_type = 'EXECUTE') g
  WHERE g.grantee_name NOT IN ('finn_app', 'finn_migraciones');
