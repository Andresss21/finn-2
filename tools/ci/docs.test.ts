// PRU-SEG-OPER-102 (TA-252; 07 §13.7, §35; 04 §18.4 BE-63; CT-08, DT-17): los scripts de las fases 4 a 6 corren en
// `rapido` cuando el diff toca docs/, y el paso falla si un documento pierde una referencia. Control: 06 con OP-22
// quitada de la ficha FT-23 (la única que la cita) hace fallar la trazabilidad de 06 (T1) y `docs:comprobar` sale con 1.
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const raiz = fileURLToPath(new URL('../..', import.meta.url));
const DOCS = ['04-backend.md', '05-frontend.md', '06-features.md'];

const comprobar = (docs: string) =>
  spawnSync(process.execPath, [join(raiz, 'tools', 'docs', 'comprobar.mjs'), '--docs', docs], {
    cwd: raiz,
    encoding: 'utf8',
  });

const decidir = (archivos: string[]) => {
  const r = spawnSync(
    process.execPath,
    [join(raiz, 'tools', 'ci', 'afecta.mjs'), '--archivos', archivos.join(',')],
    {
      cwd: raiz,
      encoding: 'utf8',
      env: {
        ...process.env,
        FINN_EVENTO: 'pull_request',
        FINN_BORRADOR: 'true',
        GITHUB_OUTPUT: '',
      },
    },
  );
  expect(r.status, r.stderr).toBe(0);
  return JSON.parse(r.stdout) as Record<string, boolean>;
};

/** 06 sin OP-22 en la ficha FT-23: el bloque va de su encabezado al de la ficha siguiente. */
const sinOp22 = (t: string): string => {
  const i = t.indexOf('\n#### FT-23 ');
  const j = t.indexOf('\n#### FT-', i + 1);
  expect(i, 'la ficha FT-23 existe').toBeGreaterThan(0);
  const ficha = t.slice(i, j);
  expect(ficha).toContain('OP-22');
  return t.slice(0, i) + ficha.replaceAll(/OP-22(?!\d)/g, 'OP-XX') + t.slice(j);
};

describe('PRU-SEG-OPER', () => {
  let [intactos, alterados] = ['', ''];
  beforeAll(() => {
    [intactos, alterados] = [1, 2].map(() => mkdtempSync(join(tmpdir(), 'finn-docs-')));
    for (const n of DOCS) {
      copyFileSync(join(raiz, 'docs', n), join(intactos, n));
      copyFileSync(join(raiz, 'docs', n), join(alterados, n));
    }
    const f06 = join(alterados, '06-features.md');
    writeFileSync(f06, sinOp22(readFileSync(f06, 'utf8')));
  });
  afterAll(() => {
    for (const d of [intactos, alterados]) rmSync(d, { recursive: true, force: true });
  });

  it('PRU-SEG-OPER-102 [T1] scripts de las fases anteriores en rapido (BE-63, CT-08; 07 §13.7): un diff de docs/ los corre, pasan sobre docs/ y una operación quitada de una ficha hace fallar el paso', () => {
    // rapido agrega el paso solo si el diff toca docs/ o los scripts
    expect(decidir(['docs/06-features.md'])).toMatchObject({ afecta_docs: true });
    expect(decidir(['tools/docs/t17.py'])).toMatchObject({ afecta_docs: true });
    expect(decidir(['apps/web/src/x.tsx'])).toMatchObject({ afecta_docs: false });
    const afecta = readFileSync(join(raiz, 'tools', 'ci', 'afecta.mjs'), 'utf8');
    expect(afecta).toContain("...(d.afecta_docs ? [['docs', 'pnpm docs:comprobar']] : [])");

    // Los 7 pasan sobre los documentos aprobados, con las salidas de V7-20 (07 §35)
    const bien = comprobar(intactos);
    expect(bien.status, bien.stdout + bien.stderr).toBe(0);
    for (const s of [
      // CH-27 agrega `devolucion_por_cobrar_otra_cuenta` a 04 §3.0.6: 77 → 78 rechazos; CH-45, `cuota_sin_coincidencia`: 79 (07 §35).
      'escenarios: 50  avisos: 24  operaciones en 3.0.8: 62  consultas: 44  rechazos: 79',
      'PASA: T1 a T7',
      'operaciones con pantalla: 61/62 (sin pantalla: OP-35, el webhook) · flujos: 51 · carpetas de flujo repetidas: 0',
      'Árbol: 74 rutas; mapa: 78 filas; consultas usadas: 18/18; variantes de formulario: 18/18',
      'T1 a T9 pasan',
      "'fichas': 77, 'ops': 62, 'consultas': 19, 'reportes': 15, 'formularios': 15, 'rutas': 79",
      'docs:comprobar: pasan los 7',
    ])
      expect(bien.stdout).toContain(s);

    // Control: OP-22 fuera de FT-23
    const mal = comprobar(alterados);
    expect(mal.status, mal.stdout).toBe(1);
    expect(mal.stdout).toContain('✗ 06 trazabilidad.py (T1 a T8)');
    expect(mal.stdout).toContain('T1: OP-22 sin ficha');
    expect(mal.stdout).toContain('✓ 04 t17.py');
  }, 60_000);
});
