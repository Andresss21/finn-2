import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { describe, expect, it } from 'vitest';
import { Icono, type NombreIcono } from './icono';
import { GLIFOS, ICONOS } from './iconos/registro';

// Las fuentes: los .svg portados, leídos sin transformar.
const fuentes = import.meta.glob<string>('./iconos/**/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
});

const interior = (svg: string) =>
  svg
    .trim()
    .replace(/^<svg[^>]*>/, '')
    .replace(/<\/svg>$/, '');
const cabecera = (svg: string) => /^<svg[^>]*>/.exec(svg.trim())?.[0] ?? '';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function dibujar(nombre: NombreIcono, etiqueta?: string): SVGSVGElement {
  const contenedor = document.createElement('div');
  document.body.append(contenedor);
  act(() => {
    createRoot(contenedor).render(
      etiqueta === undefined ? (
        <Icono nombre={nombre} />
      ) : (
        <Icono nombre={nombre} etiqueta={etiqueta} />
      ),
    );
  });
  return contenedor.querySelector<SVGSVGElement>('svg') as SVGSVGElement;
}

const todos = [
  ...Object.keys(ICONOS).map((n) => [n, `./iconos/${n}.svg`, 1.5] as const),
  ...Object.keys(GLIFOS).map((n) => [n, `./iconos/estados/${n}.svg`, 1.8] as const),
];

describe('PRU-CMP-VAL-101 íconos y glifos de estado', () => {
  it('PRU-CMP-VAL-101 hay 52 íconos y 7 glifos de estado, cada uno con su archivo', () => {
    expect(Object.keys(ICONOS)).toHaveLength(52);
    expect(Object.keys(GLIFOS).sort()).toEqual([
      'advertencia',
      'cero',
      'deuda',
      'deuda-sin-respaldo',
      'informacion',
      'positivo',
      'problema',
    ]);
    expect(Object.keys(fuentes)).toHaveLength(59);
  });

  it.each(todos)(
    'PRU-CMP-VAL-101 %s se dibuja idéntico a su fuente, con currentColor',
    (nombre, ruta, trazo) => {
      const fuente = fuentes[ruta];
      expect(fuente).toBeDefined();
      const svg = dibujar(nombre as NombreIcono);
      // El mismo analizador HTML para los dos lados, para que la comparación no dependa de la serialización.
      const referencia = document.createElement('div');
      referencia.innerHTML = fuente as string;
      expect(svg.innerHTML).toBe(referencia.querySelector('svg')?.innerHTML);
      const registrado =
        (ICONOS as Record<string, string>)[nombre] ?? (GLIFOS as Record<string, string>)[nombre];
      expect(registrado).toBe(interior(fuente as string));
      expect(cabecera(fuente as string)).toContain(`stroke-width="${trazo}"`);
      expect(svg.getAttribute('stroke')).toBe('currentColor');
      expect(svg.getAttribute('fill')).toBe('none');
      expect(svg.getAttribute('stroke-width')).toBe(String(trazo));
      expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
      expect(svg.outerHTML).not.toMatch(/#[0-9a-f]{3,8}\b|rgb\(/i);
    },
  );

  it('PRU-CMP-VAL-101 acompañando un texto se oculta; solo, tiene nombre accesible', () => {
    const acompana = dibujar('check');
    expect(acompana.getAttribute('aria-hidden')).toBe('true');
    expect(acompana.hasAttribute('role')).toBe(false);
    const solo = dibujar('check', 'Conciliado');
    expect(solo.getAttribute('role')).toBe('img');
    expect(solo.getAttribute('aria-label')).toBe('Conciliado');
    expect(solo.hasAttribute('aria-hidden')).toBe(false);
  });
});
