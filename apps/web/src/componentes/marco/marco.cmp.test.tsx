// El marco portado del export de diseño (CH-109; 06-identidad-visual §3; 05 §3.3): «Volver» de las pantallas hijas en la
// barra, «Más acciones» que cada pantalla llena y la campana que lleva a /notificaciones (FT-69).
// La forma (dónde se ve cada cosa en teléfono y en computadora) la prueba PRU-E2E-PWA-180.
import axe from 'axe-core';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import '../../app/globals.css';
import { navegacion } from '../../textos/navegacion';
import { salir } from '../../textos/salir';
import { Marco } from './marco';
import { PaginaFlujo } from './pagina-flujo';
import { PublicarAcciones } from './publicar-acciones';

// Solo el límite externo: `next/link` y `next/navigation` necesitan el enrutador de Next, que el navegador de prueba no tiene.
vi.mock('next/link', async () => {
  const { createElement } = await import('react');
  const Enlace = ({ href, children, ...resto }: { href: string; children?: ReactNode }) =>
    createElement('a', { href, ...resto }, children);
  return Object.assign(Enlace, { default: Enlace, useLinkStatus: () => ({ pending: false }) });
});
const ruta = vi.hoisted(() => ({ pathname: '/', busqueda: '' }));
vi.mock('next/navigation', () => ({
  usePathname: () => ruta.pathname,
  useSearchParams: () => new URLSearchParams(ruta.busqueda),
  useRouter: () => ({ refresh: () => undefined, replace: () => undefined, back: () => undefined }),
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const montados: { raiz: Root; nodo: HTMLElement }[] = [];
beforeEach(() => {
  ruta.pathname = '/';
  ruta.busqueda = '';
});
afterEach(() => {
  for (const { raiz, nodo } of montados.splice(0)) {
    act(() => {
      raiz.unmount();
    });
    nodo.remove();
  }
});

function montar(pathname: string, busqueda: string, pagina: ReactNode): HTMLElement {
  ruta.pathname = pathname;
  ruta.busqueda = busqueda;
  const nodo = document.createElement('div');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(<Marco>{pagina}</Marco>);
  });
  montados.push({ raiz, nodo });
  return nodo;
}

// Radix y el menú escuchan el puntero y el teclado de verdad: se opera fuera de `act`.
async function sinAct(accion: () => Promise<void>): Promise<void> {
  const entorno = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean };
  entorno.IS_REACT_ACT_ENVIRONMENT = false;
  try {
    await accion();
  } finally {
    entorno.IS_REACT_ACT_ENVIRONMENT = true;
  }
}

const enlaceVolver = (nodo: HTMLElement): HTMLAnchorElement | null =>
  nodo.querySelector<HTMLAnchorElement>('header a[aria-label^="Volver"]');

const ACCIONES = [
  {
    etiqueta: 'Editar nombre y grupo',
    ruta: '/presupuesto/estructura/categorias/c1',
    icono: 'edit',
  },
  { etiqueta: 'Mover dinero', ruta: '/presupuesto/mover?desde=c1', icono: 'swap' },
  {
    etiqueta: 'Eliminar',
    motivo: 'Tiene historial. Podés archivarla o fusionarla.',
    icono: 'trash',
    peligro: true,
  },
] as const;

describe('PRU-CMP-PWA', () => {
  it('PRU-CMP-PWA-180 [] en una pantalla hija la barra lleva «Volver a…» a su rutaPadre de 05 §3.3 (con el mismo período, o ?volver= si es interna) y no lleva Registrar ni «Más secciones»; en una principal es al revés', () => {
    const categoria = montar('/presupuesto/categorias/c1', 'periodo=2026-10-21', <main />);
    expect(enlaceVolver(categoria)?.getAttribute('href')).toBe('/presupuesto?periodo=2026-10-21');
    expect(enlaceVolver(categoria)?.getAttribute('aria-label')).toBe('Volver a Presupuesto');
    expect(categoria.querySelector('header a[href="/registrar"]')).toBeNull();
    expect(
      categoria.querySelector(`header button[aria-label="${navegacion.secundarias}"]`),
    ).toBeNull();
    expect(categoria.querySelector('#contenido')?.getAttribute('data-barra')).toBe('hija');

    const transaccion = montar('/actividad/t1', 'volver=%2Fcuentas%2Fa1', <main />);
    expect(enlaceVolver(transaccion)?.getAttribute('href')).toBe('/cuentas/a1');
    expect(enlaceVolver(transaccion)?.getAttribute('aria-label')).toBe('Volver a Cuentas');

    // Una ruta que no es interna (3.6) no se sigue: vuelve a la rutaPadre.
    const ajena = montar('/actividad/t1', 'volver=%2F%2Fejemplo.com', <main />);
    expect(enlaceVolver(ajena)?.getAttribute('href')).toBe('/actividad');

    const principal = montar('/presupuesto', '', <main />);
    expect(enlaceVolver(principal)).toBeNull();
    expect(principal.querySelector('header a[href="/registrar"]')).not.toBeNull();
    expect(
      principal.querySelector(`header button[aria-label="${navegacion.secundarias}"]`),
    ).not.toBeNull();
    expect(principal.querySelector('#contenido')?.getAttribute('data-barra')).toBe('principal');

    // Un flujo no es un detalle: `/cuentas/nueva` cuelga de Cuentas sin «Volver» de la barra (lo cierra `cerrarFlujo()`).
    expect(enlaceVolver(montar('/cuentas/nueva', '', <main />))).toBeNull();
  });

  it('PRU-CMP-PWA-300 [] las secundarias de Más secciones (Programadas, Metas, Por cobrar, Reglas, Reportes, Ajustes) no publican Registrar ni el menú en la barra del teléfono y sí la campana; las principales conservan los tres', () => {
    for (const secundaria of [
      '/programadas',
      '/metas',
      '/por-cobrar',
      '/reglas',
      '/reportes/tendencia',
      '/ajustes',
    ]) {
      const nodo = montar(secundaria, '', <main />);
      expect(nodo.querySelector('#contenido')?.getAttribute('data-barra')).toBe('secundaria');
      expect(nodo.querySelector('header a[href="/registrar"]')).toBeNull();
      expect(
        nodo.querySelector(`header button[aria-label="${navegacion.secundarias}"]`),
      ).toBeNull();
      expect(nodo.querySelector('header a[href="/notificaciones"]')).not.toBeNull();
    }
    for (const principal of ['/', '/presupuesto', '/actividad', '/cuentas']) {
      const nodo = montar(principal, '', <main />);
      expect(nodo.querySelector('#contenido')?.getAttribute('data-barra')).toBe('principal');
      expect(nodo.querySelector('header a[href="/registrar"]')).not.toBeNull();
      expect(
        nodo.querySelector(`header button[aria-label="${navegacion.secundarias}"]`),
      ).not.toBeNull();
    }
    // Las hijas de una secundaria siguen con su «Volver».
    expect(
      montar('/ajustes/seguridad', '', <main />)
        .querySelector('#contenido')
        ?.getAttribute('data-barra'),
    ).toBe('hija');
  });

  it('PRU-CMP-PWA-181 [] la campana de la barra es un enlace a /notificaciones con el contador en su nombre (CF-23): la ruta se intercepta como panel desde otra pantalla y es página completa al abrirla directamente', () => {
    const nodo = montar('/presupuesto', '', <main />);
    const campana = nodo.querySelector<HTMLAnchorElement>('header a[href="/notificaciones"]');
    expect(campana?.getAttribute('aria-label')).toBe(navegacion.notificaciones(null));
    expect(campana?.querySelector('svg, [data-glifo]')).not.toBeNull();
    // Ya no abre un panel propio: el panel es la ruta interceptada (@superpuesto/(.)notificaciones).
    expect(document.querySelector('[role=dialog]')).toBeNull();
  });

  it('PRU-CMP-PWA-182 [] «Más acciones» no se muestra sin acciones; con las que publica la pantalla abre un menú con el teclado, la no disponible con su motivo, y Escape lo cierra y devuelve el foco', async () => {
    const sin = montar('/presupuesto/categorias/c1', '', <main />);
    expect(sin.querySelector(`button[aria-label="${navegacion.masAcciones}"]`)).toBeNull();
    expect(sin.querySelector('#contenido')?.hasAttribute('data-acciones')).toBe(false);

    const nodo = montar(
      '/presupuesto/categorias/c1',
      '',
      <main>
        <PublicarAcciones titulo="Restaurantes" acciones={ACCIONES} />
      </main>,
    );
    // El menú se descarga diferido (no entra al JS compartido): el botón llega con su módulo.
    await vi.waitFor(() => {
      expect(nodo.querySelector(`button[aria-label="${navegacion.masAcciones}"]`)).not.toBeNull();
    });
    const boton = nodo.querySelector<HTMLButtonElement>(
      `button[aria-label="${navegacion.masAcciones}"]`,
    );
    expect(boton?.getAttribute('aria-haspopup')).toBe('menu');
    expect(boton?.getAttribute('aria-expanded')).toBe('false');
    expect(nodo.querySelector('#contenido')?.hasAttribute('data-acciones')).toBe(true);

    await sinAct(async () => {
      await userEvent.click(boton as HTMLButtonElement);
    });
    const menu = nodo.querySelector<HTMLElement>('[role=menu]');
    expect(menu?.getAttribute('aria-label')).toBe(navegacion.masAcciones);
    expect(boton?.getAttribute('aria-expanded')).toBe('true');
    const items = [...(menu?.querySelectorAll<HTMLElement>('[role=menuitem]') ?? [])];
    expect(items.map((i) => i.querySelector('span')?.firstChild?.textContent)).toEqual([
      'Editar nombre y grupo',
      'Mover dinero',
      'Eliminar',
    ]);
    expect(items[0]?.getAttribute('href')).toBe('/presupuesto/estructura/categorias/c1');
    expect(document.activeElement).toBe(items[0]);
    // La no disponible: deshabilitada, sin enlace y con el motivo como descripción.
    expect(items[2]?.getAttribute('aria-disabled')).toBe('true');
    expect(items[2]?.hasAttribute('href')).toBe(false);
    expect(items[2]?.textContent).toContain('Tiene historial. Podés archivarla o fusionarla.');

    await sinAct(async () => {
      await userEvent.keyboard('{ArrowDown}');
    });
    expect(document.activeElement).toBe(items[1]);
    await sinAct(async () => {
      await userEvent.keyboard('{ArrowUp}{ArrowUp}');
    });
    expect(document.activeElement).toBe(items[2]);

    const resultado = await axe.run(nodo, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa'] });
    expect(resultado.violations.map((v) => v.id)).toEqual([]);

    await sinAct(async () => {
      await userEvent.keyboard('{Escape}');
    });
    // [CH-220 C1] El menú sale con su animación y recién después se desmonta.
    await vi.waitFor(() => {
      expect(nodo.querySelector('[role=menu]')).toBeNull();
    });
    expect(boton?.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(boton);
  });
});

describe('PRU-CMP-PWA sin conexión', () => {
  it('PRU-CMP-PWA-340 [CA-E6-4] sin conexión, el aviso va en --marca sobre su texto, de 48 px de alto y radio 16, con la nube tachada y solo «Estás sin conexión»', () => {
    const enLinea = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    const raiz = montar(
      '/presupuesto',
      '',
      <main>
        <h1>Presupuesto</h1>
      </main>,
    );
    const banda = raiz.querySelector('[data-sin-conexion]') as HTMLElement;
    expect(banda.getAttribute('role')).toBe('status');
    expect(banda.textContent).toBe(navegacion.sinConexion);
    expect(banda.textContent).toBe('Estás sin conexión');
    expect(banda.querySelector('[data-icono="wifioff"]')).not.toBeNull();
    const sonda = document.createElement('span');
    sonda.style.cssText = 'color: var(--texto-sobre-marca); background-color: var(--marca)';
    document.body.append(sonda);
    const e = getComputedStyle(banda);
    expect(e.backgroundColor).toBe(getComputedStyle(sonda).backgroundColor);
    expect(e.color).toBe(getComputedStyle(sonda).color);
    sonda.remove();
    expect(e.borderTopLeftRadius).toBe('16px');
    expect(banda.getBoundingClientRect().height).toBe(48);
    enLinea.mockRestore();
  });
});

describe('PRU-CMP-PWA flujo de dos columnas', () => {
  it('PRU-CMP-PWA-711 [CA-E4-5] PaginaFlujo ancha: una sola columna (720 px) debajo de 1280 px de ventana, todo el ancho desde 1280, y el pie dentro del contenido', () => {
    const nodo = document.createElement('div');
    document.body.append(nodo);
    const raiz = createRoot(nodo);
    montados.push({ raiz, nodo });
    act(() => {
      raiz.render(
        <PaginaFlujo
          titulo="Registrar gasto"
          alCerrar={() => undefined}
          ancha
          acciones={<button>Guardar</button>}
        >
          <p>Campos</p>
        </PaginaFlujo>,
      );
    });
    const flujo = nodo.querySelector('main[data-pagina-flujo]') as HTMLElement;
    expect(flujo.className).toContain('md:[--ancho-pantalla:45rem]');
    expect(flujo.className).toContain('xl:[--ancho-pantalla:none]');
    expect(flujo.className).toContain('max-w-160');
    // El pie es hijo de la misma columna del contenido, no del marco.
    const pie = nodo.querySelector('button')?.parentElement as HTMLElement;
    expect(pie.parentElement).toBe(flujo);
  });
});

describe('PRU-CMP-PWA «Salir» a la vista', () => {
  /** El motivo enlazado con `aria-describedby` de un control. */
  const descripcion = (el: Element): string | null => {
    const id = el.getAttribute('aria-describedby');
    return id === null ? null : (document.getElementById(id)?.textContent ?? null);
  };

  it('PRU-CMP-PWA-781 [] CH-242: la hoja Más secciones y la barra lateral tienen «Salir» con logout, sin flecha; sin conexión, deshabilitado con su motivo', async () => {
    const nodo = montar('/', '', <main />);
    // Barra lateral: al pie, bajo la línea `--borde-sutil`, un botón (es una acción, no una sección).
    const pie = nodo.querySelector('aside [data-pieza="pie-salir"]') as HTMLElement;
    expect(pie.parentElement?.lastElementChild).toBe(pie);
    const lateral = pie.querySelector('button') as HTMLButtonElement;
    expect(lateral.textContent).toBe(salir.salir);
    expect(lateral.querySelector('[data-icono="logout"]')).not.toBeNull();
    expect(lateral.querySelector('[data-icono="chevR"]')).toBeNull();
    expect(lateral.disabled).toBe(false);
    expect(lateral.hasAttribute('aria-describedby')).toBe(false);

    // Hoja «Más secciones»: la última fila, después de la franja de 8 px y fuera de la lista de secciones.
    await sinAct(async () => {
      await userEvent.click(
        nodo.querySelector(`header button[aria-label="${navegacion.secundarias}"]`) as HTMLElement,
      );
    });
    const hoja = await vi.waitFor(() => {
      const d = document.querySelector<HTMLElement>('[role=dialog]');
      if (d === null) throw new Error('la hoja todavía no llegó');
      return d;
    });
    const botones = [...hoja.querySelectorAll('button')].filter(
      (b) => b.textContent === salir.salir,
    );
    expect(botones).toHaveLength(1);
    const fila = botones[0] as HTMLButtonElement;
    expect(fila.closest('ul')).toBeNull();
    expect(fila.parentElement?.lastElementChild).toBe(fila);
    const franja = fila.previousElementSibling as HTMLElement;
    expect(franja.getAttribute('aria-hidden')).toBe('true');
    expect(franja.getBoundingClientRect().height).toBe(8);
    expect(fila.querySelector('[data-icono="logout"]')).not.toBeNull();
    expect(fila.querySelector('[data-icono="chevR"]')).toBeNull();
    expect(fila.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    // Las secciones sí llevan su flecha.
    expect(hoja.querySelectorAll('ul [data-icono="chevR"]').length).toBeGreaterThan(0);

    // Sin conexión: los dos deshabilitados, con «Sin conexión: no se puede salir ahora.» enlazado.
    const enLinea = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    for (const boton of [lateral, fila]) {
      expect(boton.disabled).toBe(true);
      expect(descripcion(boton)).toBe(salir.sinConexion);
    }
    expect(salir.sinConexion).toBe('Sin conexión: no se puede salir ahora.');
    enLinea.mockRestore();
    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    expect(lateral.disabled).toBe(false);
    // Cerrar la hoja: el diálogo vive en `document.body`, fuera del nodo que se desmonta.
    await sinAct(async () => {
      await userEvent.keyboard('{Escape}');
    });
  });
});
