// FT-63 Presupuesto contra la realidad (06 FT-63; 07 §17: un texto o un estado es una CMP). La pantalla dibuja lo que trae el DTO de
// `reporte({ tipo: 'realidad' })`; los montos y la variación salen del motor (PF-3) y los ajustes se prueban de punta a punta en la E2E.
import axe from 'axe-core';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { ReporteDto } from '@finn/aplicacion/consultas/reporte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../../globals.css';
import { PantallaReporte, type Nombres } from './pantalla';

vi.mock('next/link', async () => {
  const { createElement } = await import('react');
  const Enlace = ({ href, children, ...resto }: { href: string; children?: ReactNode }) =>
    createElement('a', { href, ...resto }, children);
  return Object.assign(Enlace, { default: Enlace, useLinkStatus: () => ({ pending: false }) });
});

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const montados: { raiz: Root; nodo: HTMLElement }[] = [];
afterEach(() => {
  for (const { raiz, nodo } of montados.splice(0)) {
    act(() => {
      raiz.unmount();
    });
    nodo.remove();
  }
  document.documentElement.removeAttribute('data-theme');
});

const ref = (id: string, nombre: string) => ({ id, nombre });
const periodos = (n: number) =>
  ['2027-02-21', '2027-03-21', '2027-04-21'].slice(3 - n).map((periodo) => ({
    periodo,
    asignado: 15000,
    gastado: 18000,
  }));
const dto = (categorias: unknown[], hallazgos: unknown[]) =>
  ({
    revision: 'r1',
    hoy: '2027-05-30',
    periodoActivo: {
      inicio: '2027-05-21',
      fin: '2027-06-20',
      dias: 31,
      estado: 'activo',
      transicion: false,
      diasTranscurridos: 9,
      diasRestantes: 22,
    },
    notificacionesNoLeidas: 0,
    bandejaPorRevisar: 0,
    periodo: { inicio: '2027-05-21', fin: '2027-06-20' },
    categorias,
    hallazgos,
  }) as unknown as ReporteDto;
const NOMBRES = { cuentas: [], grupos: [], categorias: [] } as unknown as Nombres;
const fila = (id: string, nombre: string, completa: boolean) => ({
  categoria: ref(id, nombre),
  grupo: ref('g1', 'Casa'),
  periodos: periodos(completa ? 3 : 2),
  promedioGastado: completa ? 18000 : null,
  sugerido: completa ? 18000 : null,
  gastoComparado: 0,
  variacion: completa ? -10000 : null,
});

const mostrar = (datos: ReporteDto): HTMLElement => {
  document.body.style.cssText = 'background: var(--fondo); color: var(--texto)';
  const nodo = document.createElement('div');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(<PantallaReporte url="realidad" dto={datos} nombres={NOMBRES} parametros={{}} />);
  });
  montados.push({ raiz, nodo });
  return nodo;
};

describe('PRU-CMP-REP-180 presupuesto contra la realidad', () => {
  it('PRU-CMP-REP-180 [FT-63, CA-63.5] sin hallazgos dice que las asignaciones van acordes; la categoría sin 3 períodos lo dice «Hace falta historia de 3 períodos para comparar.» y no se evalúa', () => {
    const raiz = mostrar(dto([fila('c1', 'Corta', false), fila('c2', 'Fondo', true)], []));
    expect(raiz.querySelector('h1')?.textContent).toBe('Reportes');
    expect(
      raiz.querySelector('nav[aria-label="Reportes"] a[aria-current="page"]')?.textContent,
    ).toBe('Realidad');
    expect(raiz.querySelectorAll('[data-sin-hallazgos]')).toHaveLength(2);
    expect(raiz.querySelector('[data-hallazgo-realidad]')).toBeNull();
    expect(raiz.querySelector('[data-hallazgo-promedio]')).toBeNull();
    const sin = raiz.querySelectorAll('[data-sin-historia]');
    expect(sin).toHaveLength(1);
    expect(sin[0]?.textContent).toBe('Hace falta historia de 3 períodos para comparar.');
    expect(raiz.querySelector('[data-fila="c1"]')?.contains(sin[0] ?? null)).toBe(true);
    expect(raiz.querySelector('[data-fila="c1"] [data-col="variacion"]')?.textContent).toBe('—');
    // Sin ventana ni cuentas: el reporte es siempre del período activo (05 §2.10).
    expect(raiz.querySelector('nav[aria-label="Períodos"]')).toBeNull();
  });

  it('PRU-CMP-REP-181 [FT-63] la pantalla con hallazgos, con su enlace a la categoría, no tiene violaciones de axe en claro ni en oscuro', async () => {
    const datos = dto(
      [fila('c1', 'Restaurantes', true)],
      [
        {
          tipo: 'promedio',
          clave: 'categoria:c1',
          impacto: 6000,
          estado: 'informacion',
          categoria: ref('c1', 'Restaurantes'),
          gasto: 17556,
          promedio: 11195,
          variacion: 5682,
          accion: { tipo: 'revisar', categoriaId: 'c1' },
        },
      ],
    );
    for (const tema of ['claro', 'oscuro']) {
      document.documentElement.setAttribute('data-theme', tema);
      const raiz = mostrar(datos);
      expect(raiz.querySelector('[data-hallazgo-promedio]')?.textContent).toContain(
        'En Restaurantes vas camino a $175.56 este período',
      );
      expect(raiz.querySelector('[data-hallazgo-promedio] a')?.getAttribute('href')).toBe(
        '/presupuesto/categorias/c1',
      );
      const resultado = await axe.run(raiz);
      expect(
        resultado.violations.map((v) => `${tema}: ${v.id} ${v.nodes[0]?.html.slice(0, 120)}`),
      ).toEqual([]);
      act(() => {
        montados[0]?.raiz.unmount();
      });
      montados.shift()?.nodo.remove();
    }
  });
});
