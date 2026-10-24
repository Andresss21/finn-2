-- V7-14 parte 1: ¿puede un rol NO superusuario (como `postgres` en Supabase) revocar EXECUTE de las funciones de
-- bloqueo asesor de sesión de pg_catalog? Se emula con el rol sb_postgres (NOSUPERUSER, CREATEROLE, CREATEDB).
\set ON_ERROR_STOP 0
SELECT current_user, rolsuper FROM pg_roles WHERE rolname = current_user;
SELECT p.oid::regprocedure AS funcion, pg_get_userbyid(p.proowner) AS dueno, p.proacl AS acl
  FROM pg_proc p WHERE p.proname IN ('pg_advisory_lock','pg_advisory_lock_shared','pg_try_advisory_lock','pg_try_advisory_lock_shared') ORDER BY 1;
REVOKE EXECUTE ON FUNCTION pg_catalog.pg_advisory_lock(bigint) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION pg_catalog.pg_advisory_lock(bigint) FROM finn_app;
SELECT p.oid::regprocedure, p.proacl FROM pg_proc p WHERE p.oid = 'pg_catalog.pg_advisory_lock(bigint)'::regprocedure;
