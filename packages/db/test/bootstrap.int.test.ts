// PRU-INT-ESQ-108 (corrección H-02, CH-53; 03 §8.2, §10.4.1, §13.5 B1): bootstrap.sql con un administrador no
// superusuario, con los atributos del `postgres` de Supabase. Los roles son del clúster y los del arnés ya existen,
// creados por el superusuario y sin ADMIN para nadie más: esta prueba necesita un contenedor propio.
import { describe, expect, it } from 'vitest';
import pg from 'pg';
import { fileURLToPath } from 'node:url';
import { pgMayor } from './ayudantes/base.ts';

const ADMIN = 'admin_como_supabase';
const BASE = 'base_como_supabase';
// Claves de prueba del contenedor efímero; no existen fuera de él
const CLAVE_SUPER = 'h02-super';
const clavesDe = (n: number): string[] => [
  ...['-v', `clave_migraciones=h02-migraciones-${String(n)}`],
  ...['-v', `clave_app=h02-app-${String(n)}`],
  ...['-v', `clave_respaldo=h02-respaldo-${String(n)}`],
];
const ARCHIVO = fileURLToPath(new URL('../../../tools/db/bootstrap.sql', import.meta.url));

describe('PRU-INT-ESQ', () => {
  it('PRU-INT-ESQ-108 [MIG-00] CH-53: bootstrap.sql corre con un administrador sin SUPERUSER, deja los atributos de 03 §8.2 y el dueño del esquema, no deja SET sobre finn_migraciones y se puede repetir', async () => {
    if (process.env['CI']) process.env['TESTCONTAINERS_RYUK_DISABLED'] ??= 'true';
    const { PostgreSqlContainer } = await import('@testcontainers/postgresql');
    const contenedor = await new PostgreSqlContainer(
      `public.ecr.aws/docker/library/postgres:${pgMayor()}`,
    )
      .withDatabase('postgres')
      .withUsername('postgres')
      .withPassword(CLAVE_SUPER)
      .withCopyFilesToContainer([{ source: ARCHIVO, target: '/finn/bootstrap.sql' }])
      .start();
    const psql = async (usuario: string, base: string, ...args: string[]) => {
      const r = await contenedor.exec(
        ['psql', '-U', usuario, '-d', base, '-X', '-q', '-At', '-v', 'ON_ERROR_STOP=1', ...args],
        { user: 'postgres' },
      );
      return { codigo: r.exitCode, salida: r.output.trim() };
    };
    const consulta = async (sql: string): Promise<string> => {
      const r = await psql(ADMIN, BASE, '-c', sql);
      expect(r.codigo, r.salida).toBe(0);
      return r.salida;
    };
    const conecta = async (rol: string, clave: string): Promise<boolean> => {
      const c = new pg.Client({
        host: contenedor.getHost(),
        port: contenedor.getPort(),
        database: BASE,
        user: rol,
        password: clave,
      });
      try {
        await c.connect();
        await c.end();
        return true;
      } catch {
        return false;
      }
    };
    const bootstrap = (n: number, ...extra: string[]) =>
      psql(ADMIN, BASE, ...clavesDe(n), ...extra, '-f', '/finn/bootstrap.sql');

    try {
      // Los atributos que `postgres` tiene en la imagen de Supabase (supabase/postgres:17.11.0.006)
      for (const sql of [
        `CREATE ROLE ${ADMIN} LOGIN NOSUPERUSER CREATEROLE CREATEDB REPLICATION BYPASSRLS`,
        `CREATE DATABASE ${BASE} OWNER ${ADMIN}`,
      ])
        expect((await psql('postgres', 'postgres', '-c', sql)).codigo).toBe(0);

      const primera = await bootstrap(1);
      expect(primera.codigo, primera.salida).toBe(0);

      const atributos = `SELECT string_agg(format('%s:%s%s%s%s%s', rolname, rolsuper::int, rolinherit::int,
        rolbypassrls::int, rolcreaterole::int, rolcreatedb::int), ' ' ORDER BY rolname) FROM pg_roles
        WHERE rolname LIKE 'finn\\_%'`;
      const esperados = 'finn_app:00100 finn_migraciones:00000 finn_respaldo:00100';
      expect(await consulta(atributos)).toBe(esperados);
      expect(
        await consulta(
          `SELECT rolname, rolconfig FROM pg_roles WHERE rolname IN ('finn_migraciones', 'finn_respaldo') ORDER BY 1`,
        ),
      ).toBe(
        'finn_migraciones|{search_path=finn}\nfinn_respaldo|{default_transaction_read_only=on}',
      );
      const esquema = `SELECT pg_get_userbyid(nspowner) || ' ' ||
        (SELECT count(*) FROM aclexplode(nspacl) WHERE grantee = 0) FROM pg_namespace WHERE nspname = 'finn'`;
      expect(await consulta(esquema)).toBe('finn_migraciones 0');
      expect(
        await consulta(`SELECT has_database_privilege('finn_migraciones', '${BASE}', 'CREATE')`),
      ).toBe('t');

      // Al terminar queda solo el ADMIN implícito: ni SET ni INHERIT, y el error original vuelve a darse fuera del script
      const membresia = `SELECT string_agg(format('%s:%s%s%s', pg_get_userbyid(roleid), admin_option::int,
        inherit_option::int, set_option::int), ' ' ORDER BY pg_get_userbyid(roleid)) FROM pg_auth_members
        WHERE member = '${ADMIN}'::regrole`;
      const soloAdmin = 'finn_app:100 finn_migraciones:100 finn_respaldo:100';
      expect(await consulta(membresia)).toBe(soloAdmin);
      const control = await psql(
        ADMIN,
        BASE,
        '-c',
        'CREATE SCHEMA c AUTHORIZATION finn_migraciones',
      );
      expect(control.codigo).not.toBe(0);
      expect(control.salida).toContain('must be able to SET ROLE "finn_migraciones"');

      // Repetir: rota las claves y deja lo mismo
      const segunda = await bootstrap(2);
      expect(segunda.codigo, segunda.salida).toBe(0);
      expect(await consulta(atributos)).toBe(esperados);
      expect(await consulta(esquema)).toBe('finn_migraciones 0');
      expect(await consulta(membresia)).toBe(soloAdmin);
      expect(await conecta('finn_app', 'h02-app-2')).toBe(true);
      expect(await conecta('finn_app', 'h02-app-1')).toBe(false);

      // Con -v solo_roles=1 (03 §12.2) no toca el esquema, y el superusuario sigue pudiendo ejecutarlo
      const sinEsquema = 'base_solo_roles';
      expect(
        (await psql('postgres', 'postgres', '-c', `CREATE DATABASE ${sinEsquema}`)).codigo,
      ).toBe(0);
      const soloRoles = await psql(
        'postgres',
        sinEsquema,
        ...clavesDe(2),
        ...['-v', 'solo_roles=1', '-f', '/finn/bootstrap.sql'],
      );
      expect(soloRoles.codigo, soloRoles.salida).toBe(0);
      const nada = await psql(
        'postgres',
        sinEsquema,
        '-c',
        `SELECT count(*) FROM pg_namespace WHERE nspname = 'finn'`,
      );
      expect(nada.salida).toBe('0');
      const superusuario = await psql(
        'postgres',
        sinEsquema,
        ...clavesDe(2),
        '-f',
        '/finn/bootstrap.sql',
      );
      expect(superusuario.codigo, superusuario.salida).toBe(0);
      expect((await psql('postgres', sinEsquema, '-c', esquema)).salida).toBe('finn_migraciones 0');
    } finally {
      await contenedor.stop();
    }
  }, 120_000);
});
