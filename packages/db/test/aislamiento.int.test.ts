// PRU-INT-ESQ-101 (TA-050; 07 §5.2, DP-05, DP-07, MIG-00, CH-21): cada archivo de integración tiene su base,
// clonada de finn_plantilla. Corre los dos archivos de aislamiento/ en un Vitest aparte, a la vez, contra el
// contenedor de este proceso; después repite con una base compartida en lugar del clon (control).
import { spawn } from 'node:child_process';
import { readFileSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { expect, inject, it } from 'vitest';
import { crearBasePrueba } from './ayudantes/base.ts';

const DIR = join(dirname(fileURLToPath(import.meta.url)), 'aislamiento');
const VITEST = join(
  dirname(createRequire(import.meta.url).resolve('vitest/package.json')),
  'vitest.mjs',
);

type Informe = {
  numTotalTestSuites: number;
  numPassedTests: number;
  numFailedTests: number;
  testResults: { assertionResults: { meta?: { base?: string } }[] }[];
};

/** Corre los dos archivos en un Vitest hijo y devuelve su informe JSON. */
async function correrArchivos(compartida: string): Promise<Informe> {
  const salida = join(tmpdir(), `finn-aislamiento-${randomUUID()}.json`);
  // El hijo no hereda el estado del worker de este Vitest
  const env = Object.fromEntries(
    Object.entries(process.env).filter(([k]) => !k.startsWith('VITEST') && k !== 'TINYPOOL'),
  );
  const args = ['run', '--config', join(DIR, 'vitest.config.ts'), '--reporter=json'];
  const hijo = spawn(process.execPath, [VITEST, ...args, `--outputFile=${salida}`], {
    cwd: DIR,
    stdio: 'ignore',
    env: {
      ...env,
      FINN_ARNES_PG: JSON.stringify(inject('finnPg')),
      FINN_ARNES_COMPARTIDA: compartida,
    },
  });
  await new Promise((fin) => hijo.on('exit', fin));
  try {
    return JSON.parse(readFileSync(salida, 'utf8')) as Informe;
  } finally {
    rmSync(salida, { force: true });
  }
}

const propia = await crearBasePrueba();

it('PRU-INT-ESQ-101 dos archivos a la vez usan bases distintas clonadas de la plantilla y ninguno ve las filas del otro', async () => {
  const admin = new pg.Client({ connectionString: propia.urlAdmin });
  await admin.connect();
  try {
    // La base del archivo: clonada de la plantilla, marcada y con el esquema de finn_migraciones
    const { rows: marca } = await admin.query<{ v: string; dueno: string }>(
      `SELECT current_setting('finn.reloj_simulado') AS v,
              (SELECT nspowner::regrole::text FROM pg_namespace WHERE nspname = 'finn') AS dueno`,
    );
    expect(marca).toEqual([{ v: 'on', dueno: 'finn_migraciones' }]);

    const aislado = await correrArchivos('');
    expect(aislado).toMatchObject({ numTotalTestSuites: 2, numPassedTests: 2, numFailedTests: 0 });
    const bases = aislado.testResults.flatMap((t) => t.assertionResults.map((a) => a.meta?.base));
    expect(new Set(bases).size).toBe(2);
    // Cada archivo borró su base al terminar
    const { rows: quedan } = await admin.query(
      'SELECT datname FROM pg_database WHERE datname = ANY($1)',
      [bases],
    );
    expect(quedan).toEqual([]);

    // Control: TEMPLATE reemplazado por una base compartida; el archivo que lee último ve la fila del otro
    const compartida = `finn_compartida_${randomUUID().replaceAll('-', '')}`;
    await admin.query(`CREATE DATABASE ${compartida} TEMPLATE finn_plantilla`);
    try {
      const control = await correrArchivos(compartida);
      expect(control.numTotalTestSuites).toBe(2);
      expect(control.numPassedTests).toBeLessThan(2);
    } finally {
      await admin.query(`DROP DATABASE ${compartida} WITH (FORCE)`);
    }
  } finally {
    await admin.end();
  }
}, 120_000);
