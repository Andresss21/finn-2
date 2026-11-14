// [CH-275] C-46 (ESTRUCTURA-Y-COLAPSO §1.3, §3 y §4; `docs/anexos/finn-estructura/`): ordenar la estructura arrastrando desde el
// asa. El gesto es el de dnd-kit (`@dnd-kit/core`, cargado con `import()`), con eventos de puntero y de teclado reales: 4 px desde
// el asa, Escape, `pointercancel` o soltar fuera de la pantalla. OP-08 se simula: qué acepta lo deciden el servidor, la integración
// y la E2E.
import type { GrupoDeEstructura } from '@finn/dominio/selectores';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import '../../app/globals.css';
import { EVENTO_ARRASTRE } from '../../componentes/marco/arrastre';
import { editarEnEstructura } from '../../servidor/acciones/categorias';
import { estructura as t } from '../../textos/estructura';
import { ListaEstructura } from './lista';

const enrutador = vi.hoisted(() => ({
  replace: vi.fn(),
  back: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  usePathname: () => '/presupuesto/estructura',
  useRouter: () => enrutador,
}));
vi.mock('next/link', async () => {
  const { createElement } = await import('react');
  const Enlace = ({ href, children, ...resto }: { href: string; children?: ReactNode }) =>
    createElement('a', { href, ...resto }, children);
  return Object.assign(Enlace, { default: Enlace, useLinkStatus: () => ({ pending: false }) });
});
vi.mock('../../servidor/acciones/categorias', () => ({
  editarEnEstructura: vi.fn(() =>
    Promise.resolve({ ok: true, valor: {}, yaAplicada: false, avisos: [] }),
  ),
  desarchivarCategoria: vi.fn(),
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const CLAVE = 'finn.colapsados.estructura';

const montados: { raiz: Root; nodo: HTMLElement }[] = [];
beforeEach(async () => {
  // Alto de sobra: la lista entera cabe y el autodesplazamiento no mueve nada mientras se mide.
  await page.viewport(414, 1800);
});
afterEach(() => {
  for (const { raiz, nodo } of montados.splice(0)) {
    act(() => {
      raiz.unmount();
    });
    nodo.remove();
  }
  vi.mocked(editarEnEstructura).mockClear();
  vi.restoreAllMocks();
  vi.useRealTimers();
  localStorage.clear();
});

let n = 0;
const ids = new Map<string, string>();
const id = (corto: string): string => {
  const ya = ids.get(corto);
  if (ya !== undefined) return ya;
  n += 1;
  const nuevo = `${String(n).padStart(8, '0')}-0000-4000-8000-000000000000`;
  ids.set(corto, nuevo);
  return nuevo;
};
type IdFinn = GrupoDeEstructura['grupo']['id'];
const grupo = (nombre: string, categorias: string[], sistema = false): GrupoDeEstructura => ({
  grupo: { id: id(nombre) as IdFinn, nombre, archivado: false, sistema },
  categorias: categorias.map((c) => ({
    categoria: { id: id(c) as IdFinn, nombre: c },
    clase: sistema ? 'pago_tarjeta' : 'normal',
    archivada: false,
    tieneMeta: false,
    puedeEliminar: true,
    puedeArchivar: true,
  })) as GrupoDeEstructura['categorias'],
});
const A7: readonly GrupoDeEstructura[] = [
  grupo('Casa', ['Supermercado', 'Luz y agua', 'Internet y teléfono', 'Farmacia']),
  grupo('Comida fuera', ['Restaurantes']),
  grupo('Transporte', ['Gasolina']),
  grupo('Ahorro', ['Fondo de emergencia', 'Viaje']),
  grupo('Pagos de tarjeta', ['Visa Oro'], true),
];

/** Monta la lista y espera a que llegue el arrastre (el asa queda con `data-arrastre`). */
async function montar(): Promise<void> {
  const nodo = document.createElement('div');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  await act(() => {
    raiz.render(<ListaEstructura grupos={A7} />);
    return Promise.resolve();
  });
  montados.push({ raiz, nodo });
  await vi.waitFor(() => {
    expect(asa('Farmacia').hasAttribute('data-arrastre')).toBe(true);
  });
}

const q = (sel: string): HTMLElement => {
  const e = document.querySelector<HTMLElement>(sel);
  if (e === null) throw new Error(`no hay ${sel}`);
  return e;
};
const asa = (c: string): HTMLElement => q(`button[aria-label="${t.moverCategoria(c)}"]`);
const asaGrupo = (g: string): HTMLElement => q(`button[aria-label="${t.moverGrupo(g)}"]`);
const seccion = (g: string): HTMLElement => q(`section[aria-labelledby="g-${id(g)}"]`);
const abierto = (g: string): string | null =>
  seccion(g).querySelector('h2 button')?.getAttribute('aria-expanded') ?? null;
const filasDe = (g: string): string[] =>
  [...seccion(g).querySelectorAll('[data-fila-cat]:not([data-hueco])')].map(
    (f) => f.firstElementChild?.textContent.trim().split(/\s/)[0] ?? '',
  );
const levantada = (): HTMLElement | null => document.querySelector('[data-fila-levantada]');
const anuncio = (): string => q('[data-anuncio="estructura"]').textContent;
const resultado = (): string =>
  document.querySelector('[data-testid="resultado"]')?.textContent ?? '';
const op08 = (): unknown[] => vi.mocked(editarEnEstructura).mock.calls.map((c) => c[0]);

/** Un evento de puntero del ratón principal en `x`, `y`. */
function puntero(tipo: string, en: EventTarget, x: number, y: number): void {
  en.dispatchEvent(
    new PointerEvent(tipo, {
      bubbles: true,
      cancelable: true,
      clientX: x,
      clientY: y,
      isPrimary: true,
      button: 0,
      pointerId: 1,
      pointerType: 'mouse',
    }),
  );
}
/** Termina los movimientos en curso (FLIP): las medidas son las del lugar final. */
const quietas = (): void => {
  for (const a of document.getAnimations()) a.finish();
};
const centro = (e: Element): { x: number; y: number } => {
  quietas();
  const r = e.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
};
let actual = { x: 0, y: 0 };
/** Presiona `e` y mueve `dy` px (4 px es el umbral: con 5 empieza el arrastre). */
async function presionar(e: Element, dy = 5): Promise<void> {
  const c = centro(e);
  await act(() => {
    puntero('pointerdown', e, c.x, c.y);
    puntero('pointermove', document, c.x, c.y + dy);
    return Promise.resolve();
  });
  actual = { x: c.x, y: c.y + dy };
}
async function moverA(x: number, y: number): Promise<void> {
  await act(() => {
    puntero('pointermove', document, x, y);
    return Promise.resolve();
  });
  actual = { x, y };
}
async function soltar(x = actual.x, y = actual.y): Promise<void> {
  await act(async () => {
    puntero('pointerup', document, x, y);
    await Promise.resolve();
  });
}
/** Debajo de una fila: el lugar que sigue a ella en su grupo. */
const debajoDe = (c: string): { x: number; y: number } => {
  quietas();
  const r = q(`[data-fila-cat="${id(c)}"]`).getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.bottom + 4 };
};

describe('PRU-CMP-CATEG-135 arrastrar una categoría desde el asa', () => {
  it('PRU-CMP-CATEG-135 [C-46] CA-E-3: con 4 px desde el asa de Farmacia aparecen el hueco punteado y la fila levantada con «→ última en Casa» y se anuncia «Tomaste Farmacia.»; presionar el cuerpo de la fila no arrastra; cerca del borde la lista se desplaza sola', async () => {
    await montar();
    // El cuerpo es el enlace a «Editar categoría»: presionarlo y moverlo no toma nada.
    const cuerpo = q(`[data-fila-cat="${id('Farmacia')}"] a`);
    expect(cuerpo.getAttribute('href')).toBe(`/presupuesto/estructura/categorias/${id('Farmacia')}`);
    await presionar(cuerpo, 12);
    await soltar();
    expect(levantada()).toBeNull();
    // Moverse 4 px no alcanza.
    await presionar(asa('Farmacia'), 4);
    expect(levantada()).toBeNull();
    await soltar();

    await presionar(asa('Farmacia'));
    expect(q(`[data-fila-cat="${id('Farmacia')}"]`).hasAttribute('data-hueco')).toBe(true);
    expect(levantada()?.textContent).toContain('Farmacia');
    expect(levantada()?.textContent).toContain(t.haciaCategoria('última', 'Casa'));
    expect(anuncio()).toBe(t.tomaste('Farmacia'));
    const hueco = q('[data-hueco] > div');
    expect(getComputedStyle(hueco).borderTopStyle).toBe('dashed');
    expect(getComputedStyle(hueco).minHeight).toBe('48px');

    const desplazar = vi.spyOn(window, 'scrollBy');
    await moverA(actual.x, window.innerHeight - 10);
    await vi.waitFor(() => {
      expect(desplazar).toHaveBeenCalled();
    });
    expect((desplazar.mock.calls[0]?.[1] as number) > 0).toBe(true);
    await moverA(actual.x, 300);
    desplazar.mockClear();
    await act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', bubbles: true }));
      return Promise.resolve();
    });
    expect(levantada()).toBeNull();
  });

  it('PRU-CMP-CATEG-135 [C-46] CA-E-4: sobre Comida fuera, debajo de Restaurantes, la tarjeta se resalta y el hueco va segundo; al soltar se envía un único OP-08 con grupoId y orden, Farmacia queda segunda y el resultado va debajo', async () => {
    await montar();
    await presionar(asa('Farmacia'));
    const p = debajoDe('Restaurantes');
    await moverA(p.x, p.y);
    expect(seccion('Comida fuera').querySelector('[data-destino]')).not.toBeNull();
    expect(seccion('Casa').querySelector('[data-destino]')).toBeNull();
    expect(levantada()?.textContent).toContain(t.haciaCategoria('segunda', 'Comida fuera'));
    expect(anuncio()).toBe(t.sobre('Comida fuera', 'la segunda', false));
    expect(seccion('Comida fuera').querySelector('[data-hueco]')).not.toBeNull();

    await soltar();
    await vi.waitFor(() => {
      expect(resultado()).toContain(t.movidaAGrupo('Farmacia', 'Comida fuera', 'la segunda'));
    });
    expect(op08()).toHaveLength(1);
    expect(op08()[0]).toMatchObject({
      tipo: 'categoria',
      id: id('Farmacia'),
      grupoId: id('Comida fuera'),
      orden: 2,
      esperado: { grupoId: id('Casa'), orden: 4 },
    });
    expect(filasDe('Comida fuera')).toEqual(['Restaurantes', 'Farmacia']);
    expect(
      q(`[data-fila-cat="${id('Farmacia')}"]`).querySelector('[data-testid="resultado"]'),
    ).not.toBeNull();
    expect(anuncio()).toBe(
      t.soltaste(t.movidaAGrupo('Farmacia', 'Comida fuera', 'la segunda')),
    );
    expect(levantada()).toBeNull();
    expect(seccion('Comida fuera').querySelector('[data-destino]')).toBeNull();
  });

  it('PRU-CMP-CATEG-135 [C-46] CA-E-7: sobre Ahorro colapsado se resalta el encabezado con «Soltá aquí…» y, soltando antes, Farmacia queda última en Ahorro y Ahorro se abre con el resultado', async () => {
    localStorage.setItem(CLAVE, JSON.stringify([id('Ahorro')]));
    await montar();
    await presionar(asa('Farmacia'));
    const c = centro(seccion('Ahorro').querySelector('[data-resumen]') ?? document.body);
    await moverA(c.x, c.y);
    expect(seccion('Ahorro').querySelector('[data-sobre-colapsado]')).not.toBeNull();
    expect(seccion('Ahorro').textContent).toContain(t.soltaAqui);
    expect(anuncio()).toBe(t.sobre('Ahorro', 'la última', true));
    expect(levantada()?.textContent).toContain(t.haciaCategoria('última', 'Ahorro'));
    expect(seccion('Ahorro').textContent).toContain(t.categorias(2));
    expect(document.querySelector('[data-hueco]')).toBeNull();

    await soltar();
    await vi.waitFor(() => {
      expect(resultado()).toContain(t.movidaAGrupo('Farmacia', 'Ahorro', 'la última'));
    });
    expect(op08()[0]).toMatchObject({ grupoId: id('Ahorro'), orden: 3 });
    expect(abierto('Ahorro')).toBe('true');
    expect(filasDe('Ahorro')).toEqual(['Fondo', 'Viaje', 'Farmacia']);
    expect(seccion('Ahorro').textContent).not.toContain(t.soltaAqui);
  });

  it('PRU-CMP-CATEG-135 [C-46] CA-E-7: quieto sobre Ahorro colapsado, a los 650 ms se abre, se anuncia «Se abrió Ahorro.» y se elige la posición entre sus filas', async () => {
    localStorage.setItem(CLAVE, JSON.stringify([id('Ahorro')]));
    await montar();
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    await presionar(asa('Farmacia'));
    const c = centro(seccion('Ahorro').querySelector('[data-resumen]') ?? document.body);
    await moverA(c.x, c.y);
    await act(() => {
      vi.advanceTimersByTime(649);
      return Promise.resolve();
    });
    expect(abierto('Ahorro')).toBe('false');
    await act(() => {
      vi.advanceTimersByTime(1);
      return Promise.resolve();
    });
    expect(abierto('Ahorro')).toBe('true');
    expect(anuncio()).toBe(t.seAbrio('Ahorro'));
    const p = debajoDe('Fondo de emergencia');
    await moverA(p.x, p.y);
    expect(filasDe('Ahorro')).toEqual(['Fondo', 'Viaje']);
    expect(levantada()?.textContent).toContain(t.haciaCategoria('segunda', 'Ahorro'));
    await soltar();
    await act(() => {
      vi.advanceTimersByTime(100);
      return Promise.resolve();
    });
    vi.useRealTimers();
    await vi.waitFor(() => {
      expect(op08()[0]).toMatchObject({ grupoId: id('Ahorro'), orden: 2 });
    });
  });
});

describe('PRU-CMP-CATEG-136 cancelar o soltar sin cambios', () => {
  it('PRU-CMP-CATEG-136 [C-46] CA-E-8: Escape, `pointercancel` y soltar fuera de la pantalla no envían nada, la fila vuelve a su lugar y se anuncia «Arrastre cancelado. Farmacia volvió a su lugar.»; soltar en el mismo lugar tampoco envía nada', async () => {
    await montar();
    const p = debajoDe('Restaurantes');
    const cancelar: (() => Promise<void>)[] = [
      () =>
        act(() => {
          document.dispatchEvent(
            new KeyboardEvent('keydown', { code: 'Escape', key: 'Escape', bubbles: true }),
          );
          return Promise.resolve();
        }),
      () =>
        act(() => {
          puntero('pointercancel', document, p.x, p.y);
          return Promise.resolve();
        }),
      () => soltar(p.x, -40),
    ];
    for (const forma of cancelar) {
      await presionar(asa('Farmacia'));
      await moverA(p.x, p.y);
      expect(filasDe('Comida fuera')).toEqual(['Restaurantes']);
      await forma();
      expect(levantada()).toBeNull();
      expect(document.querySelector('[data-hueco]')).toBeNull();
      expect(filasDe('Casa').at(-1)).toBe('Farmacia');
      expect(filasDe('Comida fuera')).toEqual(['Restaurantes']);
      expect(anuncio()).toBe(t.cancelado('Farmacia'));
      // La barra «Mover» no se abre por el gesto.
      expect(asa('Farmacia').getAttribute('aria-expanded')).toBe('false');
    }

    await presionar(asa('Farmacia'));
    await soltar();
    expect(anuncio()).toBe(t.mismoLugar('Farmacia'));
    await act(() => Promise.resolve());
    expect(op08()).toHaveLength(0);
  });

  it('PRU-CMP-CATEG-136 [C-46] CA-E-16: mientras dura el arrastre «Listo» queda `inert` y el marco recibe el aviso para la barra inferior; al soltar o cancelar se libera', async () => {
    await montar();
    const avisos: boolean[] = [];
    const oir = (e: Event): void => {
      avisos.push((e as CustomEvent<boolean>).detail);
    };
    window.addEventListener(EVENTO_ARRASTRE, oir);
    const listo = [...document.querySelectorAll('button')].find(
      (b) => b.textContent.trim() === t.listo,
    );
    expect(listo?.closest('[inert]')).toBeNull();
    await presionar(asa('Farmacia'));
    expect(listo?.closest('[inert]')).not.toBeNull();
    expect(avisos).toEqual([true]);
    await soltar();
    expect(listo?.closest('[inert]')).toBeNull();
    expect(avisos).toEqual([true, false]);
    window.removeEventListener(EVENTO_ARRASTRE, oir);
  });
});

describe('PRU-CMP-CATEG-137 arrastrar un grupo', () => {
  it('PRU-CMP-CATEG-137 [C-46] CA-E-9: tomar el asa de Ahorro colapsa todos los grupos con «→ último lugar · 2 categorías»; soltarlo segundo envía OP-08, deja «Moviste el grupo Ahorro: ahora es el segundo.» y los grupos vuelven a como estaban', async () => {
    localStorage.setItem(CLAVE, JSON.stringify([id('Transporte')]));
    await montar();
    await presionar(asaGrupo('Ahorro'));
    for (const g of ['Casa', 'Comida fuera', 'Transporte'])
      expect(abierto(g)).toBe('false');
    expect(anuncio()).toBe(t.tomasteGrupo('Ahorro'));
    expect(levantada()?.textContent).toContain(t.haciaGrupo('último', 2));
    expect(seccion('Ahorro').hasAttribute('data-hueco')).toBe(true);
    expect(JSON.parse(localStorage.getItem(CLAVE) ?? '[]')).toEqual([id('Transporte')]);

    quietas();
    const r = seccion('Comida fuera').getBoundingClientRect();
    await moverA(r.left + 40, r.top + 2);
    expect(levantada()?.textContent).toContain(t.haciaGrupo('segundo', 2));
    expect(anuncio()).toBe(t.grupoLugar('Ahorro', 'segundo'));
    await soltar();
    await vi.waitFor(() => {
      expect(resultado()).toContain(t.grupoMovido('Ahorro', 'el segundo'));
    });
    expect(op08()[0]).toMatchObject({ tipo: 'grupo', id: id('Ahorro'), orden: 2 });
    expect(anuncio()).toBe(t.soltaste(t.grupoMovido('Ahorro', 'el segundo')));
    expect(abierto('Casa')).toBe('true');
    expect(abierto('Comida fuera')).toBe('true');
    expect(abierto('Transporte')).toBe('false');
    const orden = [...document.querySelectorAll('section h2')].map((h) => h.textContent.trim());
    expect(orden.slice(0, 2)).toEqual(['Casa', 'Ahorro']);
  });
});

describe('PRU-CMP-CATEG-138 el movimiento del arrastre', () => {
  const flips = (): number =>
    [...document.querySelectorAll('[data-flip]')].filter((e) =>
      e.getAnimations().some((a) => a.id === 'flip'),
    ).length;
  const reglas = (): { selector: string; condicion: string; estilo: CSSStyleDeclaration }[] => {
    const salida: { selector: string; condicion: string; estilo: CSSStyleDeclaration }[] = [];
    const recorrer = (lista: CSSRuleList, condicion: string): void => {
      for (const r of Array.from(lista)) {
        if (r instanceof CSSStyleRule)
          salida.push({ selector: r.selectorText, condicion, estilo: r.style });
        else if (r instanceof CSSMediaRule) recorrer(r.cssRules, r.conditionText);
        else if ('cssRules' in r) recorrer((r as CSSGroupingRule).cssRules, condicion);
      }
    };
    for (const hoja of Array.from(document.styleSheets)) {
      try {
        recorrer(hoja.cssRules, '');
      } catch {
        // una hoja de otro origen no se lee
      }
    }
    return salida;
  };

  it('PRU-CMP-CATEG-138 [C-46] CA-E-15: lo que se corre al mover el hueco o al colapsar va de su lugar viejo al nuevo (FLIP) y la fila levantada toma escala 1.03 con `--elevacion-3`; con «reducir movimiento» nada se anima ni se escala y las tres señales quedan', async () => {
    await montar();
    await presionar(asa('Farmacia'));
    const fila = levantada();
    expect(fila?.classList.contains('fz-levantada')).toBe(true);
    const p = debajoDe('Restaurantes');
    await moverA(p.x, p.y);
    expect(flips()).toBeGreaterThan(0);
    await soltar(p.x, -40);
    await act(async () => {
      seccion('Casa').querySelector<HTMLButtonElement>('h2 button')?.click();
      await Promise.resolve();
    });
    expect(flips()).toBeGreaterThan(0);
    const levantar = reglas().find((r) => r.selector === '.fz-levantada' && r.condicion === '');
    expect(levantar?.estilo.getPropertyValue('scale')).toBe('1.03');
    expect(levantar?.estilo.getPropertyValue('box-shadow')).toContain('--elevacion-3');
    const quieta = reglas().find(
      (r) => r.selector === '.fz-levantada' && r.condicion.includes('prefers-reduced-motion: reduce'),
    );
    expect(quieta?.estilo.getPropertyValue('scale')).toBe('none');

    for (const e of document.querySelectorAll('[data-flip]'))
      for (const a of e.getAnimations()) a.finish();
    const original = window.matchMedia.bind(window);
    vi.spyOn(window, 'matchMedia').mockImplementation((consulta: string) =>
      consulta.includes('prefers-reduced-motion')
        ? ({ ...original(consulta), matches: true, media: consulta } as MediaQueryList)
        : original(consulta),
    );
    await act(async () => {
      seccion('Casa').querySelector<HTMLButtonElement>('h2 button')?.click();
      await Promise.resolve();
    });
    expect(flips()).toBe(0);
    await presionar(asa('Supermercado'));
    await moverA(p.x, debajoDe('Restaurantes').y);
    expect(flips()).toBe(0);
    // Las tres señales del destino siguen: el anillo, el glifo y el texto «→ …».
    expect(seccion('Comida fuera').querySelector('[data-destino]')).not.toBeNull();
    expect(levantada()?.querySelector('svg')).not.toBeNull();
    expect(levantada()?.textContent).toContain(t.haciaCategoria('segunda', 'Comida fuera'));
    await soltar(p.x, -40);
  });
});
