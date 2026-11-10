// Tendencia con el tope de asignado y Top de comercios con su barra (TA-509, CH-226 a; A26 de la entrega 3; 07 §17: un componente
// es una CMP). Los montos son los del DTO de `reporte()` (04 §6.9.2): la pantalla los formatea y la escala del servidor ubica las
// barras (05 FE-44); no suma ni calcula montos (PF-3).
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../../globals.css';
import { reportes as t } from '../../../../textos/reportes';
import { cuerpoDe } from './vistas';
import type { Nombres } from './vistas-detalle';

// Solo el límite externo: `next/link` necesita el enrutador de Next, que el navegador de prueba no tiene.
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
});

const NOMBRES = {
  cuentas: [],
  grupos: [],
  categorias: [
    { id: 'super', nombre: 'Supermercado' },
    { id: 'gas', nombre: 'Gasolina' },
  ],
} as unknown as Nombres;

function mostrar(tipo: 'tendencia' | 'top_comercios', dto: unknown): HTMLElement {
  const nodo = document.createElement('main');
  nodo.style.width = '390px';
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(<>{cuerpoDe(tipo, dto, NOMBRES)}</>);
  });
  montados.push({ raiz, nodo });
  return nodo;
}

const periodo = (inicio: string, gastos: number, asignado: number) => ({
  periodo: inicio,
  ingresos: 100000,
  gastos,
  otrasEntradas: 0,
  gastosPorGrupo: [],
  asignado,
});

describe('PRU-CMP-REP', () => {
  it('PRU-CMP-REP-310 [FT-60] (CH-226) la tendencia dibuja el tope punteado de lo asignado en cada período, la leyenda «Períodos cerrados · Período actual · Asignado» y la tabla con la columna Asignado', () => {
    const raiz = mostrar('tendencia', {
      periodoActivo: { inicio: '2027-03-21', fin: '2027-04-20' },
      periodos: [
        periodo('2027-01-21', 61240, 70000),
        periodo('2027-02-21', 58810, 70000),
        periodo('2027-03-21', 63560, 72500),
      ],
    });
    const grafico = raiz.querySelector('[data-grafico="barras"]') as SVGElement;
    const topes = grafico.querySelectorAll('[data-tope]');
    expect(topes).toHaveLength(3);
    for (const tope of topes) {
      expect(tope.getAttribute('stroke-dasharray')).toBe('4 4');
      expect(tope.getAttribute('class')).toContain('stroke-grafico-referencia');
    }
    // El período activo es la barra actual; los cerrados, en tinta.
    expect(grafico.querySelector('[data-punto="2027-03-21"] .fill-accion')).not.toBeNull();
    expect(grafico.querySelector('[data-punto="2027-01-21"] .fill-grafico-tinta')).not.toBeNull();

    const leyenda = raiz.querySelector('[data-leyenda-grafico]') as HTMLElement;
    expect([...leyenda.querySelectorAll('li')].map((li) => li.textContent)).toEqual([
      t.leyendaTendencia.cerrados,
      t.leyendaTendencia.actual,
      t.leyendaTendencia.asignado,
    ]);
    expect(
      leyenda.querySelector('[data-leyenda-forma="tope"] line')?.getAttribute('stroke-dasharray'),
    ).toBe('4 4');

    const tabla = raiz.querySelector('[data-tabla-reporte]') as HTMLTableElement;
    expect([...tabla.querySelectorAll('thead th')].map((th) => th.textContent)).toContain(
      t.columnas.asignado,
    );
    expect(
      tabla.querySelector('[data-fila="2027-03-21"] [data-col="asignado"]')?.textContent,
    ).toContain('$725.00');
    expect(
      tabla.querySelector('[data-fila="2027-01-21"] [data-col="asignado"]')?.textContent,
    ).toContain('$700.00');
  });

  it('PRU-CMP-REP-311 [FT-60] Top de comercios: cada fila dice «N compras · Categoría» y lleva la barra que la escala del servidor ubica sobre el monto', () => {
    const comercio = (clave: string, monto: number, frecuencia: number, categoria: string) => ({
      clave,
      etiqueta: clave,
      porRegla: false,
      monto,
      frecuencia,
      categoriaPrincipal: categoria,
      variantes: [{ comercio: clave, monto, frecuencia }],
    });
    const raiz = mostrar('top_comercios', {
      comercios: [comercio('PRICESMART', 41280, 4, 'super'), comercio('PUMA', 10320, 1, 'gas')],
    });
    const fila = (clave: string) => raiz.querySelector(`[data-comercio="${clave}"]`) as HTMLElement;
    expect(fila('PRICESMART').textContent).toContain(`${t.compras(4)} · Supermercado`);
    expect(fila('PUMA').textContent).toContain(`${t.compras(1)} · Gasolina`);
    const barra = (clave: string) =>
      fila(clave).querySelector('[data-barra-comercio] > span') as HTMLElement;
    // El mayor llena la barra; PUMA es la cuarta parte de PRICESMART.
    expect(barra('PRICESMART').style.width).toBe('100%');
    expect(barra('PUMA').style.width).toBe('25%');
    expect(barra('PUMA').className).toContain('bg-texto');
    const pista = fila('PUMA').querySelector('[data-barra-comercio]') as HTMLElement;
    expect(getComputedStyle(pista).height).toBe('6px');
  });
});
