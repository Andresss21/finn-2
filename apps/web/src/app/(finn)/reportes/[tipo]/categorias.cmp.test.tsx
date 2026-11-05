// Reporte de categorías con el total al centro de la dona y el monto de «Otras» (CH-177; 07 §17: un texto de un componente es
// una CMP). Los montos son los que trae el DTO de `reporte('categorias')` (04 §6.9.2): la pantalla solo los formatea (PF-3).
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { ReporteDe } from '@finn/aplicacion/consultas/reporte';
import { afterEach, describe, expect, it } from 'vitest';
import '../../../globals.css';
import { Categorias, type Nombres } from './vistas-detalle';

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

// Diez categorías con gasto (en centavos) y sus puntos básicos, que suman 10.000. Σ = 72.390; las dos últimas, 1.200 + 1.130.
const GASTADO = [28715, 14630, 9875, 5840, 4500, 3000, 2000, 1500, 1200, 1130];
const PUNTOS = [3967, 2021, 1364, 807, 622, 414, 276, 207, 166, 156];
const NOMBRES = {
  cuentas: [],
  grupos: [],
  categorias: GASTADO.map((_, k) => ({ id: `c${k}`, nombre: `Categoría ${k + 1}` })),
} as unknown as Nombres;

const dto = (total: number, montoOtras: number, n = GASTADO.length) =>
  ({
    categorias: GASTADO.slice(0, n).map((gastado, k) => ({
      categoria: `c${k}`,
      grupo: 'g',
      gastado,
      porcentaje: PUNTOS[k],
    })),
    conDevolucionNeta: [],
    total,
    montoOtras,
  }) as unknown as ReporteDe<'categorias'>;

function mostrar(datos: ReporteDe<'categorias'>): HTMLElement {
  const nodo = document.createElement('main');
  nodo.style.width = '390px';
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(<Categorias dto={datos} nombres={NOMBRES} />);
  });
  montados.push({ raiz, nodo });
  return nodo;
}

describe('PRU-CMP-REP', () => {
  it('PRU-CMP-REP-160 [FT-60] la dona lleva al centro el total gastado del DTO con «gastado» debajo, y «Otras» muestra en la leyenda el monto que trae el DTO', () => {
    const raiz = mostrar(dto(72390, 2330));
    const dona = raiz.querySelector('[data-grafico="dona"]') as SVGElement;
    expect(dona.querySelector('[data-total]')?.textContent).toBe('$723.90');
    expect(dona.textContent).toContain('gastado');
    // 8 porciones con nombre y «Otras».
    expect(dona.querySelectorAll('[data-porcion]')).toHaveLength(9);
    const otras = raiz.querySelector('[data-leyenda="otras"]') as HTMLElement;
    expect(otras.textContent).toContain('Otras');
    expect(otras.textContent).toContain('$23.30');
    expect(raiz.querySelector('[data-leyenda="c0"]')?.textContent).toContain('$287.15');
  });

  it('PRU-CMP-REP-161 [FT-60] con 8 categorías o menos no hay «Otras» y el centro sigue con el total del DTO', () => {
    const raiz = mostrar(dto(28715, 0, 1));
    expect(raiz.querySelector('[data-leyenda="otras"]')).toBeNull();
    expect(raiz.querySelector('[data-total]')?.textContent).toBe('$287.15');
  });
});
