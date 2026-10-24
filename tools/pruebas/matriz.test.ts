// Pruebas de la matriz (TA-006): los conteos de 07 §35 sobre docs/ y las mutaciones de V7-09 de M7, M8, M12 y M13.
// Es una prueba de herramienta del repositorio: no lleva identificador PRU- (el encargo de TA-006 no tiene `pru`).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { dePlaywright, deVitest, sinRepetir } from './listar.ts';
import { archivosDeCodigo, verificar } from './matriz.ts';
import { fichas, objetivos } from './documentos.ts';
import type { Documentos } from './documentos.ts';
import type { Entradas } from './matriz.ts';

const doc = (n: string): string =>
  readFileSync(new URL(`../../docs/${n}`, import.meta.url), 'utf8');
const base = (): Entradas => ({
  d01: doc('01-dominio.md'),
  d04: doc('04-backend.md'),
  d05: doc('05-frontend.md'),
  d06: doc('06-features.md'),
  inventario: [
    {
      titulo: 'PRU-INT-TARJ > PRU-INT-TARJ-004 [CA-30.4, ESC-10, AV-04, P1] pago mayor',
      archivo: 'packages/aplicacion/test/tarj.int.test.ts',
    },
    {
      titulo: 'PRU-ESC-10@motor [ESC-10] escenario',
      archivo: 'packages/dominio/escenarios/datos/esc-10.ts',
    },
    {
      titulo: 'PRU-ESC-10@int [ESC-10] escenario',
      archivo: 'packages/aplicacion/test/esc-10.int.test.ts',
    },
    {
      titulo: 'PRU-E2E-PRES-001 [REC-4.1, FT-09, V5-12, CF-16] recorrido',
      archivo: 'apps/web/e2e/pres.e2e.ts',
    },
    {
      titulo: 'una prueba de herramienta sin identificador',
      archivo: 'tools/lint/controles.test.ts',
    },
  ],
  features: { 'FT-30': 'en_curso' },
  mapa: [
    { patron: 'apps/web/src/app/(finn)/layout.tsx', fts: 'marco' },
    { patron: 'apps/web/src/app/(finn)/tarjetas/**', fts: ['FT-29', 'FT-30'] },
    { patron: 'packages/dominio/src/**', fts: [] },
  ],
  codigo: [
    'apps/web/src/app/(finn)/layout.tsx',
    'apps/web/src/app/(finn)/tarjetas/[id]/page.tsx',
    'packages/dominio/src/index.ts',
  ],
});
// Los conteos de 07 §13.1 y §35
function recuento(d: Documentos) {
  const obj = objetivos(d);
  const fs = fichas(d.d06);
  const n = (t: string) => obj.filter((o) => o.tipo === t).length;
  const ca = (p: string) =>
    obj.filter((o) => o.tipo === 'CA' && o.prioridad === p && !o.diferida).length;
  const p = (x: string) => fs.filter((f) => f.prioridad === x).length;
  return {
    fichas: fs.length,
    porPrioridad: {
      I: p('I'),
      M: p('M'),
      P: p('P'),
      diferidas: fs.filter((f) => f.diferida).length,
    },
    ca: {
      total: n('CA'),
      I: ca('I'),
      M: ca('M'),
      P: ca('P'),
      diferidos: obj.filter((o) => o.diferida).length,
    },
    esc: n('ESC'),
    av: n('AV'),
    invariantes: n('INV'),
    casosBorde: n('CB'),
    recorridos: n('REC'),
    verificacionesPrevias: n('VER'),
  };
}
const reglas = (e: Entradas): string[] => [
  ...new Set(verificar(e).errores.map((x) => x.split(' ')[0]!)),
];

describe('matriz: lectura de los documentos (07 §13.1, §35)', () => {
  it('da los conteos de 07 §35 sobre docs/', () => {
    const c = recuento(base());
    expect(c.fichas).toBe(77);
    expect(c.porPrioridad).toEqual({ I: 31, M: 38, P: 8, diferidas: 1 });
    expect(c.ca).toEqual({ total: 492, I: 233, M: 232, P: 24, diferidos: 3 });
    expect([
      c.esc,
      c.av,
      c.invariantes,
      c.casosBorde,
      c.recorridos,
      c.verificacionesPrevias,
    ]).toEqual([50, 24, 28, 34, 6, 92]);
  });

  it('una base consistente no da errores ni avisos', () => {
    const r = verificar(base());
    expect(r.errores).toEqual([]);
    expect(r.avisos).toEqual([]);
  });

  it('el repositorio real pasa M7, M8, M12 y M13', () => {
    const real = {
      ...base(),
      inventario: [],
      mapa: JSON.parse(
        readFileSync(new URL('../../pruebas/mapa-codigo.json', import.meta.url), 'utf8'),
      ),
      codigo: archivosDeCodigo(fileURLToPath(new URL('../..', import.meta.url))),
    };
    expect(verificar(real).errores).toEqual([]);
  });
});

describe('matriz: mutaciones (V7-09)', () => {
  it('M7: referencia inexistente (errata CA-30.40)', () => {
    const e = base();
    e.inventario[0]!.titulo = e.inventario[0]!.titulo.replace('CA-30.4,', 'CA-30.4, CA-30.40,');
    expect(reglas(e)).toEqual(['M7']);
  });

  it('M7: ficha inexistente', () => {
    const e = base();
    e.inventario[3]!.titulo = e.inventario[3]!.titulo.replace('FT-09', 'FT-99');
    expect(reglas(e)).toEqual(['M7']);
  });

  it('M7: referencia con formato desconocido', () => {
    const e = base();
    e.inventario[0]!.titulo = e.inventario[0]!.titulo.replace('CA-30.4,', 'CA-30,');
    expect(reglas(e)).toEqual(['M7']);
  });

  it('M8: identificador mal formado, nivel o área desconocidos', () => {
    for (const mal of [
      'PRU-INT-TARJ-4 [CA-30.4] x',
      'PRU-XXX-TARJ-001 [CA-30.4] x',
      'PRU-INT-NADA-001 [CA-30.4] x',
    ]) {
      const e = base();
      e.inventario[0]!.titulo = mal;
      expect(reglas(e)).toEqual(['M8']);
    }
  });

  it('M8: identificador repetido en otro archivo', () => {
    const e = base();
    e.inventario.push({
      ...e.inventario[0]!,
      archivo: 'packages/aplicacion/test/otra.int.test.ts',
    });
    expect(reglas(e)).toEqual(['M8']);
  });

  it('M8: nivel que no corresponde al archivo (INT en un .e2e.ts)', () => {
    const e = base();
    e.inventario[0]!.archivo = 'apps/web/e2e/x.e2e.ts';
    expect(reglas(e)).toEqual(['M8']);
  });

  it('M8: prueba de Finn sin identificador (las herramientas del repo están exentas)', () => {
    const e = base();
    e.inventario.push({ titulo: 'sin id', archivo: 'packages/dominio/src/x.test.ts' });
    expect(reglas(e)).toEqual(['M8']);
  });

  it('M12: archivo de código sin feature ni marco', () => {
    const e = base();
    e.codigo.push('apps/web/src/app/(finn)/nueva/page.tsx');
    expect(reglas(e)).toEqual(['M12']);
  });

  it('M13: ficha inexistente en features.json', () => {
    const e = base();
    e.features['FT-99' as 'FT-01'] = 'terminada';
    expect(reglas(e)).toEqual(['M13']);
  });

  it('M13: FT-49 (diferida) fuera de pendiente', () => {
    const e = base();
    e.features['FT-49'] = 'terminada';
    expect(reglas(e)).toEqual(['M13']);
  });

  it('M13: CA con pruebas en una ficha pendiente es un aviso, no un error', () => {
    const e = base();
    delete e.features['FT-30'];
    const r = verificar(e);
    expect(r.errores).toEqual([]);
    expect(r.avisos).toEqual([
      'M13 CA-30.4 tiene pruebas y FT-30 sigue pendiente en pruebas/features.json',
    ]);
  });
});

describe('inventario: unión de las listas de Vitest y Playwright', () => {
  it('une las dos listas, relativas a la raíz y sin repetir lo que corre en varios proyectos', () => {
    const v = deVitest(
      JSON.stringify([
        { name: 'a > PRU-DOM-VAL-001 x', file: 'C:\\r\\packages\\dominio\\src\\a.test.ts' },
      ]),
      'C:\\r',
    );
    const p = dePlaywright(
      JSON.stringify({
        suites: [
          {
            file: 'pres.e2e.ts',
            specs: [],
            suites: [{ specs: [{ title: 'PRU-E2E-PRES-001 x', file: 'pres.e2e.ts' }] }],
          },
        ],
      }),
    );
    expect(v).toEqual([
      { titulo: 'a > PRU-DOM-VAL-001 x', archivo: 'packages/dominio/src/a.test.ts' },
    ]);
    expect(sinRepetir([...v, ...p, ...p])).toHaveLength(2);
    expect(p[0]!.archivo).toBe('apps/web/e2e/pres.e2e.ts');
  });
});
