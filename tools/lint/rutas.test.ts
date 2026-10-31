// Control negativo de FE-03 y FE-59 (TA-200; 05 §1.3, §15.5): una página fuera del árbol o una carpeta de flujo
// que no se deriva de una ruta [L] o [C] falla; las que sí están, pasan.
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { carpetaDeFlujo, verificarRutas } from './rutas.ts';

const raizReal = fileURLToPath(new URL('../..', import.meta.url));
const temporales: string[] = [];

function proyecto(archivos: string[]): string {
  const raiz = mkdtempSync(join(tmpdir(), 'finn-rutas-'));
  temporales.push(raiz);
  mkdirSync(join(raiz, 'docs'));
  cpSync(join(raizReal, 'docs', '05-frontend.md'), join(raiz, 'docs', '05-frontend.md'));
  for (const a of archivos) {
    mkdirSync(dirname(join(raiz, a)), { recursive: true });
    writeFileSync(join(raiz, a), '');
  }
  return raiz;
}

afterEach(() => {
  for (const t of temporales.splice(0)) rmSync(t, { recursive: true, force: true });
});

describe('lint de rutas y flujos (05 §1.3, §15.5)', () => {
  it('FE-59: la carpeta del flujo sale de la ruta (ejemplos de 05 §15.5)', () => {
    expect(carpetaDeFlujo('registrar/gasto')).toBe('registrar-gasto');
    expect(carpetaDeFlujo('cuentas/[cuentaId]/pagar')).toBe('cuentas-pagar');
    expect(carpetaDeFlujo('bandeja/[movimientoId]')).toBe('bandeja-movimiento');
    expect(carpetaDeFlujo('programadas/[programadaId]/ocurrencias/[fechaEsperada]')).toBe(
      'programadas-ocurrencias-fecha-esperada',
    );
  });

  it('acepta las rutas del árbol, la interceptada y las carpetas de flujo derivadas', () => {
    const raiz = proyecto([
      'apps/web/src/app/layout.tsx',
      'apps/web/src/app/(finn)/page.tsx',
      'apps/web/src/app/(finn)/presupuesto/asignar/[categoriaId]/page.tsx',
      'apps/web/src/app/(finn)/@superpuesto/(.)presupuesto/asignar/[categoriaId]/page.tsx',
      'apps/web/src/flujos/presupuesto-asignar-categoria/lector.tsx',
    ]);
    expect(verificarRutas(raiz)).toEqual([]);
  });

  it('rechaza una página que no está en el árbol de 05 §1.3', () => {
    const raiz = proyecto(['apps/web/src/app/(finn)/inventada/page.tsx']);
    expect(verificarRutas(raiz)).toEqual([expect.stringContaining('«inventada» no está')]);
  });

  it('rechaza una página de (finn)/pruebas que no es force-dynamic (CH-58)', () => {
    const pagina = 'apps/web/src/app/(finn)/pruebas/x/page.tsx';
    const raiz = proyecto([pagina]);
    expect(verificarRutas(raiz)).toEqual([expect.stringContaining('force-dynamic')]);
    writeFileSync(join(raiz, pagina), "export const dynamic = 'force-dynamic';\n");
    expect(verificarRutas(raiz)).toEqual([]);
  });

  it('rechaza una carpeta de flujo con nombre libre y una carpeta de primer nivel desconocida', () => {
    const raiz = proyecto([
      'apps/web/src/flujos/asignar-rapido/lector.tsx',
      'apps/web/src/app/admin/page.tsx',
    ]);
    expect(verificarRutas(raiz)).toEqual([
      expect.stringContaining('app/admin: no está en 05 §1.2'),
      expect.stringContaining('flujos/asignar-rapido'),
    ]);
  });

  it('el repositorio cumple sus propias reglas', () => {
    expect(verificarRutas(raizReal)).toEqual([]);
  });
});
