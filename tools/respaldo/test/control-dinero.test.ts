// Control de dinero diario, el paso final de respaldo.yml (TA-262; 07 §31.1, §36.1 DP-29; CH-91; nivel RES, 07 §1.1).
// Una base de prueba con un año del volumen base se lee como finn_respaldo, el rol de solo lectura del respaldo, que
// desde CH-91 tiene EXECUTE de finn.hoy() para usar leer() de @finn/db como la app. `medir` y `juzgar` corren como en
// el job: procesos aparte, con RESPALDO_DB_URL y RUNNER_TEMP. El hoy de la base es la fecha final del volumen, fijada
// como parámetro de la base de prueba (DB-08), nunca el reloj de pared. El control: una línea que rompe inv. 6.
import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Cambio, Uuid } from '../../../packages/dominio/src/index.ts';
import { escribir } from '../../../packages/db/src/index.ts';
import {
  consultar,
  crearBasePrueba,
  type BasePrueba,
} from '../../../packages/db/test/ayudantes/base.ts';
import {
  conteo,
  fechaFinal,
  generarHechos,
  generarPeriodos,
  TABLAS_MOTOR,
} from '../../pruebas/volumen/generar.ts';

const raiz = fileURLToPath(new URL('../../../', import.meta.url)).replaceAll('\\', '/');
const VOLUMEN = { nivel: 'base', anios: 1, semilla: 2 } as const;
const CLAVE_RESPALDO = 'arnes-respaldo'; // la de finn_respaldo en el arnés (packages/db/test/ayudantes/base.ts)
const INVARIANTES = [1, 2, 3, 4, 6, 9, 10, 11, 12, 17, 22, 24, 26, 28];

const base = crearBasePrueba();
const hoy = fechaFinal(VOLUMEN);
const trabajo = mkdtempSync(join(tmpdir(), 'finn-control-')).replaceAll('\\', '/');
const salida = `${trabajo}/control-dinero/control-dinero.json`;
const anterior = `${trabajo}/control-dinero-anterior/control-dinero.json`;

type Control = {
  hoy: string;
  revision: string;
  pasa: boolean;
  invariantes: { invariante: number; pasa: boolean; violaciones: number }[];
  conteos: Record<string, number>;
  anterior: { hoy: string; revision: string } | null;
  diferencias: Record<string, number> | null;
};

const urlRespaldo = (b: BasePrueba): string =>
  b.urlAdmin.replace(/\/\/[^@]+@/, `//finn_respaldo:${CLAVE_RESPALDO}@`);
const paso = (sub: string): SpawnSyncReturns<string> =>
  spawnSync('node', ['tools/respaldo/control-dinero.ts', sub], {
    cwd: raiz,
    encoding: 'utf8',
    env: { ...process.env, RESPALDO_DB_URL: urlRespaldo(base), RUNNER_TEMP: trabajo },
  });
const texto = (r: SpawnSyncReturns<string>): string => `${r.stdout}\n${r.stderr}`;
const leerControl = (): Control => JSON.parse(readFileSync(salida, 'utf8')) as Control;

/** Un año del volumen base, período por período, con `finn.hoy` = fin del período (07 §12.7). */
async function sembrar(): Promise<void> {
  const [fila] = await consultar(
    base.urlAdmin,
    `SELECT id FROM finn.grupos WHERE clave_sistema = 'pagos_tarjeta'`,
  );
  process.env['DATABASE_URL'] = base.url;
  for (const p of generarPeriodos({ ...VOLUMEN, grupoPagos: fila as Uuid })) {
    const cambios = TABLAS_MOTOR.flatMap((t) =>
      (p.filas[t] as object[]).map((f) => ({ tipo: 'insertar', tabla: t, fila: f })),
    ) as unknown as Cambio[];
    await escribir((tx) => tx.aplicarCambios(cambios), { reloj: { hoy: p.hoy, desfaseMs: 0 } });
  }
  // El hoy de toda sesión, también la de finn_respaldo: parámetro de la base marcada (DB-08)
  await consultar(base.urlAdmin, `ALTER DATABASE ${base.nombre} SET finn.hoy = '${hoy}'`);
}

beforeAll(sembrar, 600_000);
afterAll(() => {
  rmSync(trabajo, { recursive: true, force: true });
});

describe('PRU-RES-RESP', () => {
  it('PRU-RES-RESP-102 DP-29, CH-91: el control de dinero carga los hechos con finn_respaldo por leer(), verifica los invariantes calculables de 07 §31.1 y los conteos contra el día anterior (informativos), guarda un artefacto sin montos y falla con una línea sembrada que rompe inv. 6', async () => {
    // CH-91: finn_respaldo ejecuta finn.hoy(), pero sigue sin escribir ni tomar el bloqueo
    expect(await consultar(urlRespaldo(base), 'SELECT finn.hoy()::text')).toEqual([hoy]);
    await expect(
      consultar(urlRespaldo(base), 'UPDATE finn.revision SET valor = valor WHERE id = 1'),
    ).rejects.toThrow(/read-only transaction/);
    await expect(consultar(urlRespaldo(base), 'SELECT finn.tomar_bloqueo()')).rejects.toThrow(
      /permission denied/,
    );

    // El artefacto del día anterior, con tres líneas menos: la diferencia se registra y no hace fallar
    const [revision = ''] = await consultar(base.urlAdmin, 'SELECT valor::text FROM finn.revision');
    const esperado = conteo(generarHechos(VOLUMEN)).tablas;
    mkdirSync(join(trabajo, 'control-dinero-anterior'), { recursive: true });
    writeFileSync(
      anterior,
      JSON.stringify({
        hoy: '2000-01-01',
        revision: '1',
        conteos: { lineas: (esperado['lineas'] ?? 0) - 3 },
      }),
    );
    const r1 = paso('medir');
    expect(r1.status, texto(r1)).toBe(0);
    const c1 = leerControl();
    expect(Object.keys(c1).sort()).toEqual(
      ['anterior', 'conteos', 'diferencias', 'hoy', 'invariantes', 'pasa', 'revision'].sort(),
    );
    expect(c1).toMatchObject({ hoy, revision, pasa: true });
    expect(c1.invariantes).toEqual(
      INVARIANTES.map((invariante) => ({ invariante, pasa: true, violaciones: 0 })),
    );
    for (const t of TABLAS_MOTOR) expect(c1.conteos[t], t).toBe(esperado[t]);
    expect(c1.conteos['revision']).toBe(1);
    expect(c1.anterior).toEqual({ hoy: '2000-01-01', revision: '1' });
    expect(c1.diferencias).toMatchObject({ lineas: 3 });
    // Sin montos: los únicos números son conteos, invariantes y violaciones
    expect(JSON.stringify(c1)).not.toMatch(/monto|saldo|total|disponible|lpa|centavos/i);
    const r2 = paso('juzgar');
    expect(r2.status, texto(r2)).toBe(0);
    expect(texto(r2)).toContain(`${INVARIANTES.length} invariantes sin violaciones`);

    // Control: sin triggers, una línea de un gasto deja de sumar el total de su transacción (inv. 6)
    rmSync(anterior);
    await consultar(
      base.urlAdmin,
      `BEGIN; SET LOCAL session_replication_role = replica;
       UPDATE finn.lineas SET monto = monto + 1 WHERE id = (SELECT l.id FROM finn.lineas l
         JOIN finn.transacciones t ON t.id = l.transaccion_id WHERE t.tipo = 'gasto' ORDER BY l.id LIMIT 1);
       COMMIT;`,
    );
    const r3 = paso('medir');
    expect(r3.status, texto(r3)).toBe(0);
    const c3 = leerControl();
    expect(c3.pasa).toBe(false);
    expect(c3.invariantes.find((x) => x.invariante === 6)).toEqual({
      invariante: 6,
      pasa: false,
      violaciones: 1,
    });
    expect(c3.anterior).toBeNull();
    expect(c3.diferencias).toBeNull();
    const r4 = paso('juzgar');
    expect(r4.status).toBe(1);
    expect(texto(r4)).toMatch(/inv\. 6: 1 violaciones/);
  }, 600_000);
});
