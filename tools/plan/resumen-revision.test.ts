// Pruebas de tools/plan/resumen-revision.ts (TA-014): patrones de "Archivos", títulos del diff y dependencias.
import { describe, expect, it } from 'vitest';
import { depsNuevas, patrones, pruebasDelDiff } from './resumen-revision.ts';
import { areaCritica } from './tamano.ts';

describe('resumen-revision: patrones del campo Archivos', () => {
  const ps = patrones(
    'Raíz (`package.json`), `tools/plan/{mergear,tamano}.ts`, `packages/config/**`, `packages/*/package.json`.',
  );
  const vale = (r: string): boolean => ps.some((p) => p.test(r));

  it.each([
    ['package.json', true],
    ['tools/plan/mergear.ts', true],
    ['tools/plan/tamano.ts', true],
    ['tools/plan/estado.ts', false],
    ['packages/config/eslint/web.mjs', true],
    ['packages/db/package.json', true],
    ['packages/db/src/package.json', false],
  ])('%s → %s', (ruta, esperado) => {
    expect(vale(ruta)).toBe(esperado);
  });
});

describe('resumen-revision: pruebas del diff', () => {
  it('una línea quitada de SQL que empieza con -- no se confunde con el encabezado', () => {
    const texto = "it('PRU-INT-DB-001 [MIG-01] crea', () => {\n-- x 2\n});\n";
    const diff = '--- a/t.int.test.ts\n+++ b/t.int.test.ts\n@@ -2 +2 @@\n--- x 1\n+-- x 2\n';
    const p = pruebasDelDiff(diff, () => texto, new Set());
    expect(p).toEqual([
      {
        id: 'PRU-INT-DB-001',
        cubre: ['MIG-01'],
        titulo: 'crea',
        archivo: 't.int.test.ts',
        nueva: false,
        numero: true,
      },
    ]);
  });
});

describe('resumen-revision: dependencias npm nuevas', () => {
  it('compara las cuatro listas de dependencias', () => {
    const base = '{"dependencies":{"a":"1"}}';
    const cab = '{"dependencies":{"a":"2"},"peerDependencies":{"b":"1"},"scripts":{"c":"x"}}';
    expect(depsNuevas(base, cab)).toEqual(['b']);
    expect(depsNuevas('', '{"devDependencies":{"d":"1"}}')).toEqual(['d']);
  });
});

describe('resumen-revision: DT-20 en tamano.ts', () => {
  it.each([
    ['packages/dominio/src/calculo/saldo.ts', 'produccion', 'motor'],
    ['packages/dominio/src/calculo/saldo.test.ts', 'prueba', undefined],
    ['packages/db/prisma/migrations/1_m/migration.sql', 'portado', 'migraciones y esquema'],
    ['CLAUDE.md', 'dato', 'instrucciones de los agentes'],
    ['.github/workflows/ci.yml', 'produccion', 'CI y workflows'],
    ['docs/anexos/fase3/schema.prisma', 'dato', undefined],
    ['apps/web/src/servidor/acciones/indice.ts', 'produccion', 'seguridad'],
    ['apps/web/src/servidor/acciones/compras.ts', 'produccion', undefined],
  ])('%s (%s) → %s', (ruta, clase, area) => {
    expect(areaCritica({ ruta, clase })).toBe(area);
  });
});
