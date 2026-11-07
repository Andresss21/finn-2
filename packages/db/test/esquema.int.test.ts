// Esquema migrado en la plantilla (TA-051): privilegios de finn_app (V-12), purga de EN-2 (V-28) y siembra
// de 03 §9. Cada prueba tiene su base, clonada de finn_plantilla en el describe que la envuelve: ninguna
// depende de lo que otra escribió.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { describe, expect, it } from 'vitest';
import { c5 } from '../../../tools/db/plantilla.ts';
import { consultar, crearBasePrueba, type BasePrueba } from './ayudantes/base.ts';

/** Una conexión para `fn`, cerrada al terminar. */
async function con<T>(url: string, fn: (c: pg.Client) => Promise<T>): Promise<T> {
  const c = new pg.Client({ connectionString: url });
  await c.connect();
  try {
    return await fn(c);
  } finally {
    await c.end();
  }
}

/** El código SQLSTATE con que falla `sql`, o `ok`. */
async function codigo(c: pg.Client, sql: string): Promise<string> {
  try {
    await c.query(sql);
    return 'ok';
  } catch (e) {
    return (e as { code?: string }).code ?? String(e);
  }
}

/** Las filas de R14 de C5 (reglas-catalogo.sql completo, como lo corre la plantilla). */
const r14 = async (base: BasePrueba): Promise<string[]> =>
  (await c5(base.urlAdmin, consultar)).filter((l) => l.startsWith('R14'));

describe('PRU-SEG-ESQ', () => {
  const base = crearBasePrueba();
  it('PRU-SEG-ESQ-001 [V-12] finn_app no trunca, no deshabilita triggers ni ejecuta finn.operacion(); un rol sin BYPASSRLS ve 0 filas', async () => {
    await con(base.url, async (app) => {
      expect(await codigo(app, 'TRUNCATE finn.grupos')).toBe('42501');
      expect(await codigo(app, 'ALTER TABLE finn.grupos DISABLE TRIGGER a_exigir_bloqueo')).toBe(
        '42501',
      );
      expect(await codigo(app, 'SELECT finn.operacion()')).toBe('42501');
      // Solo puede fijar el parámetro
      expect(await codigo(app, "SELECT set_config('finn.operacion', 'OP-01', false)")).toBe('ok');
      // Un UPDATE sin bloqueo que no afecta filas también falla (trigger por sentencia)
      expect(await codigo(app, 'UPDATE finn.grupos SET orden = orden WHERE false')).toBe('FN001');
      const { rows } = await app.query<{ n: string }>('SELECT count(*) AS n FROM finn.grupos');
      expect(rows).toEqual([{ n: '1' }]);
    });
    // `authenticated` (roles-supabase.sql) no tiene BYPASSRLS: con SELECT prestado en una transacción que
    // se deshace, RLS sin políticas le muestra 0 filas
    await con(base.urlAdmin, async (admin) => {
      await admin.query('BEGIN');
      try {
        await admin.query('GRANT USAGE ON SCHEMA finn TO authenticated');
        await admin.query('GRANT SELECT ON finn.grupos TO authenticated');
        await admin.query('SET LOCAL ROLE authenticated');
        const { rows } = await admin.query<{ n: string; bypass: boolean }>(
          `SELECT count(*) AS n, (SELECT rolbypassrls FROM pg_roles WHERE rolname = current_user) AS bypass
           FROM finn.grupos`,
        );
        expect(rows).toEqual([{ n: '0', bypass: false }]);
      } finally {
        await admin.query('ROLLBACK');
      }
    });
  });
});

describe('PRU-INT-ESQ', () => {
  describe('purga', () => {
    const base = crearBasePrueba();
    it('PRU-INT-ESQ-012 [V-28, R14] purgar_eliminaciones borra solo lo de más de 30 días, fija máx + 1, devuelve 0 la segunda vez y nunca baja el valor', async () => {
      await con(base.urlAdmin, async (admin) => {
        // 04-backend-verificacion.zip, sql/04_prueba_purga.sql: 3 viejas (5, 9, 7) y 2 recientes (20, 21)
        await admin.query(`BEGIN; SELECT finn.tomar_bloqueo();
        DELETE FROM finn.eliminaciones;
        INSERT INTO finn.eliminaciones (tabla, fila_id, revision, eliminada_en) VALUES
          ('asignaciones', gen_random_uuid(), 5,  now() - interval '45 days'),
          ('asignaciones', gen_random_uuid(), 9,  now() - interval '31 days'),
          ('asignaciones', gen_random_uuid(), 7,  now() - interval '30 days 1 minute'),
          ('asignaciones', gen_random_uuid(), 20, now() - interval '29 days'),
          ('asignaciones', gen_random_uuid(), 21, now());
        UPDATE finn.revision SET revision_minima_incremental = 0 WHERE id = 1;
        COMMIT;`);
        const estado = async (): Promise<string> => {
          const { rows } = await admin.query<{ e: string }>(
            `SELECT coalesce(string_agg(revision::text, ',' ORDER BY revision), '') || ' / ' ||
                  (SELECT revision_minima_incremental FROM finn.revision) AS e FROM finn.eliminaciones`,
          );
          return rows[0]?.e ?? '';
        };
        await con(base.url, async (app) => {
          expect(await codigo(app, 'DELETE FROM finn.eliminaciones')).toBe('42501');
          expect(
            await codigo(app, 'UPDATE finn.revision SET revision_minima_incremental = 0'),
          ).toBe('42501');
          const purgar = async (): Promise<number> =>
            (await app.query<{ n: number }>('SELECT finn.purgar_eliminaciones() AS n')).rows[0]
              ?.n ?? -1;
          expect(await purgar()).toBe(3);
          expect(await estado()).toBe('20,21 / 10');
          expect(await purgar()).toBe(0);
          // Nunca baja: fijado en 50, purgar una revisión 3 lo deja en 50
          await admin.query(`UPDATE finn.revision SET revision_minima_incremental = 50;
          INSERT INTO finn.eliminaciones (tabla, fila_id, revision, eliminada_en)
          VALUES ('asignaciones', gen_random_uuid(), 3, now() - interval '40 days')`);
          expect(await purgar()).toBe(1);
          expect(await estado()).toBe('20,21 / 50');
        });
        // Un rol sin EXECUTE recibe 42501
        await admin.query('BEGIN');
        try {
          await admin.query('GRANT USAGE ON SCHEMA finn TO authenticated');
          await admin.query('SET LOCAL ROLE authenticated');
          expect(await codigo(admin, 'SELECT finn.purgar_eliminaciones()')).toBe('42501');
        } finally {
          await admin.query('ROLLBACK');
        }
        // R14 (C5): 0 filas; detecta EXECUTE a PUBLIC y SECURITY INVOKER
        expect(await r14(base)).toEqual([]);
        await admin.query('GRANT EXECUTE ON FUNCTION finn.purgar_eliminaciones() TO PUBLIC');
        expect(await r14(base)).toEqual(['R14|EXECUTE de PUBLIC']);
        await admin.query('REVOKE EXECUTE ON FUNCTION finn.purgar_eliminaciones() FROM PUBLIC');
        await admin.query('ALTER FUNCTION finn.purgar_eliminaciones() SECURITY INVOKER');
        expect(await r14(base)).toEqual(['R14|debe ser SECURITY DEFINER']);
        await admin.query('ALTER FUNCTION finn.purgar_eliminaciones() SECURITY DEFINER');
        expect(await r14(base)).toEqual([]);
      });
    });
  });

  describe('reglas de catálogo sin USAGE sobre auth', () => {
    const base = crearBasePrueba();
    it('PRU-INT-ESQ-109 [R8, R12] C5 corre como finn_respaldo, sin USAGE sobre un esquema auth con una tabla con nextval (como auth.refresh_tokens en Supabase), y sigue detectando una dependencia hacia auth y un nextval de secuencia ajena; control: una columna serial propia no es violación', async () => {
      const reglas = readFileSync(
        fileURLToPath(new URL('../../../tools/db/reglas-catalogo.sql', import.meta.url)),
        'utf8',
      );
      const comoRespaldo = (): Promise<string[]> =>
        consultar(base.urlAdmin, `SET LOCAL ROLE finn_respaldo;\n${reglas}`);
      const de = (filas: string[], regla: string): string[] =>
        filas.filter((f) => f.startsWith(regla));
      await con(base.urlAdmin, (c) =>
        c.query(`CREATE SCHEMA auth;
          CREATE TABLE auth.refresh_tokens (id bigserial PRIMARY KEY);
          CREATE TYPE auth.nivel AS ENUM ('a');
          CREATE TABLE finn.zz_propia (id bigserial PRIMARY KEY);`),
      );
      const limpias = await comoRespaldo();
      expect(de(limpias, 'R8')).toEqual([]);
      expect(de(limpias, 'R12')).toEqual([]);

      await con(base.urlAdmin, (c) =>
        c.query(`CREATE TABLE finn.zz_depende (n auth.nivel);
          CREATE TABLE finn.zz_ajena (id bigint DEFAULT nextval('finn.zz_propia_id_seq'));`),
      );
      const filas = await comoRespaldo();
      expect(de(filas, 'R8').join('\n')).toMatch(/zz_depende.*→ .*auth\.nivel/);
      expect(de(filas, 'R12')).toEqual([
        'R12 DEFAULT nextval de secuencia compartida: finn.zz_ajena.id',
      ]);
    });
  });

  describe('modo de conciliación', () => {
    const base = crearBasePrueba();
    it('PRU-INT-ESQ-103 [CF-01] MIG-09: conciliaciones.modo vale estado_cuenta por defecto, admite saldo y es inmutable (e_solo_insercion)', async () => {
      // 06 §3.2.3: OP-47 deja el valor por defecto y OP-53 escribe `saldo`; la fila no se modifica después
      const insertar = (modo: string): string =>
        `INSERT INTO finn.conciliaciones
           (cuenta_id, fecha_estado, saldo_estado, terminada_en, diferencia_aceptada${modo ? ', modo' : ''})
         SELECT id, finn.hoy(), 1000, '2026-01-01T12:00:00Z', 0${modo ? `, '${modo}'` : ''}
         FROM finn.cuentas WHERE nombre = 'Caja'
         RETURNING modo::text AS modo`;
      await con(base.url, async (app) => {
        await app.query(`BEGIN; SELECT finn.tomar_bloqueo();
          INSERT INTO finn.cuentas (tipo, nombre, subtipo_efectivo, fecha_apertura) VALUES ('efectivo', 'Caja', 'corriente', finn.hoy());`);
        const porDefecto = await app.query<{ modo: string }>(insertar(''));
        const saldo = await app.query<{ modo: string }>(insertar('saldo'));
        await app.query('COMMIT');
        expect([porDefecto.rows, saldo.rows]).toEqual([
          [{ modo: 'estado_cuenta' }],
          [{ modo: 'saldo' }],
        ]);
        // Fuera del enum: 22P02; finn_app no tiene UPDATE sobre la tabla (solo inserción)
        await app.query('BEGIN; SELECT finn.tomar_bloqueo();');
        expect(await codigo(app, insertar('otro'))).toBe('22P02');
        await app.query('ROLLBACK; BEGIN; SELECT finn.tomar_bloqueo();');
        expect(await codigo(app, "UPDATE finn.conciliaciones SET modo = 'saldo'")).toBe('42501');
        await app.query('ROLLBACK');
      });
      // Con privilegio y bloqueo, e_solo_insercion rechaza cambiar `modo` en las dos direcciones
      await con(base.urlMigraciones, async (mig) => {
        for (const [de, a] of [
          ['estado_cuenta', 'saldo'],
          ['saldo', 'estado_cuenta'],
        ]) {
          await mig.query('BEGIN; SELECT finn.tomar_bloqueo();');
          expect(
            await codigo(mig, `UPDATE finn.conciliaciones SET modo = '${a}' WHERE modo = '${de}'`),
          ).toBe('FN008');
          await mig.query('ROLLBACK');
        }
        const { rows } = await mig.query<{ modo: string; n: number }>(
          'SELECT modo::text AS modo, count(*)::int AS n FROM finn.conciliaciones GROUP BY modo ORDER BY modo',
        );
        expect(rows).toEqual([
          { modo: 'estado_cuenta', n: 1 },
          { modo: 'saldo', n: 1 },
        ]);
      });
    });
  });

  describe('reactivación de programadas', () => {
    const base = crearBasePrueba();
    it('PRU-INT-ESQ-104 [CF-20] MIG-11: programadas.reactivada_desde es date nulo sin valor por defecto; una fila existente queda en nulo', async () => {
      const columna = async (c: pg.Client): Promise<unknown[]> =>
        (
          await c.query<Record<string, unknown>>(
            `SELECT data_type, is_nullable, column_default FROM information_schema.columns
             WHERE table_schema = 'finn' AND table_name = 'programadas' AND column_name = 'reactivada_desde'`,
          )
        ).rows;
      const reactivada = async (c: pg.Client): Promise<unknown[]> =>
        (
          await c.query<Record<string, unknown>>(
            "SELECT reactivada_desde FROM finn.programadas WHERE comercio = 'Luz'",
          )
        ).rows;
      const SIN_DEFAULT = [{ data_type: 'date', is_nullable: 'YES', column_default: null }];
      // Una programada válida (gasto con una línea), como finn_app con bloqueo; los diferidos corren al COMMIT
      await con(base.url, async (app) => {
        await app.query(`BEGIN; SELECT finn.tomar_bloqueo();
          INSERT INTO finn.cuentas (tipo, nombre, subtipo_efectivo, fecha_apertura) VALUES ('efectivo', 'Caja', 'corriente', finn.hoy());
          INSERT INTO finn.grupos (nombre) VALUES ('Casa');
          INSERT INTO finn.categorias (grupo_id, nombre) SELECT id, 'Luz' FROM finn.grupos WHERE nombre = 'Casa';
          INSERT INTO finn.programadas (tipo, cuenta_id, comercio, monto, frecuencia, primera_fecha)
            SELECT 'gasto', id, 'Luz', 2500, 'mensual', finn.hoy() FROM finn.cuentas WHERE nombre = 'Caja';
          INSERT INTO finn.programada_lineas (programada_id, orden, monto, categoria_id)
            SELECT p.id, 1, 2500, c.id FROM finn.programadas p, finn.categorias c WHERE c.nombre = 'Luz';
          COMMIT;`);
        expect(await columna(app)).toEqual(SIN_DEFAULT);
        expect(await reactivada(app)).toEqual([{ reactivada_desde: null }]);
      });
      // La fila ya existe antes de la columna: se quita y se vuelve a aplicar el SQL de la migración, tal
      // cual está en disco, en una transacción que se deshace (la base queda como la plantilla)
      const dir = fileURLToPath(new URL('../prisma/migrations/', import.meta.url));
      const carpeta = readdirSync(dir).filter((d) => d.endsWith('_g_programadas_reactivada'));
      expect(carpeta).toHaveLength(1);
      const sql = readFileSync(join(dir, carpeta[0] ?? '', 'migration.sql'), 'utf8');
      await con(base.urlMigraciones, async (mig) => {
        await mig.query('BEGIN; ALTER TABLE finn.programadas DROP COLUMN reactivada_desde');
        try {
          expect(await columna(mig)).toEqual([]);
          await mig.query(sql);
          expect(await columna(mig)).toEqual(SIN_DEFAULT);
          expect(await reactivada(mig)).toEqual([{ reactivada_desde: null }]);
        } finally {
          await mig.query('ROLLBACK');
        }
      });
    });
  });

  describe('siembra', () => {
    const base = crearBasePrueba();
    it('PRU-INT-ESQ-102 [CF-14] la siembra deja exactamente las filas de 03 §9.1 a §9.5, con los formatos de m_formatos_bac', async () => {
      const F2 = String.raw`\((?<ultimos4>\d{4})\).*?USD\s*(?<monto>[\d,]+\.?\d*)\s+en el comercio:?\s+(?<comercio>.+?)\s+(?<fecha>\d{4}\/\d{2}\/\d{2}|\d{8})`;
      const F3 = String.raw`Titular\s+(?<ultimos4>\d{4})\s+por\s+USD(?<monto>[\d,]+\.?\d*)\s+en\s+(?<comercio>.+?)\s+el\s+(?<fecha>\d{4}-\d{2}-\d{2})`;
      // F-1 reescrito por 20261025000000_m_formatos_bac (TA-181, DT-12); F-2 y F-3 inactivos
      const F1 = String.raw`(?:MASTERCARD|VISA)\s+(?<ultimos4>\d{4}):\s+has realizado una compra por USD\s*(?<monto>\d[\d,]*(?:\.\d{1,2})?)\s+en el comercio:?\s+(?<comercio>\S+(?:\s+\S+)*?)\s+(?<fecha>\d{4}\/\d{2}\/\d{2}|\d{8})(?!\S)`;
      await con(base.urlAdmin, async (admin) => {
        const q = async (sql: string): Promise<unknown[]> =>
          (await admin.query<Record<string, unknown>>(sql)).rows;
        // 9.1: revision se inserta en 0; la siembra es una transacción sobre tablas [M] y la sube a 1 (5.3)
        expect(await q('SELECT id, valor, revision_minima_incremental FROM finn.revision')).toEqual(
          [{ id: 1, valor: '1', revision_minima_incremental: '0' }],
        );
        expect(await q('SELECT * FROM finn.estado_respaldo')).toEqual([
          {
            id: 1,
            ultimo_respaldo_en: null,
            ultimo_respaldo_objeto: null,
            ultima_restauracion_en: null,
          },
        ]);
        expect(await q('SELECT count(*)::int AS n FROM finn.token_webhook')).toEqual([{ n: 0 }]);
        // 9.2 y 9.3
        expect(await q('SELECT dia_inicio, rige_desde FROM finn.vigencias_ciclo')).toEqual([
          { dia_inicio: 21, rige_desde: null },
        ]);
        expect(await q('SELECT nombre, clave_sistema, orden, archivado FROM finn.grupos')).toEqual([
          {
            nombre: 'Pagos de tarjeta',
            clave_sistema: 'pagos_tarjeta',
            orden: 0,
            archivado: false,
          },
        ]);
        // 9.4 y 9.5
        expect(await q('SELECT nombre FROM finn.instituciones ORDER BY nombre')).toEqual([
          { nombre: 'BAC' },
          { nombre: 'Banco Agrícola' },
          { nombre: 'Cuscatlán' },
        ]);
        expect(
          await q(`SELECT i.nombre AS institucion, f.nombre, f.tipo_movimiento, f.patron, f.banderas,
                        f.monto_separador_miles AS miles, f.monto_separador_decimal AS decimal,
                        f.formatos_fecha::text AS fechas, f.activo
                 FROM finn.formatos_bancarios f JOIN finn.instituciones i ON i.id = f.institucion_id
                 ORDER BY f.nombre`),
        ).toEqual([
          {
            institucion: 'BAC',
            nombre: 'BAC compra',
            tipo_movimiento: 'compra',
            patron: F1,
            banderas: 'i',
            miles: ',',
            decimal: '.',
            fechas: '{AAAA/MM/DD,AAAAMMDD}',
            activo: true,
          },
          {
            institucion: 'Banco Agrícola',
            nombre: 'Banco Agrícola compra',
            tipo_movimiento: 'compra',
            patron: F2,
            banderas: 'i',
            miles: ',',
            decimal: '.',
            fechas: '{AAAA/MM/DD,AAAAMMDD}',
            activo: false,
          },
          {
            institucion: 'Cuscatlán',
            nombre: 'Cuscatlán compra',
            tipo_movimiento: 'compra',
            patron: F3,
            banderas: 'i',
            miles: ',',
            decimal: '.',
            fechas: '{AAAA-MM-DD}',
            activo: false,
          },
        ]);
        // Ninguna otra tabla de finn tiene filas (salvo el registro de Prisma); CF-14: nada de Finn 1.0
        const { rows: tablas } = await admin.query<{ t: string }>(
          `SELECT relname AS t FROM pg_class WHERE relnamespace = 'finn'::regnamespace AND relkind = 'r'
           AND relname NOT IN ('revision', 'estado_respaldo', 'vigencias_ciclo', 'grupos', 'instituciones',
                               'formatos_bancarios', '_prisma_migrations')
         ORDER BY relname`,
        );
        expect(tablas).toHaveLength(27);
        const con_filas: string[] = [];
        for (const { t } of tablas) {
          const { rows } = await admin.query<{ n: number }>(
            `SELECT count(*)::int AS n FROM finn.${t}`,
          );
          if (rows[0]?.n !== 0) con_filas.push(t);
        }
        expect(con_filas).toEqual([]);
      });
    });
  });
});

/** Las sentencias de una migración como las aplica `prisma migrate deploy`: una por una (03 §11.3, CH-23). */
function sentencias(sql: string): string[] {
  const lista: string[] = [];
  let actual = '';
  let enCuerpo = false;
  for (const linea of sql.split('\n')) {
    if (!enCuerpo && linea.trimStart().startsWith('--')) continue;
    actual += `${linea}\n`;
    if ((linea.match(/\$\$/g) ?? []).length % 2 === 1) enCuerpo = !enCuerpo;
    if (!enCuerpo && linea.trimEnd().endsWith(';')) {
      lista.push(actual.trim());
      actual = '';
    }
  }
  return lista;
}

/** El SQLSTATE y la restricción con que falla `sql` en una transacción con bloqueo que se deshace, u `ok`. */
async function rechazo(c: pg.Client, sql: string): Promise<string> {
  await c.query('BEGIN; SELECT finn.tomar_bloqueo();');
  try {
    await c.query(sql);
    return 'ok';
  } catch (e) {
    const { code, constraint } = e as { code?: string; constraint?: string };
    return `${code ?? String(e)} ${constraint ?? ''}`.trim();
  } finally {
    await c.query('ROLLBACK');
  }
}

describe('PRU-ESQ-ESQ', () => {
  const base = crearBasePrueba();
  it('PRU-ESQ-ESQ-110 [CH-224, MIG-16] m_cuentas_subtipo_efectivo: las cuentas de efectivo anteriores quedan en corriente; efectivo sin subtipo, tarjeta con subtipo y billetera con institución o últimos 4 fallan por sus CHECK', async () => {
    const dir = fileURLToPath(new URL('../prisma/migrations/', import.meta.url));
    const carpeta = readdirSync(dir).filter((d) => d.endsWith('_m_cuentas_subtipo_efectivo'));
    expect(carpeta).toHaveLength(1);
    const sql = readFileSync(join(dir, carpeta[0] ?? '', 'migration.sql'), 'utf8');
    expect(sql.startsWith('-- finn:manual')).toBe(true);
    const columna = async (c: pg.Client): Promise<unknown[]> =>
      (
        await c.query<Record<string, unknown>>(
          `SELECT udt_name, is_nullable, column_default FROM information_schema.columns
           WHERE table_schema = 'finn' AND table_name = 'cuentas' AND column_name = 'subtipo_efectivo'`,
        )
      ).rows;
    const COLUMNA = [{ udt_name: 'subtipo_efectivo', is_nullable: 'YES', column_default: null }];

    // La base de antes de la migración, con dos cuentas de efectivo que ya existían; después, la migración
    // tal cual está en disco, sentencia por sentencia como `migrate deploy` (cada una, su transacción)
    await con(base.urlMigraciones, async (mig) => {
      expect(await columna(mig)).toEqual(COLUMNA);
      await mig.query(`ALTER TABLE finn.cuentas DROP CONSTRAINT ck_cuentas_billetera,
        DROP CONSTRAINT ck_cuentas_subtipo_efectivo, DROP COLUMN subtipo_efectivo;
        DROP TYPE finn.subtipo_efectivo;`);
      expect(await columna(mig)).toEqual([]);
      await mig.query(`DO $$ BEGIN
          PERFORM finn.tomar_bloqueo();
          INSERT INTO finn.cuentas (tipo, nombre, ultimos4, fecha_apertura)
            VALUES ('efectivo', 'Caja', NULL, finn.hoy()), ('efectivo', 'Banco', '4321', finn.hoy());
        END $$;`);
      const lista = sentencias(sql);
      expect(lista).toHaveLength(6);
      for (const s of lista) await mig.query(s);
      expect(await columna(mig)).toEqual(COLUMNA);
      const { rows } = await mig.query<{ nombre: string; subtipo: string }>(
        'SELECT nombre, subtipo_efectivo::text AS subtipo FROM finn.cuentas ORDER BY nombre',
      );
      expect(rows).toEqual([
        { nombre: 'Banco', subtipo: 'corriente' },
        { nombre: 'Caja', subtipo: 'corriente' },
      ]);
      const { rows: valores } = await mig.query<{ v: string }>(
        'SELECT enum_range(NULL::finn.subtipo_efectivo)::text AS v',
      );
      expect(valores).toEqual([{ v: '{corriente,ahorro,billetera}' }]);
    });

    // Las CHECK, como finn_app
    await con(base.url, async (app) => {
      /** Una cuenta con su tipo, su subtipo y, si se da, una columna más con su valor SQL. */
      const insertar = (tipo: string, subtipo: string | null, [columna, valor]: string[] = []) =>
        `INSERT INTO finn.cuentas (tipo, nombre, subtipo_efectivo, fecha_apertura${columna ? `, ${columna}` : ''})
         VALUES ('${tipo}', 'Prueba', ${subtipo === null ? 'NULL' : `'${subtipo}'`}, finn.hoy()${valor ? `, ${valor}` : ''})`;
      const DE_SUBTIPO = '23514 ck_cuentas_subtipo_efectivo';
      const DE_BILLETERA = '23514 ck_cuentas_billetera';
      const institucion = '(SELECT id FROM finn.instituciones ORDER BY nombre LIMIT 1)';
      expect(await rechazo(app, insertar('efectivo', null))).toBe(DE_SUBTIPO);
      expect(await rechazo(app, insertar('tarjeta', 'corriente'))).toBe(DE_SUBTIPO);
      expect(await rechazo(app, insertar('efectivo', 'billetera', ['ultimos4', "'1234'"]))).toBe(
        DE_BILLETERA,
      );
      expect(
        await rechazo(app, insertar('efectivo', 'billetera', ['institucion_id', institucion])),
      ).toBe(DE_BILLETERA);
      expect(
        await rechazo(
          app,
          "UPDATE finn.cuentas SET subtipo_efectivo = 'billetera' WHERE nombre = 'Banco'",
        ),
      ).toBe(DE_BILLETERA);
      for (const subtipo of ['corriente', 'ahorro', 'billetera'])
        expect(await rechazo(app, insertar('efectivo', subtipo))).toBe('ok');
      expect(await rechazo(app, insertar('efectivo', 'ahorro', ['ultimos4', "'1234'"]))).toBe('ok');
    });
  });
});
