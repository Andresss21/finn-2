import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { Centavos } from '@finn/dominio/valores';
import { afterEach, describe, expect, it } from 'vitest';
import '../../app/globals.css';
import { formatearMesCorto } from '../../formato';
import { GraficoDona } from './grafico-dona';
import { GraficoLineas } from './grafico-lineas';
import { LeyendaGrafico } from './leyenda-grafico';

// Leyenda de barras, monto en la leyenda de la dona y etiquetas de mes del eje (CH-149, export D2 y 04-reportes).
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

function montar(ui: ReactNode): HTMLElement {
  const nodo = document.createElement('main');
  nodo.style.width = '390px';
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(ui);
  });
  montados.push({ raiz, nodo });
  return nodo;
}

const c = (n: number): Centavos => n as Centavos;
const meses = ['2026-05-21', '2026-06-21', '2026-07-21', '2026-08-21'].map((f) => ({
  clave: f,
  etiqueta: formatearMesCorto(f),
  valor: c(10000),
}));

describe('PRU-CMP-CTA leyendas y etiquetas de los gráficos', () => {
  it('PRU-CMP-CTA-214 leyenda de barras: una muestra por marca, la referencia con su glifo y la lista con nombre accesible [P5-13]', () => {
    const raiz = montar(
      <LeyendaGrafico
        items={[
          { forma: 'barra', texto: 'Gasto' },
          { forma: 'actual', texto: 'Semana en curso' },
          { forma: 'referencia', texto: 'Referencia $81.67' },
        ]}
      />,
    );
    const lista = raiz.querySelector('ul') as HTMLElement;
    expect(lista.getAttribute('aria-label')).toBe('Leyenda');
    expect([...lista.querySelectorAll('li')].map((li) => li.textContent)).toEqual([
      'Gasto',
      'Semana en curso',
      'Referencia $81.67',
    ]);
    const barra = raiz.querySelector('[data-leyenda-forma="barra"] span') as HTMLElement;
    expect(barra.getBoundingClientRect().width).toBe(12);
    expect(getComputedStyle(barra).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    const glifo = raiz.querySelector('[data-leyenda-forma="referencia"] svg') as SVGElement;
    expect(glifo.getAttribute('aria-hidden')).toBe('true');
    expect(glifo.querySelectorAll('circle')).toHaveLength(2);
  });

  it('PRU-CMP-CTA-215 dona: la leyenda trae el monto del DTO antes del porcentaje y «Otras» va rayada y sin monto (PF-3) [FE-44]', () => {
    const raiz = montar(
      <GraficoDona
        titulo="Categorías"
        resumen="x"
        porciones={[
          { clave: 'a', etiqueta: 'Supermercado', porcentaje: 7000, monto: '$287.15' },
          { clave: 'otras', etiqueta: 'Otras', porcentaje: 3000, otras: true },
        ]}
      />,
    );
    const a = raiz.querySelector('[data-leyenda="a"]') as HTMLElement;
    expect(a.textContent).toBe('Supermercado$287.1570%');
    const otras = raiz.querySelector('[data-leyenda="otras"]') as HTMLElement;
    expect(otras.textContent).toBe('Otras30%');
    const muestra = otras.querySelector('[aria-hidden="true"]') as HTMLElement;
    expect(getComputedStyle(muestra).backgroundImage).toContain('repeating-linear-gradient');
    const trozo = raiz.querySelector('[data-porcion="otras"]') as SVGElement;
    expect(trozo.getAttribute('fill')).toBe('url(#finn-rayado-otras)');
    expect(raiz.querySelector('svg [data-total]')).toBeNull();
  });

  it('PRU-CMP-CTA-216 líneas: con etiquetasTodas cada punto lleva su mes; sin ella, solo el primero y el último [FE-44]', () => {
    const textos = (raiz: HTMLElement): string[] =>
      [...raiz.querySelectorAll('svg text.fill-texto-secundario')].map((t) => t.textContent);
    const todas = montar(
      <GraficoLineas titulo="Gastos" resumen="x" puntos={meses} etiquetasTodas />,
    );
    expect(textos(todas)).toEqual(['may', 'jun', 'jul', 'ago']);
    const bordes = montar(<GraficoLineas titulo="Gastos" resumen="x" puntos={meses} />);
    expect(textos(bordes)).toEqual(['may', 'ago']);
    expect(formatearMesCorto('2026-09-21')).toBe('sep');
  });
});
