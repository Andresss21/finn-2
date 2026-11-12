// Flujos del presupuesto portados de `pantallas/07-flujos-del-presupuesto` del export (CH-144; 07 §17: un texto o un estado es una
// CMP). Solo comprueban el marcado y las medidas (selección nativa con su detalle, «$» del monto, pie de dos columnas, tarjetas
// y pie fijo); los números los dice el servidor y los envíos los prueban las pruebas de cada flujo (PF-3).
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../app/globals.css';
import { OpcionesRapidas } from '../presupuesto-asignar-categoria/rapida';
import { FormularioArchivar } from '../presupuesto-categorias-archivar/formulario';
import { FormularioFusionar } from '../presupuesto-categorias-fusionar/formulario';
import { FormularioSacar } from '../presupuesto-categorias-sacar/formulario';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ replace: vi.fn(), back: vi.fn() }),
}));

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
  document.body.style.cssText = 'background: var(--fondo); color: var(--texto)';
  const nodo = document.createElement('div');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(ui);
  });
  montados.push({ raiz, nodo });
  return nodo;
}

const c = (n: number) => Math.round(n * 100) as never;
const sinAccion = () =>
  Promise.resolve({ ok: true as const, valor: {}, yaAplicada: false, avisos: [] });
const alto = (el: Element | null | undefined): number => el?.getBoundingClientRect().height ?? 0;
const boton = (nodo: HTMLElement, texto: string): HTMLButtonElement | undefined =>
  [...nodo.querySelectorAll('button')].find((b) => b.textContent === texto);

describe('PRU-CMP-PRES', () => {
  it('PRU-CMP-PRES-250 [FT-12] las opciones rápidas de Asignar se dibujan en una tarjeta de filas de 48 px que siguen siendo botones con su variante y su monto', () => {
    const nodo = montar(
      <OpcionesRapidas
        rapida={{ faltaMeta: c(75), igualPeriodoAnterior: c(100) }}
        faltaDeLaMeta={c(75)}
        deshabilitado={false}
        alElegir={vi.fn()}
      />,
    );
    const filas = [...nodo.querySelectorAll<HTMLElement>('[data-asignacion-rapida] button')];
    expect(filas.map((f) => f.dataset['variante'])).toEqual([
      'falta_meta',
      'igual_periodo_anterior',
    ]);
    expect(
      filas.map((f) => f.querySelector<HTMLElement>('[data-centavos]')?.dataset['centavos']),
    ).toEqual(['7500', '10000']);
    for (const f of filas) expect(alto(f)).toBeGreaterThanOrEqual(48);
    expect(nodo.querySelector('[data-asignacion-rapida] h3')?.textContent).toBe(
      'Asignación rápida',
    );
  });

  it('PRU-CMP-PRES-251 [FT-20] Fusionar dibuja el resumen en una tarjeta, la meta que se descarta como advertencia, la nota como información y el botón rojo en el pie fijo', () => {
    const nodo = montar(
      <FormularioFusionar
        accion={sinAccion}
        origen={{ id: 'o', nombre: 'Restaurantes' }}
        destinos={[{ id: 'd', nombre: 'Comida rápida' }]}
        resumen={{
          periodosConAsignacion: 7,
          transacciones: 41,
          condonaciones: 1,
          programadas: 0,
          reglas: 2,
          meta: { tipo: 'mensual' },
        }}
      />,
    );
    expect(nodo.querySelector('select')).not.toBeNull();
    expect(nodo.querySelectorAll('[aria-labelledby="fusion-resumen"] li')).toHaveLength(5);
    expect(nodo.textContent).toContain('Se descarta la meta de Restaurantes.');
    const fusionar = boton(nodo, 'Fusionar');
    expect(fusionar?.closest('form')).toBeNull();
    expect(alto(fusionar)).toBeGreaterThanOrEqual(44);
  });

  it('PRU-CMP-PRES-252 [FT-19] Sacar dibuja «Poner en» como selección nativa con el Disponible de cada destino, el monto con «$» y el pie «Cancelar» y «Sacar»', () => {
    const nodo = montar(
      <FormularioSacar
        accion={sinAccion}
        categoriaId="g"
        categoria="Supermercado"
        asignado={c(100)}
        disponible={c(62.85)}
        destinos={[{ id: 's', nombre: 'Salidas', asignado: c(10), disponible: c(5) }]}
        rutaPadre="/presupuesto"
        superpuesto={false}
      />,
    );
    expect(nodo.querySelector('select')).not.toBeNull();
    expect(nodo.querySelectorAll('[role="radiogroup"]')).toHaveLength(0);
    expect(nodo.textContent).toContain('Supermercado: Disponible $62.85.');
    expect(alto(boton(nodo, 'Cancelar'))).toBeGreaterThanOrEqual(44);
    expect(alto(boton(nodo, 'Sacar'))).toBeGreaterThanOrEqual(44);
  });

  it('PRU-CMP-PRES-253 [FT-19] Archivar dibuja el destino del Disponible como selección nativa, lo asignado a futuro en una tarjeta y «Archivar» en el pie fijo, fuera del formulario y de 44 px o más', () => {
    const nodo = montar(
      <FormularioArchivar
        accion={sinAccion}
        categoriaId="g"
        categoria="Supermercado"
        disponible={c(62.85)}
        futuras={1}
        programadas={[]}
        destinos={[{ id: 's', nombre: 'Salidas', disponible: c(5) }]}
      />,
    );
    expect(nodo.querySelector('select')).not.toBeNull();
    expect(nodo.querySelectorAll('[role="radiogroup"]')).toHaveLength(0);
    expect(nodo.querySelector('[data-futuras]')?.className).toContain('shadow-elevacion-1');
    const archivar = boton(nodo, 'Archivar Supermercado');
    expect(archivar?.closest('form')).toBeNull();
    expect(alto(archivar)).toBeGreaterThanOrEqual(44);
  });
});
