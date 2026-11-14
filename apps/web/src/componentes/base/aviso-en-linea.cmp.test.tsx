// [CH-286] Avisos en línea: línea compacta (C-51; `docs/anexos/finn-avisos-en-linea/AVISOS-EN-LINEA.md` §2, §3 y §6). Un solo
// componente para toda la familia, medido en un navegador real con los estilos de verdad: la pastilla del marco (versión nueva y
// sin conexión), el rectángulo con descripción, el problema con su borde, el aviso dentro de una superficie, el tono nombrado para
// el lector y la acción como enlace de texto. Los CA-L-n de PROMPT-AVISOS.md §4 van en el texto del título.
import axe from 'axe-core';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../app/globals.css';
import { formularios } from '../../textos/formularios';
import { navegacion } from '../../textos/navegacion';
import { ErrorDeFlujo } from '../formularios/error-de-flujo';
import { AvisosDelMarco, publicarVersionNueva } from '../marco/avisos-del-marco';
import { AvisoEnLinea } from './aviso';
import { Boton } from './boton';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const montados: { raiz: Root; nodo: HTMLElement }[] = [];
afterEach(() => {
  for (const { raiz, nodo } of montados.splice(0)) {
    act(() => {
      raiz.unmount();
    });
    nodo.remove();
  }
  act(() => {
    publicarVersionNueva(null);
  });
  delete document.documentElement.dataset['theme'];
});

function montar(ui: ReactNode): HTMLElement {
  document.body.style.cssText = 'background: var(--fondo); color: var(--texto)';
  const nodo = document.createElement('div');
  nodo.style.width = '390px';
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(ui);
  });
  montados.push({ raiz, nodo });
  return nodo;
}

/** El valor resuelto de un token para una propiedad de color. */
function token(nombre: string, propiedad: 'color' | 'backgroundColor' = 'color'): string {
  const sonda = document.createElement('span');
  sonda.style.setProperty(propiedad === 'color' ? 'color' : 'background-color', `var(${nombre})`);
  document.body.append(sonda);
  const v = getComputedStyle(sonda)[propiedad];
  sonda.remove();
  return v;
}
function contraste(a: string, b: string): number {
  const lum = (c: string) => {
    const [r = 0, g = 0, bl = 0] = (c.match(/[\d.]+/g) ?? []).map(Number).map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m) as [number, number];
  // Con dos decimales, como los da AVISOS-EN-LINEA §6.
  return Math.round(((x + 0.05) / (y + 0.05)) * 100) / 100;
}
const q = (n: ParentNode, s: string): HTMLElement => {
  const e = n.querySelector<HTMLElement>(s);
  if (e === null) throw new Error(`falta ${s}`);
  return e;
};
const avisos = (n: ParentNode) => [...n.querySelectorAll<HTMLElement>('[data-aviso-en-linea]')];
const glifo = (a: HTMLElement) => q(a, '.fz-aviso-glifo');
const caja = (e: Element) => e.getBoundingClientRect();
const oculto = (a: HTMLElement) => q(a, '.sr-only').textContent;

describe('PRU-CMP-VAL-900 el aviso en línea compacto', () => {
  it('PRU-CMP-VAL-900 [C-51] CA-L-1: la versión nueva es una pastilla --superficie-elevada de 48 px con refresh en --informacion-texto, el texto y «Recargar» a la derecha como enlace de texto de 44 px, sin caja teñida; Recargar activa la versión que espera', () => {
    const espera = { postMessage: vi.fn() } as unknown as ServiceWorker;
    const nodo = montar(<AvisosDelMarco sinConexion={null} />);
    expect(avisos(nodo)).toHaveLength(0);
    act(() => {
      publicarVersionNueva(espera);
    });
    const [aviso] = avisos(nodo) as [HTMLElement];
    expect(aviso.dataset['forma']).toBe('pastilla');
    expect(aviso.getAttribute('role')).toBe('status');
    const e = getComputedStyle(aviso);
    expect(e.backgroundColor).toBe(token('--superficie-elevada', 'backgroundColor'));
    expect(e.borderTopLeftRadius).toBe('999px');
    expect(caja(aviso).height).toBe(48);
    expect(e.boxShadow).toBe('none');
    expect(glifo(aviso).querySelector('[data-icono="refresh"]')).not.toBeNull();
    expect(getComputedStyle(glifo(aviso)).color).toBe(token('--informacion-texto'));
    expect(aviso.textContent).toContain(formularios.versionNueva);
    const recargar = q(aviso, '.fz-aviso-accion button');
    expect(recargar.textContent).toBe(formularios.recargar);
    const r = getComputedStyle(recargar);
    expect(r.backgroundColor).toBe('rgba(0, 0, 0, 0)');
    expect(r.color).toBe(token('--enlace'));
    expect(r.fontWeight).toBe('700');
    expect(r.textDecorationLine).toBe('none');
    expect(caja(recargar).height).toBe(44);
    expect(caja(recargar).left).toBeGreaterThan(caja(q(aviso, '.fz-aviso-titulo')).right);
    act(() => {
      recargar.click();
    });
    expect(espera.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
  });

  it('PRU-CMP-VAL-900 [C-51] CA-L-2: sin conexión es la misma pastilla, con wifioff en --advertencia-texto y sin --marca; con una versión nueva también, sin conexión va primero', () => {
    const nodo = montar(<AvisosDelMarco sinConexion={navegacion.sinConexion} />);
    act(() => {
      publicarVersionNueva({ postMessage: vi.fn() } as unknown as ServiceWorker);
    });
    const [primero, segundo] = avisos(nodo) as [HTMLElement, HTMLElement];
    expect(primero.hasAttribute('data-sin-conexion')).toBe(true);
    expect(primero.dataset['forma']).toBe('pastilla');
    expect(caja(primero).height).toBe(48);
    expect(getComputedStyle(primero).backgroundColor).toBe(
      token('--superficie-elevada', 'backgroundColor'),
    );
    expect(getComputedStyle(primero).backgroundColor).not.toBe(token('--marca', 'backgroundColor'));
    expect(glifo(primero).querySelector('[data-icono="wifioff"]')).not.toBeNull();
    expect(getComputedStyle(glifo(primero)).color).toBe(token('--advertencia-texto'));
    expect(oculto(primero)).toBe('Advertencia: ');
    expect(primero.textContent).toBe(`Advertencia: ${navegacion.sinConexion}`);
    expect(segundo.hasAttribute('data-version-nueva')).toBe(true);
    expect(caja(segundo).top).toBeGreaterThan(caja(primero).bottom);
  });

  it('PRU-CMP-VAL-900 [C-51] CA-L-3: con descripción es un rectángulo --radio-contenedor; la descripción va en su propia línea en --texto-secundario y la acción es un enlace debajo, alineado con el texto, aunque llegue como botón con fondo', () => {
    const nodo = montar(
      <AvisoEnLinea
        estado="informacion"
        icono="lock"
        titulo="Período cerrado · 21/08–20/09"
        accion={<Boton variante="secundaria">Ir al período actual</Boton>}
      >
        No se puede cambiar lo asignado en un período cerrado.
      </AvisoEnLinea>,
    );
    const [aviso] = avisos(nodo) as [HTMLElement];
    expect(aviso.dataset['forma']).toBe('rectangulo');
    expect(getComputedStyle(aviso).borderTopLeftRadius).toBe('16px');
    const titulo = q(aviso, '.fz-aviso-titulo');
    const descripcion = q(aviso, '.fz-aviso-descripcion');
    expect(getComputedStyle(titulo).fontWeight).toBe('600');
    expect(getComputedStyle(titulo).color).toBe(token('--texto'));
    expect(getComputedStyle(descripcion).color).toBe(token('--texto-secundario'));
    expect(getComputedStyle(descripcion).fontWeight).toBe('400');
    expect(caja(descripcion).top).toBeGreaterThanOrEqual(caja(titulo).bottom);
    const accion = q(aviso, '.fz-aviso-accion button');
    expect(getComputedStyle(accion).backgroundColor).toBe('rgba(0, 0, 0, 0)');
    expect(getComputedStyle(accion).color).toBe(token('--enlace'));
    expect(caja(accion).height).toBe(44);
    expect(caja(accion).top).toBeGreaterThanOrEqual(caja(descripcion).bottom);
    // Alineada con el texto: el relleno del enlace queda afuera, el texto empieza donde empieza el título.
    const texto = document.createRange();
    texto.selectNodeContents(accion);
    expect(Math.abs(texto.getBoundingClientRect().left - caja(titulo).left)).toBeLessThanOrEqual(1);
    // La forma no tiñe: ningún aviso usa --{tono}-fondo.
    expect(getComputedStyle(aviso).backgroundColor).not.toBe(
      token('--informacion-fondo', 'backgroundColor'),
    );
  });

  it('PRU-CMP-VAL-900 [C-51] CA-L-4: el error de formulario (E6-5) lleva el borde interior de 1 px --problema-borde, el glifo dang y role=alert, con «Intentar de nuevo» como enlace de texto', () => {
    const nodo = montar(
      <ErrorDeFlujo
        tipo="corto"
        error={{
          categoria: 'OCUPADO',
          codigo: 'ocupado',
          mensaje: 'Finn está terminando otra operación.',
        }}
        alReintentar={vi.fn()}
      />,
    );
    const [aviso] = avisos(nodo) as [HTMLElement];
    expect(aviso.getAttribute('role')).toBe('alert');
    expect(aviso.closest('[data-error-de-flujo]')).not.toBeNull();
    expect(glifo(aviso).querySelector('[data-icono="dang"]')).not.toBeNull();
    expect(getComputedStyle(glifo(aviso)).color).toBe(token('--problema-texto'));
    const borde = token('--problema-borde');
    expect(getComputedStyle(aviso).boxShadow).toBe(`${borde} 0px 0px 0px 1px inset`);
    expect(oculto(aviso)).toBe('Problema: ');
    const reintentar = q(aviso, '.fz-aviso-accion button');
    expect(reintentar.textContent).toBe(formularios.intentarDeNuevo);
    expect(getComputedStyle(reintentar).backgroundColor).toBe('rgba(0, 0, 0, 0)');
  });

  it.each(['claro', 'oscuro'])(
    'PRU-CMP-VAL-900 [C-51] CA-L-5: en el tema %s, dentro de una hoja o un panel el aviso va en --superficie-hundida y se distingue del panel',
    (tema) => {
      document.documentElement.dataset['theme'] = tema;
      const nodo = montar(
        <div className="bg-superficie p-5" data-panel>
          <AvisoEnLinea estado="advertencia" titulo="Restaurantes va a quedar en −$12.40">
            Queda sobregirada.
          </AvisoEnLinea>
        </div>,
      );
      const [aviso] = avisos(nodo) as [HTMLElement];
      const fondo = getComputedStyle(aviso).backgroundColor;
      expect(fondo).toBe(token('--superficie-hundida', 'backgroundColor'));
      expect(fondo).not.toBe(getComputedStyle(q(nodo, '[data-panel]')).backgroundColor);
    },
  );

  it.each(['claro', 'oscuro'])(
    'PRU-CMP-VAL-900 [C-51] CA-L-12: en el tema %s el lector oye el tono antes del título, la acción mide 44 px, los contrastes de §6 se cumplen sobre los dos fondos y axe no reporta violaciones',
    async (tema) => {
      document.documentElement.dataset['theme'] = tema;
      const lista = (
        <>
          <AvisoEnLinea estado="informacion" titulo="Información">
            Descripción
          </AvisoEnLinea>
          <AvisoEnLinea estado="advertencia" accion={<a href="/presupuesto">Ver</a>}>
            Advertencia
          </AvisoEnLinea>
          <AvisoEnLinea estado="problema" aparecioDespues>
            Problema
          </AvisoEnLinea>
          <AvisoEnLinea estado="positivo">Listo</AvisoEnLinea>
        </>
      );
      const nodo = montar(
        <main>
          {lista}
          <div className="bg-superficie p-5">{lista}</div>
        </main>,
      );
      const todos = avisos(nodo);
      expect(todos.slice(0, 4).map(oculto)).toEqual([
        'Información: ',
        'Advertencia: ',
        'Problema: ',
        'Listo: ',
      ]);
      for (const a of todos) {
        // El nombre del tono va antes del título, dentro de él.
        expect(q(a, '.fz-aviso-titulo').firstElementChild?.className).toContain('sr-only');
        const fondo = getComputedStyle(a).backgroundColor;
        expect(contraste(getComputedStyle(glifo(a)).color, fondo)).toBeGreaterThanOrEqual(4.5);
        const d = a.querySelector('.fz-aviso-descripcion');
        if (d !== null)
          expect(contraste(getComputedStyle(d).color, fondo)).toBeGreaterThanOrEqual(6.87);
        const acc = a.querySelector('.fz-aviso-accion a');
        if (acc !== null) {
          expect(caja(acc).height).toBe(44);
          expect(contraste(getComputedStyle(acc).color, fondo)).toBeGreaterThanOrEqual(5.53);
        }
        if (a.dataset['estado'] === 'problema')
          expect(contraste(token('--problema-borde'), fondo)).toBeGreaterThanOrEqual(3);
      }
      const { violations } = await axe.run(nodo, {
        runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
      });
      expect(violations.map((v) => v.id)).toEqual([]);
    },
  );

  it('PRU-CMP-VAL-900 [C-51] la × va solo en las bandas de C-50 §9: 44 × 44, «Cerrar este aviso», glifo x en --texto-secundario', () => {
    const cerrar = vi.fn();
    const nodo = montar(
      <>
        <AvisoEnLinea estado="problema" titulo="No se aprobaron 2 movimientos" alCerrar={cerrar}>
          TEXACO LA MASCOTA requiere revisión individual.
        </AvisoEnLinea>
        <AvisoEnLinea estado="informacion">Sin ×</AvisoEnLinea>
      </>,
    );
    const [banda, otro] = avisos(nodo) as [HTMLElement, HTMLElement];
    const x = q(banda, 'button[aria-label="Cerrar este aviso"]');
    expect([caja(x).width, caja(x).height]).toEqual([44, 44]);
    expect(getComputedStyle(x).color).toBe(token('--texto-secundario'));
    act(() => {
      x.click();
    });
    expect(cerrar).toHaveBeenCalledOnce();
    expect(otro.querySelector('button')).toBeNull();
  });
});
