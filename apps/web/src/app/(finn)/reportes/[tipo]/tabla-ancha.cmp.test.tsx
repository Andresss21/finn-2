// E5-4 (entrega 4): una tabla de más de 3 columnas desplaza en horizontal en el teléfono con la primera columna fija y se lee entera en
// computadora (07 §17: un componente es una CMP). Las cifras son las del DTO; la tabla solo las dibuja (PF-3).
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { page } from 'vitest/browser';
import type { ReporteDe } from '@finn/aplicacion/consultas/reporte';
import { afterEach, describe, expect, it } from 'vitest';
import '../../../globals.css';
import { Cumplimiento, type Nombres } from './vistas-detalle';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const montados: { raiz: Root; nodo: HTMLElement }[] = [];
afterEach(async () => {
  await page.viewport(414, 896);
  for (const { raiz, nodo } of montados.splice(0)) {
    act(() => {
      raiz.unmount();
    });
    nodo.remove();
  }
});

const NOMBRES = {
  cuentas: [],
  efectivo: [],
  grupos: [],
  categorias: [{ id: 'super', nombre: 'Supermercado con un nombre largo para ensanchar la fila' }],
} as unknown as Nombres;

const DTO = {
  filas: [
    {
      categoria: 'super',
      periodo: '2027-01-21',
      asignado: 30000,
      gastado: 41250,
      diferencia: -11250,
      porcentaje: 13750,
    },
  ],
} as unknown as ReporteDe<'cumplimiento'>;

function mostrar(): HTMLElement {
  const nodo = document.createElement('main');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(<Cumplimiento dto={DTO} nombres={NOMBRES} />);
  });
  montados.push({ raiz, nodo });
  return nodo;
}

describe('PRU-CMP-REP tabla ancha', () => {
  it('PRU-CMP-REP-711 [CA-E5-6] una tabla de 6 columnas en 414 px es una región enfocable con nombre, con la primera columna fija y el aviso de desplazamiento; en 1280 px no desplaza ni lo avisa', async () => {
    const raiz = mostrar();
    const region = raiz.querySelector<HTMLElement>('[role="region"]');
    expect(region?.getAttribute('tabindex')).toBe('0');
    expect(region?.getAttribute('aria-label')).toBe(
      'Cumplimiento del presupuesto, con desplazamiento horizontal',
    );
    expect(getComputedStyle(region as HTMLElement).overflowX).toBe('auto');
    expect((region as HTMLElement).scrollWidth).toBeGreaterThan(
      (region as HTMLElement).clientWidth,
    );
    const primera = raiz.querySelector<HTMLElement>('tbody tr > :first-child');
    expect(getComputedStyle(primera as HTMLElement).position).toBe('sticky');
    const aviso = raiz.querySelector<HTMLElement>('[data-aviso-desplazar]');
    expect(aviso?.textContent).toBe('Desplazá para ver más columnas.');
    expect(aviso?.getBoundingClientRect().height).toBeGreaterThan(0);
    const degradado = raiz.querySelector<HTMLElement>('[data-degradado-tabla]');
    expect(degradado?.getBoundingClientRect().width).toBe(24);
    await page.viewport(1280, 900);
    expect(getComputedStyle(region as HTMLElement).overflowX).toBe('visible');
    expect(getComputedStyle(primera as HTMLElement).position).toBe('static');
    expect(aviso?.getBoundingClientRect().height).toBe(0);
    expect(degradado?.getBoundingClientRect().width).toBe(0);
  });
});
