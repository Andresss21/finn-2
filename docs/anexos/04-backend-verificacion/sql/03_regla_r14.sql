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
