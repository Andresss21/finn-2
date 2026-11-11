// workflows: selección de E2E por tipo de cambio (CH-239; 07 §6.1). Clases de diff, de menor a mayor: 0 documentos y
// plan (ninguna E2E y no suben la clase), 1 estilos (axe, movimiento y tamaño de JS), 2 pantallas, flujos y textos
// propios (las afectadas sin el marco, más las de la clase 1 y las de ingreso y acceso), 3 todo lo demás (como hasta
// CH-239; en `main`, la completa). Un archivo que no se sabe clasificar es de clase 3. En `main`, la base del diff es la
// última E2E completa de `main`, si es ancestro de HEAD y tiene a lo sumo 7 días; si no, clase 3.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  clase,
  claseDe,
  E2E_ACCESO,
  E2E_ESTILOS,
  seleccionE2E,
  type Mapa,
} from '../pruebas/afectadas.ts';
import { baseE2e, type Git } from './reutiliza-e2e.ts';

const raiz = fileURLToPath(new URL('../..', import.meta.url));
const mapa = JSON.parse(readFileSync(join(raiz, 'pruebas', 'mapa-codigo.json'), 'utf8')) as Mapa;
const de = (...a: string[]): number => claseDe(a, mapa);

const COLOR = 'apps/web/src/app/tokens.css';
const PANTALLA = 'apps/web/src/app/(finn)/metas/pantalla.tsx';
const ESTILOS = E2E_ESTILOS.join('|');

describe('workflows: clase de un diff (CH-239)', () => {
  it('workflows: color solo es clase 1, y los demás estilos también', () => {
    expect(de(COLOR)).toBe(1);
    for (const f of [
      'apps/web/src/app/tokens.json',
      'apps/web/src/app/globals.css',
      'apps/web/tailwind.css',
    ])
      expect(clase(f, mapa), f).toBe(1);
  });

  it('workflows: color + plan/tareas.json sigue en clase 1: documentos y plan no suben la clase', () => {
    expect(de(COLOR, 'plan/tareas.json', 'pruebas/features.json', 'docs/08-tareas.md')).toBe(1);
    for (const f of [
      'plan/tareas.json',
      'plan/objetivos.txt',
      'docs/07-pruebas.md',
      'pruebas/features.json',
      'pruebas/mapa-codigo.json',
      'pruebas/manuales.md',
    ])
      expect(clase(f, mapa), f).toBe(0);
    expect(de('plan/tareas.json', 'docs/08-tareas.md')).toBe(0);
    expect(de()).toBe(0);
  });

  it('workflows: una pantalla + docs es clase 2; también un flujo, un texto propio y una prueba E2E', () => {
    expect(de(PANTALLA, 'docs/08-tareas.md', 'plan/tareas.json')).toBe(2);
    expect(de(PANTALLA, COLOR)).toBe(2);
    for (const f of [
      'apps/web/src/flujos/metas-nueva/flujo.tsx',
      'apps/web/src/textos/metas.ts',
      'apps/web/e2e/pantallas/metas/metas.e2e.ts',
      'apps/web/src/app/(finn)/metas/pantalla.cmp.test.tsx',
    ])
      expect(clase(f, mapa), f).toBe(2);
  });

  it('workflows: pantalla + componente base es clase 3, como el marco, la navegación, el servidor y los textos compartidos', () => {
    expect(de(PANTALLA, 'apps/web/src/componentes/base/boton.tsx')).toBe(3);
    for (const f of [
      'apps/web/src/componentes/navegacion/barra.tsx',
      'apps/web/src/componentes/formularios/campo.tsx',
      'apps/web/src/componentes/marco/marco.tsx',
      'apps/web/src/app/(finn)/layout.tsx',
      'apps/web/src/app/(finn)/@superpuesto/default.tsx',
      'apps/web/src/app/layout.tsx',
      'apps/web/src/app/api/tareas/route.ts',
      'apps/web/src/servidor/acciones/metas.ts',
      'apps/web/src/textos/base.ts',
      'apps/web/src/textos/index.ts',
      'apps/web/e2e/ayudas/esperas.ts',
      'apps/web/e2e/configuracion/inicio-sesion.setup.ts',
      'apps/web/playwright.config.ts',
      'apps/web/next.config.ts',
      'apps/web/package.json',
      'pnpm-lock.yaml',
    ])
      expect(clase(f, mapa), f).toBe(3);
  });

  it('workflows: dominio, aplicación, base, tools y workflows son clase 3', () => {
    expect(de('packages/dominio/src/periodos.ts')).toBe(3);
    for (const f of [
      'packages/aplicacion/src/operaciones/metas/OP-30-crear-meta.ts',
      'packages/db/prisma/schema.prisma',
      'tools/ci/afecta.mjs',
      '.github/workflows/ci.yml',
    ])
      expect(clase(f, mapa), f).toBe(3);
  });

  it('workflows: un archivo que no se sabe clasificar es de clase 3', () => {
    for (const f of [
      'apps/web/src/nuevo/x.ts',
      'apps/web/src/estilos.css',
      'apps/web/public/marca/logo.svg',
      'README.md',
      'CLAUDE.md',
      'pruebas/manuales/resultados.md',
      'algo/raro.txt',
    ])
      expect(clase(f, mapa), f).toBe(3);
    expect(de(COLOR, 'algo/raro.txt')).toBe(3);
  });
});

describe('workflows: filtro -g según la clase (CH-239)', () => {
  it('workflows: clase 0 no corre E2E y clase 1 corre solo axe, movimiento y tamaño de JS, sin las afectadas', () => {
    expect(seleccionE2E(0, '^$')).toBe('^$');
    expect(seleccionE2E(1, 'PRU-E2E-PWA-180')).toBe(ESTILOS);
    expect(E2E_ESTILOS).toEqual(['PRU-E2E-PWA-007', 'PRU-E2E-PWA-008', 'PRU-REN-PWA-002']);
  });

  it('workflows: clase 2 corre las afectadas, las de la clase 1 y las de ingreso y acceso, sin repetir', () => {
    const fijas = [...E2E_ESTILOS, ...E2E_ACCESO];
    expect(seleccionE2E(2, '^$').split('|')).toEqual(fijas);
    expect(seleccionE2E(2, 'PRU-E2E-META-101|PRU-E2E-PWA-007').split('|')).toEqual([
      'PRU-E2E-META-101',
      ...fijas,
    ]);
    expect(E2E_ACCESO).toEqual(['PRU-E2E-ACCESO-102', 'PRU-SEG-ACCESO-002']);
  });

  it('workflows: clase 3 deja el filtro de afectadas como hasta CH-239, y la suite completa si afectadas la pide', () => {
    expect(seleccionE2E(3, 'PRU-E2E-META-101')).toBe('PRU-E2E-META-101');
    expect(seleccionE2E(3, '^$')).toBe('^$');
    expect(seleccionE2E(3, null)).toBe('todas');
  });

  it('workflows: una ficha que se cierra (afectadas da la completa) corre la suite completa en cualquier clase (CH-70)', () => {
    for (const c of [0, 1, 2, 3] as const) expect(seleccionE2E(c, null)).toBe('todas');
  });
});

describe('workflows: base de la clase en main (CH-239)', () => {
  const SHA = 'a'.repeat(40);
  const DIA = 24 * 3600;
  const git =
    (ancestro: boolean, segundos: number, falla = false): Git =>
    (...args) => {
      if (args[0] === 'merge-base') return { ok: ancestro, salida: '' };
      if (falla) return { ok: false, salida: '' };
      return {
        ok: true,
        salida: `${args[3] === 'HEAD' ? 1_800_000_000 + segundos : 1_800_000_000}\n`,
      };
    };

  it('workflows: la última E2E completa de main es la base si es ancestro de HEAD y tiene a lo sumo 7 días', () => {
    expect(baseE2e({ sha: SHA }, git(true, 2 * DIA))).toBe(SHA);
    expect(baseE2e({ sha: SHA }, git(true, 7 * DIA))).toBe(SHA);
  });

  it('workflows: sin base válida (no ancestro, más de 7 días, git que falla, sha inválido o ausente) no hay base', () => {
    expect(baseE2e({ sha: SHA }, git(false, DIA))).toBe('');
    expect(baseE2e({ sha: SHA }, git(true, 7 * DIA + 1))).toBe('');
    expect(baseE2e({ sha: SHA }, git(true, DIA, true))).toBe('');
    expect(baseE2e({ sha: 'HEAD' }, git(true, DIA))).toBe('');
    expect(baseE2e(null, git(true, DIA))).toBe('');
    expect(baseE2e({}, git(true, DIA))).toBe('');
  });
});
