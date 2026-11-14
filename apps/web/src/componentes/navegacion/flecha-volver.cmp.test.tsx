// La flecha «Volver» de las pantallas hijas (05 §3.3, N8, con su enmienda de CH-288): vuelve a la pantalla anterior si se llegó
// navegando dentro de Finn en esta pestaña; si no (entrada directa, recarga, otro sitio, sin la API Navigation), a la
// `rutaPadre`; nunca a un flujo, a un panel ni a una pantalla con `?resultado=`. El historial de la pestaña es un doble de
// `window.navigation` (el límite externo): las entradas que el documento «vio» son las que recorre con `currententrychange`.
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FlechaVolver } from './flecha-volver';
import {
  anteriorEnFinn,
  etiquetaDeVuelta,
  registrarHistorial,
  type EntradaHistorial,
  type Historial,
} from './volver-anterior';

vi.mock('next/link', async () => {
  const { createElement } = await import('react');
  const Enlace = ({ href, children, ...resto }: { href: string; children?: ReactNode }) =>
    createElement('a', { href, ...resto }, children);
  return Object.assign(Enlace, { default: Enlace, useLinkStatus: () => ({ pending: false }) });
});

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const ORIGEN = window.location.origin;
let serie = 0;

/** Un historial con estas rutas. `vistas` = cuántas recorrió este documento, desde el final (la actual siempre). */
function historial(rutas: readonly string[], vistas = rutas.length): Historial {
  serie += 1;
  const entradas: EntradaHistorial[] = rutas.map((ruta, index) => ({
    key: `s${String(serie)}-${String(index)}`,
    url: ruta.startsWith('http') ? ruta : `${ORIGEN}${ruta}`,
    index,
  }));
  const escuchas = new Set<() => void>();
  let actual = entradas.length - vistas;
  const doble: Historial = {
    get currentEntry() {
      return entradas[actual] ?? null;
    },
    entries: () => entradas,
    addEventListener: (_tipo, escucha) => {
      escuchas.add(escucha);
    },
    removeEventListener: (_tipo, escucha) => {
      escuchas.delete(escucha);
    },
  };
  // El marco registra al montarse; después cada navegación dentro de Finn cambia la entrada actual.
  registrarHistorial(doble);
  while (actual < entradas.length - 1) {
    actual += 1;
    for (const escucha of escuchas) escucha();
  }
  return doble;
}

let montado: { raiz: Root; nodo: HTMLElement } | undefined;
afterEach(() => {
  if (montado !== undefined) {
    const { raiz, nodo } = montado;
    act(() => {
      raiz.unmount();
    });
    nodo.remove();
    montado = undefined;
  }
  Reflect.deleteProperty(window, 'navigation');
  vi.restoreAllMocks();
});

function montarFlecha(doble: Historial, href: string, etiqueta: string): HTMLAnchorElement {
  Object.defineProperty(window, 'navigation', { value: doble, configurable: true });
  const nodo = document.createElement('div');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(
      <FlechaVolver href={href} etiqueta={etiqueta} className="">
        ←
      </FlechaVolver>,
    );
  });
  montado = { raiz, nodo };
  const enlace = nodo.querySelector('a');
  if (enlace === null) throw new Error('sin flecha');
  return enlace;
}

/** Toca la flecha y dice si la flecha frenó el enlace (volvió en el historial). El enlace nunca navega la página de prueba. */
function tocar(enlace: HTMLAnchorElement): boolean {
  let frenado = false;
  const despues = (evento: MouseEvent) => {
    frenado = evento.defaultPrevented;
    evento.preventDefault();
  };
  window.addEventListener('click', despues);
  act(() => {
    enlace.click();
  });
  window.removeEventListener('click', despues);
  return frenado;
}

describe('PRU-CMP-PWA flecha «Volver» a la pantalla anterior', () => {
  it('PRU-CMP-PWA-823 [] desde Metas a «Ver la categoría», la flecha se llama «Volver a Metas» y vuelve un paso atrás en el historial; el enlace sigue apuntando a la rutaPadre', () => {
    const doble = historial(['/presupuesto', '/metas', '/presupuesto/categorias/c1']);
    expect(anteriorEnFinn(doble, ORIGEN)).toEqual({ pasos: 1, ruta: '/metas' });

    const ir = vi.spyOn(window.history, 'go').mockImplementation(() => undefined);
    const flecha = montarFlecha(doble, '/presupuesto', 'Volver a Presupuesto');
    expect(flecha.getAttribute('aria-label')).toBe('Volver a Metas');
    expect(flecha.getAttribute('href')).toBe('/presupuesto');
    expect(tocar(flecha)).toBe(true);
    expect(ir).toHaveBeenCalledWith(-1);

    // Las entradas de la misma pantalla (otro período) se saltan: vuelve a la pantalla anterior a todas.
    const periodos = historial([
      '/metas',
      '/presupuesto/categorias/c1?periodo=2026-10-21',
      '/presupuesto/categorias/c1?periodo=2026-11-21',
    ]);
    expect(anteriorEnFinn(periodos, ORIGEN)).toEqual({ pasos: 2, ruta: '/metas' });
    // El nombre es el de la sección si la anterior lo es; si no, el genérico.
    expect(etiquetaDeVuelta('/presupuesto?periodo=2026-10-21')).toBe('Volver a Presupuesto');
    expect(etiquetaDeVuelta('/reportes/tendencia')).toBe('Volver a Reportes');
    expect(etiquetaDeVuelta('/')).toBe('Volver a Inicio');
    expect(etiquetaDeVuelta('/cuentas/a1')).toBe('Volver');
  });

  it('PRU-CMP-PWA-824 [] sin una pantalla anterior de Finn vista en esta pestaña (entrada directa, recarga, otro sitio, sin la API Navigation) la flecha es el enlace a la rutaPadre con su nombre de siempre', () => {
    expect(anteriorEnFinn(historial(['/presupuesto/categorias/c1']), ORIGEN)).toBeNull();
    // Recarga: la anterior es de Finn, pero de otro documento.
    const recarga = historial(['/metas', '/presupuesto/categorias/c1'], 1);
    expect(anteriorEnFinn(recarga, ORIGEN)).toBeNull();
    expect(anteriorEnFinn(historial(['https://ejemplo.com/', '/cuentas/a1']), ORIGEN)).toBeNull();
    expect(anteriorEnFinn(undefined, ORIGEN)).toBeNull();

    const ir = vi.spyOn(window.history, 'go').mockImplementation(() => undefined);
    const flecha = montarFlecha(recarga, '/presupuesto?periodo=2026-10-21', 'Volver a Presupuesto');
    expect(flecha.getAttribute('aria-label')).toBe('Volver a Presupuesto');
    expect(tocar(flecha)).toBe(false);
    expect(ir).not.toHaveBeenCalled();
  });

  it('PRU-CMP-PWA-825 [] la flecha no vuelve a un flujo ni a un panel ya cerrados ni a una pantalla con el resultado de un flujo terminado: va a la rutaPadre', () => {
    const casos = [
      ['/metas/nueva', '/presupuesto/categorias/c1'],
      ['/metas/m1', '/presupuesto/categorias/c1'],
      ['/presupuesto/categorias/c1/sacar', '/presupuesto/categorias/c2'],
      ['/cuentas/nueva', '/cuentas/a1'],
      ['/ajustes/ciclo', '/ajustes/formatos'],
      ['/presupuesto/estructura?resultado=categoria:c9', '/presupuesto/categorias/c9'],
      ['/registrar/gasto', '/actividad/t1'],
    ] as const;
    for (const rutas of casos)
      expect(anteriorEnFinn(historial(rutas), ORIGEN), rutas[0]).toBeNull();

    // Una pantalla de verdad sí: la lista de Cuentas, Ajustes > Formatos y el detalle de una cuenta.
    expect(anteriorEnFinn(historial(['/cuentas', '/cuentas/a1']), ORIGEN)?.ruta).toBe('/cuentas');
    expect(
      anteriorEnFinn(historial(['/ajustes/formatos', '/ajustes/instituciones']), ORIGEN)?.ruta,
    ).toBe('/ajustes/formatos');
    expect(anteriorEnFinn(historial(['/cuentas/a1', '/actividad/t1']), ORIGEN)?.ruta).toBe(
      '/cuentas/a1',
    );
  });
});
