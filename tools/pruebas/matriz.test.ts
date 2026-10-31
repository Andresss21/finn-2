// Pruebas de la matriz (TA-006): los conteos de 07 §35 sobre docs/ y las mutaciones de V7-09 de M7, M8, M12 y M13.
// Es una prueba de herramienta del repositorio: no lleva identificador PRU- (el encargo de TA-006 no tiene `pru`).
import { mkdirSync, mkdtempSync, readFileSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { dePlaywright, deVitest, listaDeVitest, sinRepetir } from './listar.ts';
import {
  archivosDeCodigo,
  informe,
  inventarioVencido,
  resultadosCorrida,
  verificar,
} from './matriz.ts';
import { afectadas, fichasPorPiezas, piezas } from './afectadas.ts';
import { REF } from './reglas.ts';
import type { Previa } from './reglas.ts';
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
  manuales: '',
  resultadosManuales: '',
  previas: null,
  cuarentena: [],
  hoy: '2027-03-01',
  puerta: false,
  features: {},
  pendientes: [],
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
const fila = (e: Entradas, i: number): { titulo: string; archivo: string } => {
  const p = e.inventario[i];
  if (!p) throw new Error('sin prueba');
  return p;
};
const reglas = (e: Entradas): string[] => [
  ...new Set(verificar(e).errores.map((x) => x.split(' ')[0] ?? '')),
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

  it('una base consistente no da errores (solo el aviso M13 de la ficha pendiente)', () => {
    const r = verificar(base());
    expect(r.errores).toEqual([]);
    expect(r.avisos).toEqual([
      'M13 CA-30.4 tiene pruebas y FT-30 sigue pendiente en pruebas/features.json',
    ]);
  });

  it('el repositorio real pasa M7, M8, M12 y M13', () => {
    const real = {
      ...base(),
      inventario: [],
      mapa: JSON.parse(
        readFileSync(new URL('../../pruebas/mapa-codigo.json', import.meta.url), 'utf8'),
      ) as Entradas['mapa'],
      codigo: archivosDeCodigo(fileURLToPath(new URL('../..', import.meta.url))),
    };
    expect(verificar(real).errores).toEqual([]);
  });
});

describe('matriz: mutaciones (V7-09)', () => {
  it('M7: referencia inexistente (errata CA-30.40)', () => {
    const e = base();
    fila(e, 0).titulo = fila(e, 0).titulo.replace('CA-30.4,', 'CA-30.4, CA-30.40,');
    expect(reglas(e)).toEqual(['M7']);
  });

  it('M7: ficha inexistente', () => {
    const e = base();
    fila(e, 3).titulo = fila(e, 3).titulo.replace('FT-09', 'FT-99');
    expect(reglas(e)).toEqual(['M7']);
  });

  it('M7: referencia con formato desconocido', () => {
    const e = base();
    fila(e, 0).titulo = fila(e, 0).titulo.replace('CA-30.4,', 'CA-30,');
    expect(reglas(e)).toEqual(['M7']);
  });

  it('M7: FORM-<operacion> se acepta [CH-37]; FORM-, form-registrar y FORM-Registrar no', () => {
    expect(REF.test('FORM-pagar_tarjeta')).toBe(true);
    for (const mal of ['FORM-', 'form-registrar', 'FORM-Registrar'])
      expect(REF.test(mal)).toBe(false);
  });

  it('M7: Q-<consulta> se acepta [CH-34]; Q-, q-inicio y Q-1 no', () => {
    expect(REF.test('Q-inicio')).toBe(true);
    expect(REF.test('Q-detalleLpa')).toBe(true);
    for (const mal of ['Q-', 'q-inicio', 'Q-1', 'Q-inicio2']) expect(REF.test(mal)).toBe(false);
  });

  it('M8: identificador mal formado, nivel o área desconocidos', () => {
    for (const mal of [
      'PRU-INT-TARJ-4 [CA-30.4] x',
      'PRU-XXX-TARJ-001 [CA-30.4] x',
      'PRU-INT-NADA-001 [CA-30.4] x',
    ]) {
      const e = base();
      fila(e, 0).titulo = mal;
      expect(reglas(e)).toEqual(['M8']);
    }
  });

  it('M8: identificador repetido en otro archivo', () => {
    const e = base();
    e.inventario.push({
      ...fila(e, 0),
      archivo: 'packages/aplicacion/test/otra.int.test.ts',
    });
    expect(reglas(e)).toEqual(['M8']);
  });

  it('M8: nivel que no corresponde al archivo (INT en un .e2e.ts)', () => {
    const e = base();
    fila(e, 0).archivo = 'apps/web/e2e/x.e2e.ts';
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
    expect(reglas(e)).toContain('M13');
  });

  it('M13: FT-49 (diferida) fuera de pendiente', () => {
    const e = base();
    e.features['FT-49'] = 'terminada';
    expect(reglas(e)).toContain('M13');
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
    expect(p[0]?.archivo).toBe('apps/web/e2e/pres.e2e.ts');
  });

  // Corridas 41143522674 y 41143549746: sin Chromium, `vitest list` sale con 0 y solo imprime FC_SEED
  const SEMILLA = 'FC_SEED=1 (reproducir: FC_SEED=1 pnpm test:unidad -t <id>)\n';

  it('sale con 0 y sin JSON: falla diciéndolo, con su stdout y su stderr', () => {
    const s = { status: 0, stdout: SEMILLA, stderr: "Executable doesn't exist at /x/chrome" };
    expect(() => listaDeVitest(s)).toThrow(/no dio JSON/);
    expect(() => listaDeVitest(s)).toThrow(/FC_SEED=1/);
    expect(() => listaDeVitest(s)).toThrow(/Executable doesn't exist/);
    expect(() => listaDeVitest(s)).not.toThrow(/Unexpected end/);
  });

  it('JSON truncado o que no es una lista: falla con el mismo mensaje', () => {
    for (const stdout of [`${SEMILLA}[{"name":"a"`, `${SEMILLA}{"name":"a"}`])
      expect(() => listaDeVitest({ status: 0, stdout, stderr: '' })).toThrow(/no dio JSON/);
  });

  it('código distinto de 0: falla con el código, aunque stdout traiga JSON', () => {
    const s = { status: 1, stdout: '[]', stderr: 'ReferenceError: document is not defined' };
    expect(() => listaDeVitest(s)).toThrow(/terminó con 1/);
    expect(() => listaDeVitest(s)).toThrow(/document is not defined/);
  });

  it('errores sin manejar al recolectar: falla aunque salga con 0 y dé una lista parcial', () => {
    const s = {
      status: 0,
      stdout: '[]',
      stderr: 'There were unhandled errors during test collection',
    };
    expect(() => listaDeVitest(s)).toThrow(/errores sin manejar/);
  });

  it('salida correcta: quita las líneas previas al JSON y la lista llega a deVitest', () => {
    const lista = JSON.stringify([{ name: 'PRU-X-1 y', file: '/r/a.cmp.test.tsx' }]);
    const json = listaDeVitest({ status: 0, stdout: SEMILLA + lista, stderr: '' });
    expect(deVitest(json, '/r')).toEqual([{ titulo: 'PRU-X-1 y', archivo: 'a.cmp.test.tsx' }]);
  });

  // TA-222 y TA-204: Vite avisa antes del JSON, con códigos de color que traen un `[`, o con `[vite]` al inicio
  it.each([
    ['con color', '\u001b[2m12:00:00\u001b[22m \u001b[36m[vite]\u001b[39m Re-optimizing dependencies\n'],
    ['sin color, con [ al inicio de la línea', '[vite] Re-optimizing dependencies\n'],
  ])('una línea de Vite delante del JSON (%s) no rompe la lista', (_caso, linea) => {
    const lista = JSON.stringify([{ name: 'PRU-X-1 y', file: '/r/a.cmp.test.tsx' }]);
    const json = listaDeVitest({ status: 0, stdout: SEMILLA + linea + lista, stderr: '' });
    expect(deVitest(json, '/r')).toEqual([{ titulo: 'PRU-X-1 y', archivo: 'a.cmp.test.tsx' }]);
  });

  it('solo la línea de Vite, sin JSON: falla con mensaje claro', () => {
    const stdout = '\u001b[36m[vite]\u001b[39m Re-optimizing dependencies\n[vite] listo\n';
    expect(() => listaDeVitest({ status: 0, stdout, stderr: '' })).toThrow(/no dio JSON/);
  });
});

// ---------------------------------------------------------------- cobertura completa sintética (V7-09, V7-11)
const ARCHIVO: Record<string, string> = {
  INT: 'packages/aplicacion/test/tx.int.test.ts',
  E2E: 'apps/web/e2e/tx.e2e.ts',
  CMP: 'apps/web/src/componentes/tx.cmp.test.tsx',
  RH: 'apps/web/src/app/api/tx.rh.test.ts',
  DOM: 'packages/dominio/src/tx.test.ts',
  PROP: 'packages/dominio/src/tx.prop.test.ts',
};
const idDe = (titulo: string): string => titulo.split(' > ').pop()?.split(' ')[0] ?? '';
const RESULTADOS_ENCABEZADO =
  '| Manual | Fecha | Dispositivo | Resultado | Quién | Versión | Nota |\n|---|---|---|---|---|---|---|\n';
function completo(): Entradas {
  const e = base();
  const obj = objetivos(e);
  const n: Record<string, number> = {};
  const nuevo = (nivel: string): string => {
    n[nivel] = (n[nivel] ?? 0) + 1;
    return `PRU-${nivel}-TX-${String(n[nivel]).padStart(3, '0')}`;
  };
  const poner = (nivel: string, ref: string): string => {
    const id = nuevo(nivel);
    e.inventario.push({ titulo: `${id} [${ref}] sintético`, archivo: ARCHIVO[nivel] ?? '' });
    return id;
  };
  const niveles = ['INT', 'E2E', 'CMP', 'RH', 'DOM'];
  e.inventario = [];
  obj.filter((o) => o.tipo === 'CA').forEach((o, k) => poner(niveles[k % 5] ?? 'INT', o.id));
  for (const o of obj.filter((x) => x.tipo === 'ESC'))
    for (const ej of ['motor', 'int'])
      e.inventario.push({
        titulo: `PRU-ESC-${o.id.slice(4)}@${ej} [${o.id}] sintético`,
        archivo:
          ej === 'int'
            ? 'packages/aplicacion/test/esc.int.test.ts'
            : 'packages/dominio/escenarios/x.ts',
      });
  for (const o of obj) {
    if (o.tipo === 'AV' || o.tipo === 'CB') poner('DOM', o.id);
    if (o.tipo === 'INV') poner('PROP', o.id);
    if (o.tipo === 'REC') poner('E2E', o.id);
  }
  const previas: Previa[] = [];
  obj
    .filter((o) => o.tipo === 'VER')
    .forEach((o, k) =>
      previas.push(
        k % 8 === 0
          ? { id: o.id, motivo: 'solo existe en el proyecto real, queda en humo' }
          : { id: o.id, destino: poner('INT', o.id) },
      ),
    );
  e.previas = previas;
  const conManual = obj.filter((o) => o.tipo === 'CA' && (o.manual || o.advertencia));
  const idMan = (k: number): string => `PRU-MAN-TX-${String(k + 1).padStart(3, '0')}`;
  e.manuales = conManual
    .map(
      (o, k) =>
        `### ${idMan(k)} [${o.id}] procedimiento\n\n**Disparador:** antes de terminar ${o.ft}.\n\n**Pasos:**\n1. Hacer.\n\n**Resultado esperado:** lo del CA.\n`,
    )
    .join('\n');
  // Cada manual con un resultado "pasa" registrado por el usuario (M16, 07 §22.2)
  e.resultadosManuales =
    RESULTADOS_ENCABEZADO +
    conManual
      .map((_, k) => `| ${idMan(k)} | 2027-02-20 | Android 15 | pasa | Andrés | a1b2c3d | |`)
      .join('\n');
  for (const f of fichas(e.d06)) e.features[f.ft] = f.diferida ? 'pendiente' : 'terminada';
  e.puerta = true;
  return e;
}
const quitar = (e: Entradas, ref: string): void => {
  e.inventario = e.inventario.filter((p) => !p.titulo.includes(`[${ref}]`));
};
const primera = (e: Entradas, ref: string): { titulo: string; archivo: string } => {
  const p = e.inventario.find((x) => x.titulo.includes(`[${ref}]`));
  if (!p) throw new Error('sin ' + ref);
  return p;
};
const quitarManual = (e: Entradas, ref: string): void => {
  e.manuales = e.manuales.replace(
    new RegExp(`### PRU-MAN-\\S+ \\[${ref}\\][\\s\\S]*?(?=### |$)`),
    '',
  );
};

const vigente = (id: string) => ({
  id,
  motivo: 'inestable',
  desde: '2027-02-25',
  vence: '2027-03-11',
});
/** Resultados de una corrida en la que todas las pruebas automáticas pasaron. */
const verdes = (e: Entradas): Record<string, 'pasada' | 'fallida' | 'omitida'> =>
  Object.fromEntries(e.inventario.map((p) => [idDe(p.titulo), 'pasada' as const]));
const manualDe = (e: Entradas, ca: string): string => {
  const m = e.manuales.match(new RegExp(`### (PRU-MAN-\\S+) \\[${ca}\\]`));
  if (!m?.[1]) throw new Error('sin manual de ' + ca);
  return m[1];
};

describe('matriz: mutaciones de la cobertura (V7-09, V7-11)', () => {
  it('la base completa pasa en modo puerta', () => {
    expect(verificar(completo()).errores).toEqual([]);
  });

  const mutaciones: [string, string, (e: Entradas) => void][] = [
    [
      'M1',
      'quitar la prueba de CA-30.4',
      (e) => {
        quitar(e, 'CA-30.4');
      },
    ],
    [
      'M1',
      'quitar la PRU-MAN de CA-02.5 (manual)',
      (e) => {
        quitarManual(e, 'CA-02.5');
      },
    ],
    [
      'M2',
      'quitar PRU-ESC-17@int',
      (e) => {
        e.inventario = e.inventario.filter((p) => !p.titulo.startsWith('PRU-ESC-17@int'));
      },
    ],
    [
      'M3',
      'quitar la prueba de AV-24',
      (e) => {
        quitar(e, 'AV-24');
      },
    ],
    [
      'M4',
      'quitar la prueba de INV-28',
      (e) => {
        quitar(e, 'INV-28');
      },
    ],
    [
      'M5',
      'quitar la E2E de REC-4.6',
      (e) => {
        quitar(e, 'REC-4.6');
      },
    ],
    [
      'M6',
      'quitar V5-12 de verificaciones-previas.json',
      (e) => {
        e.previas = (e.previas ?? []).filter((v) => v.id !== 'V5-12');
      },
    ],
    [
      'M6',
      'destino que no existe',
      (e) => {
        const v = (e.previas ?? []).find((x) => x.destino);
        if (v) v.destino = 'PRU-INT-TX-999';
      },
    ],
    [
      'M6',
      'sin destino ni motivo',
      (e) => {
        const v = (e.previas ?? []).find((x) => x.motivo);
        if (v) v.motivo = 'no';
      },
    ],
    [
      'M9',
      'cuarentena vencida',
      (e) => {
        e.cuarentena.push({
          id: idDe(primera(e, 'CA-30.4').titulo),
          motivo: 'inestable',
          desde: '2027-02-01',
          vence: '2027-02-15',
        });
      },
    ],
    [
      'M9',
      'cuarentena que cita una prueba inexistente',
      (e) => {
        e.cuarentena.push({
          id: 'PRU-E2E-TX-999',
          motivo: 'x',
          desde: '2027-02-25',
          vence: '2027-03-11',
        });
      },
    ],
    [
      'M10',
      'PRU-MAN sin pasos',
      (e) => {
        e.manuales = e.manuales.replace('**Pasos:**\n1. Hacer.', '**Pasos:**\n');
      },
    ],
    [
      'M11',
      'quitar la PRU-MAN de CA-34.14 ⚠ (S6-1)',
      (e) => {
        quitarManual(e, 'CA-34.14');
      },
    ],
    [
      'M14',
      'quitar la prueba de CB-21',
      (e) => {
        quitar(e, 'CB-21');
      },
    ],
    [
      'M15',
      'FT-30 terminada con una prueba en cuarentena (vigente)',
      (e) => {
        // Otra prueba cubre CA-30.4, así que M1 no salta: solo M15
        e.inventario.push({
          titulo: 'PRU-INT-TX-900 [CA-30.4] otra',
          archivo: 'packages/aplicacion/test/tx.int.test.ts',
        });
        e.cuarentena.push(vigente(idDe(primera(e, 'CA-30.4').titulo)));
      },
    ],
    [
      'M15',
      'FT-30 terminada con una prueba fallida en la corrida',
      (e) => {
        e.resultados = verdes(e);
        e.resultados[idDe(primera(e, 'CA-30.4').titulo)] = 'fallida';
      },
    ],
    [
      'M16',
      'FT-02 sin resultado del manual de CA-02.5',
      (e) => {
        const m = manualDe(e, 'CA-02.5');
        e.resultadosManuales = e.resultadosManuales
          .split('\n')
          .filter((l) => !l.includes(m))
          .join('\n');
      },
    ],
    [
      'M16',
      'manual que falló después de pasar',
      (e) => {
        e.resultadosManuales += `\n| ${manualDe(e, 'CA-02.5')} | 2027-02-28 | Android 15 | falla | Andrés | def5678 | |`;
      },
    ],
    [
      'M16',
      'fila de resultado sin dispositivo',
      (e) => {
        e.resultadosManuales += `\n| ${manualDe(e, 'CA-02.5')} | 2027-02-28 |  | pasa | Andrés | def5678 | |`;
      },
    ],
    [
      'M16',
      'resultado de un manual que no existe',
      (e) => {
        e.resultadosManuales +=
          '\n| PRU-MAN-TX-999 | 2027-02-28 | Android 15 | pasa | Andrés | def5678 | |';
      },
    ],
  ];
  for (const [regla, que, mutar] of mutaciones)
    it(`${regla}: ${que}`, () => {
      const e = completo();
      mutar(e);
      expect(reglas(e)).toContain(regla);
    });

  it('M9: una prueba en cuarentena vigente no cuenta como cobertura', () => {
    const e = completo();
    e.cuarentena.push({
      id: idDe(primera(e, 'CA-30.4').titulo),
      motivo: 'inestable',
      desde: '2027-02-25',
      vence: '2027-03-11',
    });
    // FT-30 está terminada: además, M15 (TA-009) no la deja terminada con esa prueba en cuarentena
    expect(verificar(e).errores).toEqual([
      'M1 CA-30.4 (FT-30 [I]) sin prueba activa ni procedimiento manual',
      `M15 FT-30 está terminada y ${idDe(primera(e, 'CA-30.4').titulo)} está en cuarentena`,
    ]);
  });

  it('M11: un CA ⚠ sin S6-1 y sin PRU-MAN es solo un aviso', () => {
    const e = completo();
    const ca = objetivos(e).find((o) => o.tipo === 'CA' && o.advertencia && !o.s61 && !o.manual);
    if (!ca) throw new Error('sin CA ⚠');
    quitarManual(e, ca.id);
    const r = verificar(e);
    expect(r.errores.filter((x) => x.startsWith('M11'))).toEqual([]);
    expect(r.avisos.some((a) => a.startsWith(`M11 ${ca.id}`))).toBe(true);
  });
});

describe('matriz: modos incremental y puerta (07 §13.4)', () => {
  it('incremental sin fichas: pasa aunque no haya pruebas ni verificaciones previas', () => {
    const e = { ...base(), puerta: false, features: {} };
    expect(verificar(e).errores).toEqual([]);
  });

  it('incremental: solo se exige lo de la ficha terminada (FT-30 sin sus pruebas)', () => {
    const e = completo();
    e.puerta = false;
    e.features = { 'FT-30': 'terminada' };
    e.inventario = e.inventario.filter((p) => !/\[CA-30\./.test(p.titulo));
    const errores = verificar(e).errores;
    expect(errores).toHaveLength(7);
    expect(errores.every((x) => x.startsWith('M1 ') && x.includes('FT-30'))).toBe(true);
  });

  it('incremental: los CA de una ficha en_curso sin prueba son avisos', () => {
    const r = verificar({ ...base(), inventario: [], features: { 'FT-30': 'en_curso' } });
    expect(r.errores).toEqual([]);
    expect(r.avisos.filter((a) => a.startsWith('M1 '))).toHaveLength(7);
  });

  it('--puerta sin pruebas falla exactamente con los objetivos de 07 §13.1', () => {
    const e = { ...base(), inventario: [], puerta: true };
    const r = verificar(e);
    const c = recuento(e);
    const por = (regla: string): string[] => r.errores.filter((x) => x.startsWith(regla + ' '));
    expect(por('M1')).toHaveLength(c.ca.I + c.ca.M); // 465
    expect(por('M4')).toHaveLength(c.invariantes);
    expect(por('M14')).toHaveLength(c.casosBorde);
    expect(por('M5')).toHaveLength(c.recorridos);
    expect(por('M6')).toHaveLength(c.verificacionesPrevias);
    const fs = fichas(e.d06).filter((f) => f.prioridad !== 'P' && !f.diferida);
    expect(por('M2')).toHaveLength(new Set(fs.flatMap((f) => f.esc)).size);
    expect(por('M3')).toHaveLength(new Set(fs.flatMap((f) => f.av)).size);
    expect(r.errores.filter((x) => !/^(M1|M2|M3|M4|M5|M6|M11|M14) /.test(x))).toEqual([]);
  });
});

describe('matriz: M15 y M16, cierre de fichas y manuales pendientes (P7-18, V7-11)', () => {
  it('M15: con todas las pruebas en verde en la corrida, la base completa pasa', () => {
    const e = completo();
    e.resultados = verdes(e);
    expect(verificar(e).errores).toEqual([]);
  });

  it('M15: una prueba sin resultado en la corrida falla', () => {
    const e = completo();
    const id = idDe(primera(e, 'CA-30.4').titulo);
    e.resultados = Object.fromEntries(Object.entries(verdes(e)).filter(([k]) => k !== id));
    expect(verificar(e).errores).toEqual([
      `M15 FT-30 está terminada y ${id} no pasó en esta corrida (sin resultado)`,
    ]);
  });

  it('M15: una ficha en_curso no se mira', () => {
    const e = completo();
    e.features['FT-30'] = 'en_curso';
    e.puerta = false;
    e.resultados = verdes(e);
    e.resultados[idDe(primera(e, 'CA-30.4').titulo)] = 'fallida';
    expect(verificar(e).errores.filter((x) => x.startsWith('M15'))).toEqual([]);
  });

  it('M16: incremental sin resultados manuales da avisos y 0 errores; en modo puerta, la puerta queda cerrada', () => {
    const e = completo();
    e.resultadosManuales = '';
    e.puerta = false;
    const r = verificar(e);
    expect(r.errores).toEqual([]);
    const avisos = r.avisos.filter((a) => a.startsWith('M16 '));
    expect(avisos.length).toBeGreaterThan(0);
    expect(avisos.length).toBe(r.manualesPendientes.size);
    expect(informe(r).puertaAbierta).toBe(false);
    e.puerta = true;
    const p = verificar(e);
    expect(p.errores.filter((x) => x.startsWith('M16 '))).toHaveLength(avisos.length);
    const i = informe(p);
    expect(i.puertaAbierta).toBe(false);
    expect(i.fichasConManualPendiente.length).toBeGreaterThan(0);
    expect(i.filas.find((f) => f.ft === 'FT-02')?.estado).toBe('manual pendiente');
  });

  it('M16: vale el último resultado (una falla posterior reabre; un pasa posterior cierra)', () => {
    const e = completo();
    const m = manualDe(e, 'CA-02.5');
    e.resultadosManuales += `\n| ${m} | 2027-02-28 | Android 15 | falla | Andrés | def5678 | |`;
    expect(verificar(e).errores).toEqual([
      `M16 FT-02 con manual pendiente: ${m} (falló el 2027-02-28)`,
    ]);
    e.resultadosManuales += `\n| ${m} | 2027-02-28 | Android 15 | pasa | Andrés | def5679 | reintento |`;
    expect(verificar(e).errores).toEqual([]);
  });

  it('M16: la base completa con todos los manuales en "pasa" deja la puerta abierta', () => {
    const i = informe(verificar(completo()));
    expect(i.fichasConManualPendiente).toEqual([]);
    expect(i.puertaAbierta).toBe(true);
  });

  it('M15: lee los informes JSON de Vitest y de Playwright de --resultados', () => {
    const dir = mkdtempSync(join(tmpdir(), 'finn-resultados-'));
    try {
      writeFileSync(
        join(dir, 'vitest.json'),
        JSON.stringify({
          testResults: [
            {
              assertionResults: [
                {
                  fullName: 'PRU-INT-TX > PRU-INT-TX-001 [CA-30.4] a',
                  title: 'x',
                  status: 'passed',
                },
                { fullName: 'PRU-INT-TX-002 [CA-30.5] b', title: 'x', status: 'failed' },
                { fullName: 'PRU-INT-TX-003 [CA-30.6] c', title: 'x', status: 'skipped' },
                { fullName: 'sin identificador', title: 'x', status: 'passed' },
              ],
            },
          ],
        }),
      );
      writeFileSync(
        join(dir, 'playwright.json'),
        JSON.stringify({
          suites: [
            {
              specs: [
                { title: 'PRU-E2E-TX-001 [CA-30.4] e', ok: true, tests: [{ status: 'flaky' }] },
              ],
              suites: [
                {
                  specs: [
                    {
                      title: 'PRU-E2E-TX-002 [CA-30.5] f',
                      ok: false,
                      tests: [{ status: 'unexpected' }],
                    },
                    // la misma prueba en otro navegador: basta una que falle
                    {
                      title: 'PRU-INT-TX-001 [CA-30.4] a',
                      ok: false,
                      tests: [{ status: 'unexpected' }],
                    },
                  ],
                },
              ],
            },
          ],
        }),
      );
      writeFileSync(join(dir, 'leeme.txt'), 'no es JSON');
      expect(resultadosCorrida(dir)).toEqual({
        'PRU-INT-TX-001': 'fallida',
        'PRU-INT-TX-002': 'fallida',
        'PRU-INT-TX-003': 'omitida',
        'PRU-E2E-TX-001': 'pasada',
        'PRU-E2E-TX-002': 'fallida',
      });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('afectadas (07 §13.6, DP-19, CH-01)', () => {
  const e = completo();
  e.puerta = false;
  e.mapa = [
    { patron: 'apps/web/src/app/(finn)/layout.tsx', fts: 'marco' },
    { patron: 'apps/web/src/componentes/monto.tsx', fts: ['FT-29'] },
    { patron: 'packages/dominio/src/**', fts: [] },
  ];
  const r = verificar(e);
  const quien = (...archivos: string[]) => afectadas(e, r, archivos);

  it('punto 1: una operación se resuelve por OP-nn-*.ts, en cualquier subcarpeta', () => {
    const a = quien('packages/aplicacion/src/operaciones/tarjetas/OP-23-pagar-tarjeta.ts');
    expect(a.fts).toContain('FT-30');
    expect(a.todo).toBe(false);
    expect(a.grepE2E).toMatch(/PRU-E2E-TX-/);
  });

  it('punto 1: una consulta se resuelve por consultas/<pantalla>.ts', () => {
    expect(quien('packages/aplicacion/src/consultas/detalleCategoria.ts').fts).toContain('FT-14');
    expect(piezas(e.d06).find((p) => p.ft === 'FT-30')?.consultas).toContain('formulario');
  });

  it('punto 1: una ruta toma la ficha más específica', () => {
    expect(
      fichasPorPiezas('apps/web/src/app/(finn)/cuentas/[cuentaId]/pagar/page.tsx', piezas(e.d06)),
    ).toContain('FT-30');
  });

  it('punto 2: lo demás va por el mapa de código', () => {
    expect(quien('apps/web/src/componentes/monto.tsx').fts).toEqual(['FT-29']);
  });

  it('punto 3: marco corre la suite E2E completa', () => {
    const a = quien('apps/web/src/app/(finn)/layout.tsx');
    expect(a.todo).toBe(true);
    expect(a.grepE2E).toBeNull();
  });

  it('dominio y db no disparan E2E por sí mismos', () => {
    const a = quien('packages/dominio/src/periodos.ts');
    expect(a).toMatchObject({ todo: false, fts: [], grepE2E: '^$', total: 0 });
  });

  it('punto 4: las pruebas de un archivo de prueba cambiado se agregan siempre', () => {
    const a = quien('packages/dominio/src/tx.test.ts');
    expect(a.total).toBeGreaterThan(0);
    expect(a.comandos[0]).toContain('pnpm test:unidad -t');
  });
});

describe('inventario vigente (la matriz no pasa en silencio sin inventario)', () => {
  const conRaiz = (f: (raiz: string) => void): void => {
    const raiz = mkdtempSync(join(tmpdir(), 'finn-inv-'));
    try {
      mkdirSync(join(raiz, 'packages/a/src'), { recursive: true });
      mkdirSync(join(raiz, 'pruebas'), { recursive: true });
      f(raiz);
    } finally {
      rmSync(raiz, { recursive: true, force: true });
    }
  };

  it('sin pruebas/inventario.json falla y dice que hay que correr pruebas:listar', () => {
    conRaiz((raiz) => {
      expect(inventarioVencido(raiz)).toMatch(/no existe .*inventario\.json.*pruebas:listar/);
    });
  });

  it('con un archivo de prueba más nuevo que el inventario falla; regenerado, pasa', () => {
    conRaiz((raiz) => {
      const inv = join(raiz, 'pruebas/inventario.json');
      const prueba = join(raiz, 'packages/a/src/a.test.ts');
      writeFileSync(inv, '[]');
      writeFileSync(prueba, '');
      utimesSync(inv, 1_000, 1_000);
      utimesSync(prueba, 2_000, 2_000);
      expect(inventarioVencido(raiz)).toMatch(/vencido.*a\.test\.ts.*pruebas:listar/);
      utimesSync(inv, 3_000, 3_000);
      expect(inventarioVencido(raiz)).toBeNull();
    });
  });
});
