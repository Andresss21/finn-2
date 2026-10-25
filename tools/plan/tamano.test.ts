// Pruebas de tools/plan/tamano.ts (TA-010): clasificación de 08 §1.1, límites de DT-01, portados (DT-14) y DT-15.
import { describe, expect, it } from 'vitest';
import {
  clasificar,
  excepcionesDe,
  fuentesDeAnexos,
  fuentesDeBloques,
  huella,
  leerNumstat,
  medir,
} from './tamano.ts';
import type { Archivo } from './tamano.ts';

const a = (ruta: string, agregadas: number, extra: Partial<Archivo> = {}): Archivo => ({
  ruta,
  agregadas,
  borradas: 0,
  nuevo: true,
  ...extra,
});
const ficha = { id: 'TA-999', cubre: [], excepcion: '' };
const sinFuentes = { fuentes: [], excepciones: {} };

describe('tamano: clasificación de 08 §1.1', () => {
  it.each([
    ['packages/dominio/src/calculo/saldo.test.ts', 'prueba'],
    ['packages/dominio/src/x.prop.test.ts', 'prueba'],
    ['packages/aplicacion/src/x.ctr.test.ts', 'prueba'],
    ['packages/aplicacion/test/x.int.test.ts', 'prueba'],
    ['apps/web/src/app/api/x.rh.test.ts', 'prueba'],
    ['apps/web/src/componentes/x.cmp.test.tsx', 'prueba'],
    ['apps/web/e2e/inicio.e2e.ts', 'prueba'],
    ['packages/dominio/src/motor.bench.ts', 'prueba'],
    ['tools/respaldo/test/ayuda.ts', 'prueba'],
    ['apps/web/pruebas/ayuda.ts', 'prueba'],
    ['tools/pruebas/test/anonimizar.test.ts', 'prueba'],
    ['tools/pruebas/firmas.sh', 'prueba'],
    ['tools/lint/controles/paquetes/x.ts', 'prueba'],
    ['packages/dominio/escenarios/datos/esc-01.ts', 'dato'],
    ['packages/sms/src/__datos__/bac.ts', 'dato'],
    ['packages/conciliacion/muestras/bac.txt', 'dato'],
    ['pruebas/features.json', 'dato'],
    ['pruebas/manuales.md', 'dato'],
    ['plan/tareas.json', 'dato'],
    ['docs/07-pruebas.md', 'dato'],
    ['README.md', 'dato'],
    ['pnpm-lock.yaml', 'generado'],
    ['packages/db/src/generado/cliente.ts', 'generado'],
    ['packages/db/prisma/catalogo-esperado.txt', 'generado'],
    ['pruebas/inventario.json', 'generado'],
    ['tools/pruebas/matriz.ts', 'produccion'],
    ['tools/plan/tamano.ts', 'produccion'],
    ['packages/db/prisma/migrations/20270101_m_x/migration.sql', 'produccion'],
    ['.github/workflows/ci.yml', 'produccion'],
    ['package.json', 'produccion'],
  ])('%s es %s', (ruta, clase) => {
    expect(clasificar(ruta)).toBe(clase);
  });
});

describe('tamano: numstat', () => {
  it('lee líneas, binarios y renombrados', () => {
    const t = '10\t2\ttools/plan/x.ts\n-\t-\tdocs/a.png\n3\t1\ttools/{viejo => nuevo}/y.ts\n';
    expect(leerNumstat(t)).toEqual([
      { ruta: 'tools/plan/x.ts', agregadas: 10, borradas: 2 },
      { ruta: 'docs/a.png', agregadas: 0, borradas: 0 },
      { ruta: 'tools/nuevo/y.ts', agregadas: 3, borradas: 1 },
    ]);
  });
});

describe('tamano: límites de DT-01', () => {
  it('400 líneas de producción pasan y 401 se rechazan', () => {
    expect(medir([a('tools/plan/x.ts', 400)], ficha, sinFuentes).errores).toEqual([]);
    const m = medir([a('tools/plan/x.ts', 300, { borradas: 101 })], ficha, sinFuentes);
    expect(m.prod).toBe(401);
    expect(m.errores).toEqual(['DT-01 producción 401 > 400 líneas']);
  });

  it('cuenta archivos, total sin generados, CA y migraciones nuevas', () => {
    const arch = [
      ...Array.from({ length: 13 }, (_, i) => a(`tools/x${i}.ts`, 1)),
      a('tools/x.test.ts', 1000),
      a('pnpm-lock.yaml', 5000),
      a('packages/db/prisma/migrations/1_m_a/migration.sql', 1),
      a('packages/db/prisma/migrations/2_m_b/migration.sql', 1),
      a('packages/db/prisma/migrations/0_viejo/migration.sql', 1, { nuevo: false }),
    ];
    const cubre = Array.from({ length: 11 }, (_, i) => `CA-01.${i + 1}`).concat('DT-01');
    const m = medir(arch, { ...ficha, cubre }, sinFuentes);
    expect([m.prod, m.archivos, m.ca, m.migraciones, m.total]).toEqual([16, 16, 11, 2, 1016]);
    expect(m.errores).toEqual([
      'DT-01 archivos de producción 16 > 12',
      'DT-01 CA 11 > 10',
      'DT-01 migraciones nuevas 2 > 1',
    ]);
  });

  it('el total pasa de 1.200 con pruebas y datos', () => {
    const m = medir([a('x.test.ts', 700), a('docs/a.md', 501)], ficha, sinFuentes);
    expect(m.errores).toEqual(['DT-01 total 1201 > 1200 líneas']);
  });
});

describe('tamano: portado (DT-14)', () => {
  const contenido = 'CREATE TABLE x ();\n';
  const anexos = fuentesDeAnexos(
    `100644 blob ${huella(contenido)}\tdocs/anexos/fase3/migraciones/1_m_a/migration.sql\n` +
      `100644 blob ${huella('otro\n')}\tdocs/anexos/fase3/schema.prisma\n`,
  );
  const ruta = 'packages/db/prisma/migrations/1_m_a/migration.sql';

  it('un archivo idéntico a su fuente de docs/anexos/ no cuenta', () => {
    const m = medir([a(ruta, 300, { blob: huella(contenido) })], ficha, {
      fuentes: anexos,
      excepciones: {},
    });
    expect([m.prod, m.archivos, m.total, m.migraciones]).toEqual([0, 0, 0, 1]);
    expect(m.portados).toEqual([
      {
        ruta,
        fuente: 'docs/anexos/fase3/migraciones/1_m_a/migration.sql',
        huella: huella(contenido),
      },
    ]);
  });

  it('una línea distinta lo vuelve producción', () => {
    const m = medir([a(ruta, 300, { blob: huella('CREATE TABLE y ();\n') })], ficha, {
      fuentes: anexos,
      excepciones: {},
    });
    expect([m.prod, m.archivos, m.total]).toEqual([300, 1, 300]);
    expect(m.portados).toEqual([]);
  });

  it('la fuente tiene que ser el mismo archivo, no otro con el mismo contenido', () => {
    const m = medir([a('tools/otro.sql', 1, { blob: huella(contenido) })], ficha, {
      fuentes: anexos,
      excepciones: {},
    });
    expect(m.prod).toBe(1);
  });

  it('un bloque de código de docs/ cuya sección nombra la ruta es fuente', () => {
    const doc = [
      '# 03',
      '### 10.4.1 `tools/db/bootstrap.sql`',
      '```sql',
      'CREATE ROLE finn;',
      '```',
      '### 10.5 Otra',
      '```sql',
      'SELECT 1;',
      '```',
      '',
    ].join('\n');
    const f = fuentesDeBloques([{ nombre: 'docs/03-base-de-datos.md', texto: doc }]);
    const ok = medir(
      [a('tools/db/bootstrap.sql', 1, { blob: huella('CREATE ROLE finn;\n') })],
      ficha,
      {
        fuentes: f,
        excepciones: {},
      },
    );
    expect(ok.portados[0]?.fuente).toBe(
      'docs/03-base-de-datos.md § 10.4.1 `tools/db/bootstrap.sql`',
    );
    const otra = medir([a('tools/db/bootstrap.sql', 1, { blob: huella('SELECT 1;\n') })], ficha, {
      fuentes: f,
      excepciones: {},
    });
    expect(otra.portados).toEqual([]);
  });

  it('un archivo de docs/anexos/ no es fuente de sí mismo', () => {
    const r = 'docs/anexos/fase3/schema.prisma';
    const m = medir([a(r, 10, { blob: huella('otro\n') })], ficha, {
      fuentes: anexos,
      excepciones: {},
    });
    expect(m.total).toBe(10);
  });
});

describe('tamano: excepción DT-15', () => {
  const tabla = excepcionesDe(
    "const EXCEPCIONES = {\n  'DT-15': { tareas: ['TA-051'], medida: 'migraciones', maximo: 8 },\n};",
  );
  const ocho = Array.from({ length: 8 }, (_, i) =>
    a(`packages/db/prisma/migrations/${i}_m/migration.sql`, 1),
  );

  it('lee la tabla EXCEPCIONES de verificar.ts', () => {
    expect(tabla).toEqual({ 'DT-15': { tareas: ['TA-051'], medida: 'migraciones', maximo: 8 } });
  });

  it('TA-051 puede traer 8 migraciones', () => {
    const f = { id: 'TA-051', cubre: [], excepcion: 'DT-15 migraciones=8' };
    expect(medir(ocho, f, { fuentes: [], excepciones: tabla }).errores).toEqual([]);
  });

  it('otra tarea que la declara es un error', () => {
    const f = { id: 'TA-052', cubre: [], excepcion: 'DT-15 migraciones=8' };
    expect(medir(ocho, f, { fuentes: [], excepciones: tabla }).errores).toEqual([
      'DT-15 la excepción no está aprobada para TA-052',
      'DT-01 migraciones nuevas 8 > 1',
    ]);
  });
});
