import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { Centavos } from '@finn/dominio/valores';
import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import '../../app/globals.css';
import { Monto } from '../dominio/monto';
import { GraficoBarras, type PuntoBarra } from './grafico-barras';
import { GraficoDona } from './grafico-dona';
import { GraficoLineas } from './grafico-lineas';
import { TablaEquivalente } from './tabla-equivalente';
import { VistaGrafico } from './vista-grafico';

// Contenedor de gráfico del diseño (A.6 §2.18, 05 §10.8.1, CH-112): selector a la derecha, cifra grande, leyenda, textos
// del SVG a 11 px y fila actual resaltada. Se mide en el navegador de prueba.
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

function montar(ui: ReactNode, ancho: number): HTMLElement {
  const nodo = document.createElement('main');
  nodo.style.width = `${ancho}px`;
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(ui);
  });
  montados.push({ raiz, nodo });
  return nodo;
}

const c = (n: number): Centavos => n as Centavos;
const puntos: PuntoBarra[] = [
  { clave: 'a', etiqueta: '21/09', valor: c(9240), referencia: c(8000) },
  { clave: 'b', etiqueta: '28/09', valor: c(7115), referencia: c(8000), actual: true },
];
const porciones = [
  { clave: 'a', etiqueta: 'Supermercado', porcentaje: 7000 },
  { clave: 'b', etiqueta: 'Otras', porcentaje: 3000, otras: true },
];

describe('PRU-CMP-CTA contenedor de gráfico', () => {
  it('PRU-CMP-CTA-210 los textos del SVG miden 11 px aunque el contenedor sea ancho: el SVG no se amplía más allá de su viewBox [FE-44]', () => {
    const raiz = montar(
      <>
        <GraficoBarras titulo="Barras" resumen="x" puntos={puntos} />
        <GraficoLineas
          titulo="Líneas"
          resumen="x"
          puntos={puntos.map((p) => ({ clave: p.clave, etiqueta: p.etiqueta, valor: p.valor }))}
        />
        <GraficoDona
          titulo="Dona"
          resumen="x"
          porciones={porciones}
          total="$100.00"
          etiquetaTotal="gastado"
        />
      </>,
      900,
    );
    const svgs = [...raiz.querySelectorAll<SVGSVGElement>('svg[role="img"]')];
    expect(svgs).toHaveLength(3);
    for (const svg of svgs) {
      const escala = svg.getScreenCTM()?.a ?? 99;
      expect(escala).toBeCloseTo(1, 2);
      const textos = [...svg.querySelectorAll('text')].filter(
        (t) => t.getAttribute('font-size') === '11',
      );
      expect(textos.length).toBeGreaterThan(0);
      for (const texto of textos) expect(getComputedStyle(texto).fontSize).toBe('11px');
    }
  });

  it('PRU-CMP-CTA-211 contenedor: selector Gráfico / Tabla a la derecha del encabezado, cifra grande y leyenda [FE-44, P5-13]', () => {
    const raiz = montar(
      <VistaGrafico
        titulo="Categorías"
        cifra={<Monto centavos={c(10366)} rol="cifra-principal" />}
        nota="Promedio gastado"
        grafico={
          <GraficoDona
            titulo="Gasto por categoría"
            resumen="x"
            porciones={porciones}
            total="$635.60"
            etiquetaTotal="gastado"
          />
        }
        tabla={<TablaEquivalente titulo="Categorías" puntos={puntos} />}
        tablaAlLado
      />,
      390,
    );
    const encabezado = raiz.querySelector('[data-grafico-encabezado]') as HTMLElement;
    const titulo = encabezado.querySelector('h2') as HTMLElement;
    const selector = encabezado.querySelector('[role="radiogroup"]') as HTMLElement;
    expect(titulo.textContent).toBe('Categorías');
    expect(selector.getBoundingClientRect().left).toBeGreaterThan(
      titulo.getBoundingClientRect().right,
    );
    expect(raiz.querySelector('[data-grafico-cifra]')?.textContent).toContain('$103.66');
    expect(raiz.querySelector('[data-grafico-nota]')?.textContent).toBe('Promedio gastado');
    const muestra = raiz.querySelector('[data-leyenda="a"] [aria-hidden="true"]') as HTMLElement;
    expect(muestra.getBoundingClientRect().width).toBe(12);
    expect(muestra.getBoundingClientRect().height).toBe(12);
    expect(getComputedStyle(muestra).borderRadius).toBe('4px');
    expect(raiz.querySelector('svg [data-total]')?.textContent).toBe('$635.60');
  });

  it('PRU-CMP-CTA-213 contenedor: en computadora la tabla va al lado del gráfico y el selector se oculta [FE-44, P5-13]', async () => {
    await page.viewport(1100, 800);
    const raiz = montar(
      <VistaGrafico
        grafico={<GraficoBarras titulo="Barras" resumen="x" puntos={puntos} />}
        tabla={<TablaEquivalente titulo="Barras" puntos={puntos} />}
        tablaAlLado
      />,
      900,
    );
    expect(
      raiz.querySelector('[role="radiogroup"]')?.parentElement?.getBoundingClientRect().width,
    ).toBe(0);
    const g = (raiz.querySelector('svg[role="img"]') as Element).getBoundingClientRect();
    const t = (raiz.querySelector('table') as Element).getBoundingClientRect();
    expect(t.width).toBeGreaterThan(100);
    expect(t.left).toBeGreaterThanOrEqual(g.right - 1);
  });

  it('PRU-CMP-CTA-212 tabla equivalente: la fila actual va resaltada y marcada [P5-13]', () => {
    const raiz = montar(<TablaEquivalente titulo="Semanas" puntos={puntos} />, 390);
    const filas = [...raiz.querySelectorAll('tbody tr')];
    expect(filas.map((f) => f.getAttribute('aria-current'))).toEqual([null, 'true']);
    const fondo = (f: Element | undefined) =>
      f === undefined ? '' : getComputedStyle(f).backgroundColor;
    expect(fondo(filas[1])).not.toBe(fondo(filas[0]));
    expect(filas[1]?.className).toContain('font-semibold');
  });
});
