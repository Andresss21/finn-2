// FT-64 Gastos hormiga (06 FT-64; 07 §17: un texto o un estado es una CMP). La pantalla dibuja lo que trae el DTO de
// `reporte({ tipo: 'hormiga' })`: la deduplicación y los umbrales son del motor (3.5.8, PROP del dominio) y la acción hacia Actividad
// se prueba de punta a punta en la E2E.
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

const CAFES = { id: 'c1', nombre: 'Cafés y antojos' };
const ENLACE = {
  pantalla: 'actividad',
  desde: '2027-02-21',
  hasta: '2027-03-20',
  montoHasta: 1000,
} as const;
const periodo = {
  inicio: '2027-02-21',
  fin: '2027-03-20',
  dias: 28,
  estado: 'activo',
  transicion: false,
  diasTranscurridos: 12,
  diasRestantes: 16,
};
const dto = (grupos: unknown[], hallazgos: unknown[]) =>
  ({
    revision: 'r1',
    hoy: '2027-03-05',
    periodoActivo: periodo,
    notificacionesNoLeidas: 0,
    bandejaPorRevisar: 0,
    periodo,
    navegacion: { anterior: '2027-01-21' },
    grupos,
    hallazgos,
  }) as unknown as ReporteDto;
const NOMBRES = { cuentas: [], grupos: [], categorias: [] } as unknown as Nombres;

const porCategoria = (compras: number, total: number) => ({
  agrupacion: 'categoria',
  clave: 'categoria:c1',
  etiqueta: CAFES.nombre,
  categoria: CAFES,
  compras,
  total,
});
const hallazgoDeCategoria = (compras: number, total: number) => ({
  tipo: 'hormiga',
  clave: 'categoria:c1',
  impacto: total,
  estado: 'advertencia',
  agrupacion: 'categoria',
  etiqueta: CAFES.nombre,
  compras,
  total,
  categoria: CAFES,
  enlace: { ...ENLACE, categoriaId: 'c1' },
});
const porComercio = (clave: string, etiqueta: string, compras: number, total: number) => ({
  agrupacion: 'comercio',
  clave,
  etiqueta,
  porRegla: false,
  compras,
  total,
});

const mostrar = (datos: ReporteDto): HTMLElement => {
  document.body.style.cssText = 'background: var(--fondo); color: var(--texto)';
  const nodo = document.createElement('div');
  // Ancho de teléfono: las tablas se desplazan, y la CI corre en otro tamaño que el local.
  nodo.style.width = '320px';
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(<PantallaReporte url="hormiga" dto={datos} nombres={NOMBRES} parametros={{}} />);
  });
  montados.push({ raiz, nodo });
  return nodo;
};

describe('PRU-CMP-REP-190 gastos hormiga', () => {
  it('PRU-CMP-REP-190 [FT-64, CA-64.1] 12 compras de Cafés y antojos por $64.08 dan un solo hallazgo «12 compras pequeñas en Cafés y antojos este período: $64.08.» con «Ver las compras» hacia Actividad con la categoría, el tipo gasto, el período y el tope de $10.00', () => {
    const raiz = mostrar(dto([porCategoria(12, 6408)], [hallazgoDeCategoria(12, 6408)]));
    expect(raiz.querySelector('h1')?.textContent).toBe('Reportes');
    expect(
      raiz.querySelector('nav[aria-label="Reportes"] a[aria-current="page"]')?.textContent,
    ).toBe('Gastos hormiga');
    const hallazgos = raiz.querySelectorAll('[data-hallazgo-hormiga]');
    expect(hallazgos).toHaveLength(1);
    expect(hallazgos[0]?.textContent).toContain(
      '12 compras pequeñas en Cafés y antojos este período: $64.08.',
    );
    const ver = hallazgos[0]?.querySelector('a');
    expect(ver?.textContent).toBe('Ver las compras');
    expect(ver?.getAttribute('href')).toBe(
      '/actividad?categoria=c1&tipo=gasto&desde=2027-02-21&hasta=2027-03-20&monto-hasta=10.00',
    );
    expect(raiz.querySelector('[data-sin-grupos]')).toBeNull();
    // El período se elige con su selector (`?periodo=`); el reporte no lleva la barra de ventanas.
    expect(raiz.querySelector('nav[aria-label="Períodos"]')).toBeNull();
  });

  it('PRU-CMP-REP-191 [FT-64, CA-64.3] con 4 compras en un comercio hay un grupo en la tabla y ningún hallazgo', () => {
    const raiz = mostrar(dto([porComercio('comercio:oxxo', 'Oxxo', 4, 2000)], []));
    expect(raiz.querySelector('[data-hallazgo-hormiga]')).toBeNull();
    expect(raiz.querySelector('[data-sin-grupos]')).toBeNull();
    const fila = raiz.querySelector('[data-fila="comercio:oxxo"]');
    expect(fila?.textContent).toContain('Oxxo');
    expect(fila?.querySelector('[data-col="compras"]')?.textContent).toBe('4');
  });

  it('PRU-CMP-REP-192 [FT-64, CA-64.4] cuando el motor entrega un solo hallazgo de los dos grupos que comparten compras, la pantalla muestra solo ese, con el texto por categoría y el grupo de comercio solo en la tabla', () => {
    const raiz = mostrar(
      dto(
        [porCategoria(12, 6408), porComercio('comercio:sin-comercio', 'Sin comercio', 12, 6408)],
        [hallazgoDeCategoria(12, 6408)],
      ),
    );
    expect(raiz.querySelectorAll('[data-hallazgo-hormiga]')).toHaveLength(1);
    expect(raiz.querySelector('[data-hallazgo-hormiga="categoria:c1"]')).not.toBeNull();
    expect(raiz.querySelectorAll('[data-col="grupo"]')).toHaveLength(2);
  });

  it('PRU-CMP-REP-193 [FT-64, CA-64.4] el hallazgo de comercio dice «{n} compras en {comercio} este período: {total}.» y enlaza a Actividad con el texto del comercio', () => {
    const raiz = mostrar(
      dto(
        [porComercio('comercio:oxxo', 'Oxxo', 6, 3000)],
        [
          {
            tipo: 'hormiga',
            clave: 'comercio:oxxo',
            impacto: 3000,
            estado: 'advertencia',
            agrupacion: 'comercio',
            etiqueta: 'Oxxo',
            compras: 6,
            total: 3000,
            comercio: 'Oxxo',
            enlace: { ...ENLACE, texto: 'Oxxo' },
          },
        ],
      ),
    );
    const h = raiz.querySelector('[data-hallazgo-hormiga]');
    expect(h?.textContent).toContain('6 compras en Oxxo este período: $30.00.');
    expect(h?.querySelector('a')?.getAttribute('href')).toBe(
      '/actividad?texto=Oxxo&tipo=gasto&desde=2027-02-21&hasta=2027-03-20&monto-hasta=10.00',
    );
  });

  it('PRU-CMP-REP-194 [FT-64] sin grupos dice «No encontramos compras pequeñas repetidas en este período.» y no dibuja la tabla', () => {
    const raiz = mostrar(dto([], []));
    expect(raiz.querySelector('[data-sin-grupos]')?.textContent).toBe(
      'No encontramos compras pequeñas repetidas en este período.',
    );
    expect(raiz.querySelector('table')).toBeNull();
  });

  it('PRU-CMP-REP-195 [FT-64] la pantalla con hallazgo y tabla no tiene violaciones de axe a 320 px en claro ni en oscuro', async () => {
    const datos = dto([porCategoria(12, 6408)], [hallazgoDeCategoria(12, 6408)]);
    for (const tema of ['claro', 'oscuro']) {
      document.documentElement.setAttribute('data-theme', tema);
      const raiz = mostrar(datos);
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
