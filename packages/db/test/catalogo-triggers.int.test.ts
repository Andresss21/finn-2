// Catálogo de triggers (V-21, 07 §19.2) y C4 (03 §11.6, 07 §32.1), sobre copias de la plantilla (TA-052).
// - PRU-ESQ-ESQ-001: ninguna función de trigger, ni las funciones de finn que llama, escribe en una tabla [M]
//   distinta de la que dispara, salvo la lista cerrada de 04 §5.3.1 (la revisión y las eliminaciones de EN-2).
// - PRU-ESQ-ESQ-103: C4 vacío con el schema.prisma del repositorio; sale con 2 si se le agrega una columna,
//   y c4-explicar agrega la línea de P7-12 solo si el diff cambia el DEFAULT de una columna de CT-02.
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { afterAll, describe, expect, it } from 'vitest';
import { crearBasePrueba } from './ayudantes/base.ts';

const raiz = fileURLToPath(new URL('../../..', import.meta.url));

/** Las tablas a las que una función de trigger puede escribir además de la suya (04 §5.3.1, EN-2). */
const EXCEPCIONES = ['revision', 'eliminaciones'];

type Fila = Record<string, string>;
type Escritura = { tabla: string; funcion: string; destino: string; via: string };

/** Quita comentarios y literales: un mensaje de error que dice "update" no es una sentencia. */
const limpiar = (cuerpo: string): string =>
  cuerpo
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/--[^\n]*/g, ' ')
    .replace(/\$(\w*)\$[\s\S]*?\$\1\$/g, "''")
    .replace(/'(?:[^']|'')*'/g, "''");

const ID = String.raw`(?:"?\w+"?\s*\.\s*)?"?(\w+)"?`;
const DML = [
  new RegExp(String.raw`\bINSERT\s+INTO\s+(?:ONLY\s+)?${ID}`, 'gi'),
  new RegExp(String.raw`(?<!\bFOR\s+(?:NO\s+KEY\s+)?)\bUPDATE\s+(?:ONLY\s+)?${ID}`, 'gi'),
  new RegExp(String.raw`\bDELETE\s+FROM\s+(?:ONLY\s+)?${ID}`, 'gi'),
  new RegExp(String.raw`\bMERGE\s+INTO\s+(?:ONLY\s+)?${ID}`, 'gi'),
  new RegExp(String.raw`\bTRUNCATE\s+(?:TABLE\s+)?(?:ONLY\s+)?${ID}`, 'gi'),
];

/**
 * Las escrituras de cada función de trigger de finn sobre tablas de finn distintas de la que dispara,
 * siguiendo las funciones de finn que llama; un `EXECUTE` (SQL dinámico) cuenta como escritura a `?`.
 */
async function escrituras(
  c: pg.Client,
): Promise<{ todas: Escritura[]; clases: Map<string, string> }> {
  const tablas = (
    await c.query<Fila>(`SELECT relname, coalesce(obj_description(oid, 'pg_class'), '') AS clase
       FROM pg_class WHERE relnamespace = 'finn'::regnamespace AND relkind IN ('r', 'p')`)
  ).rows;
  const clases = new Map(tablas.map((t) => [t['relname'] ?? '', t['clase'] ?? '']));
  const funciones = new Map(
    (
      await c.query<Fila>(
        `SELECT proname, prosrc FROM pg_proc WHERE pronamespace = 'finn'::regnamespace AND prokind = 'f'`,
      )
    ).rows.map((f) => [f['proname'] ?? '', limpiar(f['prosrc'] ?? '')]),
  );
  const disparos = (
    await c.query<Fila>(`SELECT DISTINCT tg.tgrelid::regclass::text AS tabla, p.proname
       FROM pg_trigger tg JOIN pg_proc p ON p.oid = tg.tgfoid
       JOIN pg_class t ON t.oid = tg.tgrelid
       WHERE NOT tg.tgisinternal AND t.relnamespace = 'finn'::regnamespace`)
  ).rows;
  const todas: Escritura[] = [];
  for (const d of disparos) {
    const tabla = (d['tabla'] ?? '').replace(/^finn\./, '');
    const inicio = d['proname'] ?? '';
    const pendientes = [inicio];
    const vistas = new Set<string>();
    while (pendientes.length) {
      const f = pendientes.pop() ?? '';
      if (vistas.has(f)) continue;
      vistas.add(f);
      const cuerpo = funciones.get(f) ?? '';
      const via = f === inicio ? '' : f;
      for (const re of DML)
        for (const m of cuerpo.matchAll(re)) {
          const destino = (m[1] ?? '').toLowerCase();
          if (clases.has(destino) && destino !== tabla)
            todas.push({ tabla, funcion: inicio, destino, via });
        }
      if (/\bEXECUTE\b/i.test(cuerpo)) todas.push({ tabla, funcion: inicio, destino: '?', via });
      for (const m of cuerpo.matchAll(/\bfinn\s*\.\s*"?(\w+)"?\s*\(/gi))
        if (funciones.has(m[1] ?? '')) pendientes.push(m[1] ?? '');
    }
  }
  return { todas, clases };
}

/** Las violaciones de V-21: escrituras a otra tabla [M] (o dinámicas) fuera de la lista cerrada. */
const violaciones = (e: { todas: Escritura[]; clases: Map<string, string> }): string[] =>
  e.todas
    .filter((x) => !EXCEPCIONES.includes(x.destino))
    .filter((x) => x.destino === '?' || e.clases.get(x.destino) === 'finn:clase=M')
    .map((x) => `${x.tabla}: ${x.funcion}${x.via ? ` → ${x.via}` : ''} escribe en ${x.destino}`)
    .sort();

async function conAdmin<T>(url: string, fn: (c: pg.Client) => Promise<T>): Promise<T> {
  const c = new pg.Client({ connectionString: url });
  await c.connect();
  try {
    return await fn(c);
  } finally {
    await c.end();
  }
}

describe('PRU-ESQ-ESQ catálogo de triggers', () => {
  const base = crearBasePrueba();
  it('PRU-ESQ-ESQ-001 [V-21] DP-23: ninguna función de trigger escribe en otra tabla de clase M, salvo revision y eliminaciones; una sembrada que lo hace falla', async () => {
    await conAdmin(base.urlAdmin, async (c) => {
      const e = await escrituras(c);
      expect(violaciones(e)).toEqual([]);
      // El análisis ve las dos escrituras documentadas (b_avanzar_revision, y_registrar_eliminacion)
      const vistas = new Set(e.todas.map((x) => `${x.funcion}>${x.destino}`));
      expect(vistas).toContain('tg_avanzar_revision>revision');
      expect(vistas).toContain('tg_registrar_eliminacion>eliminaciones');
      expect(new Set(e.todas.map((x) => x.destino))).toEqual(new Set(EXCEPCIONES));
      // Control: un trigger sembrado que escribe en otra tabla [M], directo o por una función que llama
      await c.query('BEGIN');
      try {
        await c.query(`
          CREATE FUNCTION finn.control_borrar_metas() RETURNS void LANGUAGE sql AS
            $$ DELETE FROM finn.metas WHERE false $$;
          CREATE FUNCTION finn.tg_control_v21() RETURNS trigger LANGUAGE plpgsql AS $$
          BEGIN
            -- UPDATE finn.categorias (comentario: no cuenta)
            RAISE NOTICE 'UPDATE finn.asignaciones';
            UPDATE finn.cuentas SET nombre = nombre WHERE false;
            PERFORM finn.control_borrar_metas();
            RETURN NULL;
          END $$;
          CREATE TRIGGER z_control_v21 AFTER INSERT ON finn.grupos
            FOR EACH ROW EXECUTE FUNCTION finn.tg_control_v21();`);
        expect(violaciones(await escrituras(c))).toEqual([
          'grupos: tg_control_v21 escribe en cuentas',
          'grupos: tg_control_v21 → control_borrar_metas escribe en metas',
        ]);
      } finally {
        await c.query('ROLLBACK');
      }
    });
  });
});

type Salida = { codigo: number | null; texto: string };

/** `node tools/db/c4.mjs` contra `url` como finn_migraciones, con el esquema dado. */
function c4(url: string, ...args: string[]): Promise<Salida> {
  return new Promise((fin, error) => {
    const partes: string[] = [];
    const hijo = spawn(process.execPath, [join(raiz, 'tools', 'db', 'c4.mjs'), ...args], {
      env: { ...process.env, DIRECT_URL: url },
    });
    hijo.stdout.on('data', (d: Buffer) => partes.push(d.toString()));
    hijo.stderr.on('data', (d: Buffer) => partes.push(d.toString()));
    hijo.on('error', error);
    hijo.on('exit', (codigo) => {
      fin({ codigo, texto: partes.join('') });
    });
  });
}

describe('PRU-ESQ-ESQ C4', () => {
  const base = crearBasePrueba();
  const dir = mkdtempSync(join(tmpdir(), 'finn-c4-'));
  afterAll(() => {
    rmSync(dir, { recursive: true, force: true });
  });
  const esquema = readFileSync(join(raiz, 'packages', 'db', 'prisma', 'schema.prisma'), 'utf8');
  const variante = (nombre: string, buscar: RegExp, poner: string): string => {
    const texto = esquema.replace(buscar, poner);
    expect(texto).not.toBe(esquema);
    const ruta = join(dir, nombre);
    writeFileSync(ruta, texto);
    return ruta;
  };

  it('PRU-ESQ-ESQ-103 [C4] P7-12-disparador: vacío con schema.prisma; sale con 2 con una columna de más, y c4-explicar pide el respaldo b solo si cambia un DEFAULT de CT-02', async () => {
    const sana = await c4(base.urlMigraciones);
    expect(sana.texto).toContain('C4: sin diferencias');
    expect(sana.codigo).toBe(0);

    // Una columna de más en un modelo: diff sin interpretar, sin la línea de P7-12
    const columna = variante(
      'columna.prisma',
      /(\n {2}eliminadaEn DateTime[^\n]*\n)/,
      '$1  extraControl Int? @map("extra_control")\n',
    );
    const r1 = await c4(base.urlMigraciones, '--esquema', columna);
    expect(r1.codigo).toBe(2);
    expect(r1.texto).toMatch(
      /ALTER TABLE "finn"\."eliminaciones" ADD COLUMN\s+"extra_control" INTEGER/,
    );
    expect(r1.texto).not.toContain('P7-12');

    // El DEFAULT de una de las 9 columnas de CT-02 (eliminaciones.eliminada_en) cambia: P7-12
    const defecto = variante(
      'defecto.prisma',
      /(\n {2}eliminadaEn DateTime\s+)@default\(now\(\)\)/,
      '$1@default(dbgenerated("finn.hoy()"))',
    );
    const r2 = await c4(base.urlMigraciones, '--esquema', defecto);
    expect(r2.codigo).toBe(2);
    expect(r2.texto).toMatch(/ALTER COLUMN "eliminada_en" SET DEFAULT/);
    expect(r2.texto).toContain('P7-12: aplicar el respaldo b)');
  }, 120_000);
});
