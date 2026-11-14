// [CH-272] C-46 (ESTRUCTURA-Y-COLAPSO §1; `docs/anexos/finn-estructura/`): los grupos de la estructura se colapsan y se recuerdan
// en el dispositivo; el asa de cada categoría y cada grupo abre la barra «Mover» (Subir y Bajar que cruzan de grupo, Otro grupo y
// Listo) y el resultado queda debajo de lo que se movió, con «Deshacer» y «Cerrar este aviso». El arrastre llega en el PR siguiente.
// OP-08 se simula: qué acepta lo deciden el servidor, la integración y la E2E.
import type { GrupoDeEstructura } from '@finn/dominio/selectores';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import '../../app/globals.css';
import { editarEnEstructura } from '../../servidor/acciones/categorias';
import { base } from '../../textos/base';
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
function desmontar(): void {
  for (const { raiz, nodo } of montados.splice(0)) {
    act(() => {
      raiz.unmount();
    });
    nodo.remove();
  }
}
afterEach(() => {
  desmontar();
  vi.mocked(editarEnEstructura).mockClear();
  localStorage.clear();
});
async function montar(ui: ReactNode = <ListaEstructura grupos={A7} />): Promise<HTMLElement> {
  const nodo = document.createElement('div');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  await act(() => {
    raiz.render(ui);
    return Promise.resolve();
  });
  montados.push({ raiz, nodo });
  return nodo;
}

let n = 0;
const ids = new Map<string, string>();
/** Un Uuid estable por nombre corto. */
const id = (corto: string): string => {
  const ya = ids.get(corto);
  if (ya !== undefined) return ya;
  n += 1;
  const nuevo = `${String(n).padStart(8, '0')}-0000-4000-8000-000000000000`;
  ids.set(corto, nuevo);
  return nuevo;
};
type IdFinn = GrupoDeEstructura['grupo']['id'];
const grupo = (
  nombre: string,
  categorias: string[],
  extra: { sistema?: boolean; archivadas?: string[] } = {},
): GrupoDeEstructura => ({
  grupo: { id: id(nombre) as IdFinn, nombre, archivado: false, sistema: extra.sistema ?? false },
  categorias: [...categorias, ...(extra.archivadas ?? [])].map((c) => ({
    categoria: { id: id(c) as IdFinn, nombre: c },
    clase: extra.sistema === true ? 'pago_tarjeta' : 'normal',
    archivada: extra.archivadas?.includes(c) ?? false,
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
  grupo('Pagos de tarjeta', ['Visa Oro'], { sistema: true }),
];

const q = (sel: string): HTMLElement => {
  const e = document.querySelector<HTMLElement>(sel);
  if (e === null) throw new Error(`no hay ${sel}`);
  return e;
};
const porNombre = (nombre: string): HTMLButtonElement => {
  const b = [...document.querySelectorAll('button')].find(
    (x) => (x.getAttribute('aria-label') ?? x.textContent.trim()) === nombre,
  );
  if (b === undefined) throw new Error(`no hay un botón «${nombre}»`);
  return b;
};
const seccion = (g: string): HTMLElement => q(`section[aria-labelledby="g-${id(g)}"]`);
const alternar = (g: string): HTMLButtonElement =>
  seccion(g).querySelector<HTMLButtonElement>('h2 button') ?? porNombre(g);
const filasDe = (g: string): string[] =>
  [...seccion(g).querySelectorAll('[data-fila-cat]')].map(
    (f) => f.firstElementChild?.textContent.trim().split(/\s/)[0] ?? '',
  );
const fila = (c: string): HTMLElement => q(`[data-fila-cat="${id(c)}"]`);
const resultados = (): HTMLElement[] => [
  ...document.querySelectorAll<HTMLElement>('[data-testid="resultado"]'),
];
const anuncio = (): string => q('[data-anuncio="estructura"]').textContent;
const barra = (): HTMLElement | null =>
  document.querySelector('[role="group"][aria-label^="Mover"]');
/** Un botón de la barra abierta, por su texto. */
const enBarra = (texto: string): HTMLElement =>
  [...(barra()?.querySelectorAll('button') ?? [])].find((b) => b.textContent === texto) ??
  document.body;
const op08 = (i = 0): unknown => vi.mocked(editarEnEstructura).mock.calls[i]?.[0];

describe('PRU-CMP-CATEG-131 colapsar los grupos de la estructura', () => {
  it('PRU-CMP-CATEG-131 [C-46] CA-E-1: tocar el nombre de Transporte lo colapsa con «1 categoría · Gasolina», aria-expanded en false y el anuncio; se recuerda en el dispositivo al volver a abrir y el resumen lo expande', async () => {
    await montar();
    expect(alternar('Transporte').getAttribute('aria-expanded')).toBe('true');
    await userEvent.click(alternar('Transporte'));
    expect(alternar('Transporte').getAttribute('aria-expanded')).toBe('false');
    expect(seccion('Transporte').textContent).toContain(t.categorias(1));
    expect(seccion('Transporte').textContent).toContain('Gasolina');
    expect(filasDe('Transporte')).toEqual([]);
    expect(anuncio()).toBe(t.colapsaste('Transporte'));
    expect(JSON.parse(localStorage.getItem(CLAVE) ?? '[]')).toEqual([id('Transporte')]);

    desmontar();
    await montar();
    expect(alternar('Transporte').getAttribute('aria-expanded')).toBe('false');
    const resumen = seccion('Transporte').querySelector<HTMLButtonElement>('button[data-resumen]');
    expect(resumen?.getAttribute('aria-expanded')).toBe('false');
    await userEvent.click(resumen ?? document.body);
    expect(alternar('Transporte').getAttribute('aria-expanded')).toBe('true');
    expect(anuncio()).toBe(t.expandiste('Transporte'));
  });

  it('PRU-CMP-CATEG-131 [C-46] CA-E-2: «Colapsar todos» deja cada grupo de usuario con su resumen («4 categorías», «Supermercado, Luz y agua y 2 más») y Pagos de tarjeta igual; el botón pasa a «Expandir todos»', async () => {
    await montar();
    await userEvent.click(porNombre(t.colapsarTodos));
    for (const g of ['Casa', 'Comida fuera', 'Transporte', 'Ahorro'])
      expect(alternar(g).getAttribute('aria-expanded')).toBe('false');
    expect(seccion('Casa').textContent).toContain(t.categorias(4));
    expect(seccion('Casa').textContent).toContain('Supermercado, Luz y agua y 2 más');
    expect(seccion('Pagos de tarjeta').textContent).toContain('Visa Oro');
    expect(anuncio()).toBe(t.colapsasteTodos);
    await userEvent.click(porNombre(t.expandirTodos));
    expect(alternar('Casa').getAttribute('aria-expanded')).toBe('true');
    expect(anuncio()).toBe(t.expandisteTodos);
  });
});

describe('PRU-CMP-CATEG-132 la barra «Mover» de una categoría', () => {
  it('PRU-CMP-CATEG-132 [C-46] CA-E-12: Enter sobre el asa de Farmacia abre la barra con su estado y el foco en «Subir»; «Subir» la deja tercera con un OP-08, el resultado va debajo y el foco sigue en «Subir»; «Listo» devuelve el foco al asa. Las filas no tienen flechas', async () => {
    await montar();
    expect(
      document.querySelectorAll(`[data-fila-cat] button[aria-label^="${t.subir} "]`),
    ).toHaveLength(0);
    const asa = porNombre(t.moverCategoria('Farmacia'));
    expect(asa.getAttribute('aria-expanded')).toBe('false');
    asa.focus();
    await userEvent.keyboard('{Enter}');
    expect(asa.getAttribute('aria-expanded')).toBe('true');
    expect(barra()?.textContent).toContain(t.esDe('Farmacia', 'la última', 'Casa'));
    expect(anuncio()).toBe(t.anuncioMover('Farmacia', 'la última', 'Casa'));
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(porNombre(t.subirA('Farmacia')));
    });

    await userEvent.click(porNombre(t.subirA('Farmacia')));
    await vi.waitFor(() => {
      expect(resultados()[0]?.textContent).toContain(
        t.movidaEnGrupo('Farmacia', 'la tercera', 'Casa'),
      );
    });
    expect(op08()).toMatchObject({
      tipo: 'categoria',
      id: id('Farmacia'),
      orden: 3,
      esperado: { orden: 4 },
    });
    expect(filasDe('Casa')).toEqual(['Supermercado', 'Luz', 'Farmacia', 'Internet']);
    expect(fila('Farmacia').contains(resultados()[0] ?? null)).toBe(true);
    expect(barra()?.textContent).toContain(t.esDe('Farmacia', 'la tercera', 'Casa'));
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(porNombre(t.subirA('Farmacia')));
    });

    await userEvent.click(enBarra(t.listo));
    expect(barra()).toBeNull();
    expect(document.activeElement).toBe(porNombre(t.moverCategoria('Farmacia')));
    expect(anuncio()).toBe(t.barraCerrada);
  });

  it('PRU-CMP-CATEG-132 [C-46] CA-E-13: «Subir» la primera de Comida fuera la lleva al final de Casa, que estaba colapsado y se abre; en el primer lugar de todos «Subir» está deshabilitado', async () => {
    localStorage.setItem(CLAVE, JSON.stringify([id('Casa')]));
    await montar();
    expect(alternar('Casa').getAttribute('aria-expanded')).toBe('false');
    await userEvent.click(porNombre(t.moverCategoria('Restaurantes')));
    await userEvent.click(porNombre(t.subirA('Restaurantes')));
    await vi.waitFor(() => {
      expect(resultados()[0]?.textContent).toContain(
        t.movidaAGrupo('Restaurantes', 'Casa', 'la última'),
      );
    });
    expect(op08()).toMatchObject({
      grupoId: id('Casa'),
      orden: 5,
      esperado: { grupoId: id('Comida fuera'), orden: 1 },
    });
    expect(alternar('Casa').getAttribute('aria-expanded')).toBe('true');
    expect(filasDe('Casa').at(-1)).toBe('Restaurantes');
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(porNombre(t.subirA('Restaurantes')));
    });

    await userEvent.click(porNombre(t.moverCategoria('Supermercado')));
    expect(porNombre(t.subirA('Supermercado')).getAttribute('aria-disabled')).toBe('true');
    expect(porNombre(t.bajarA('Supermercado')).getAttribute('aria-disabled')).toBe(null);
  });

  it('PRU-CMP-CATEG-132 [C-46] CA-E-14: «Otro grupo» abre «Llevarla al final de:» con un botón por grupo; Ahorro la deja última en Ahorro', async () => {
    await montar();
    await userEvent.click(porNombre(t.moverCategoria('Farmacia')));
    const otro = porNombre(t.otroGrupo);
    expect(otro.getAttribute('aria-expanded')).toBe('false');
    await userEvent.click(otro);
    expect(otro.getAttribute('aria-expanded')).toBe('true');
    expect(barra()?.textContent).toContain(t.llevarlaA);
    await userEvent.click(enBarra('Ahorro'));
    await vi.waitFor(() => {
      expect(filasDe('Ahorro')).toEqual(['Fondo', 'Viaje', 'Farmacia']);
    });
    expect(op08()).toMatchObject({ grupoId: id('Ahorro'), orden: 3 });
    expect(resultados()[0]?.textContent).toContain(
      t.movidaAGrupo('Farmacia', 'Ahorro', 'la última'),
    );
  });
});

describe('PRU-CMP-CATEG-133 el resultado en el lugar', () => {
  it('PRU-CMP-CATEG-133 [C-46] CA-E-5 y CA-E-6: «Deshacer» manda el OP-08 inverso y deja «Farmacia volvió a su lugar: la última de Casa.» sin «Deshacer»; mover otra deja un solo resultado, debajo de ella; «Cerrar este aviso» (44 × 44) lo quita', async () => {
    await montar();
    await userEvent.click(porNombre(t.moverCategoria('Farmacia')));
    await userEvent.click(porNombre(t.subirA('Farmacia')));
    await vi.waitFor(() => {
      expect(resultados()).toHaveLength(1);
    });
    await userEvent.click(porNombre(t.deshacer));
    await vi.waitFor(() => {
      expect(resultados()[0]?.textContent).toContain(t.volvio('Farmacia', 'la última', 'Casa'));
    });
    expect(op08(1)).toMatchObject({ orden: 4, esperado: { orden: 3 } });
    expect(filasDe('Casa').at(-1)).toBe('Farmacia');
    expect(resultados()[0]?.textContent).not.toContain(t.deshacer);

    await userEvent.click(porNombre(t.moverCategoria('Gasolina')));
    await userEvent.click(porNombre(t.subirA('Gasolina')));
    await vi.waitFor(() => {
      expect(resultados()[0]?.textContent).toContain(
        t.movidaAGrupo('Gasolina', 'Comida fuera', 'la segunda'),
      );
    });
    expect(resultados()).toHaveLength(1);
    expect(fila('Gasolina').contains(resultados()[0] ?? null)).toBe(true);
    const x = porNombre(base.cerrarAviso);
    expect(x.getBoundingClientRect().width).toBeGreaterThanOrEqual(44);
    expect(x.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    await userEvent.click(x);
    expect(resultados()).toHaveLength(0);
  });

  it('PRU-CMP-CATEG-133 [C-46] CA-E-11: si OP-08 responde `nombre_repetido`, la fila vuelve a su lugar con el mensaje debajo en `role="alert"`', async () => {
    vi.mocked(editarEnEstructura).mockResolvedValueOnce({
      ok: false,
      error: {
        categoria: 'NEGOCIO',
        codigo: 'nombre_repetido',
        mensaje: 'Ya existe Farmacia en Ahorro.',
      },
    } as never);
    await montar();
    await userEvent.click(porNombre(t.moverCategoria('Farmacia')));
    await userEvent.click(porNombre(t.otroGrupo));
    await userEvent.click(enBarra('Ahorro'));
    await vi.waitFor(() => {
      expect(fila('Farmacia').querySelector('[role="alert"]')?.textContent).toContain(
        'Ya existe Farmacia en Ahorro.',
      );
    });
    expect(filasDe('Casa').at(-1)).toBe('Farmacia');
    expect(filasDe('Ahorro')).toEqual(['Fondo', 'Viaje']);
    expect(resultados()).toHaveLength(0);
  });
});

describe('PRU-CMP-CATEG-134 grupos y Pagos de tarjeta', () => {
  it('PRU-CMP-CATEG-134 [C-46] CA-E-10: Pagos de tarjeta no tiene asa ni flecha y dice «Lo administra Finn»; el asa de un grupo abre su barra sin «Otro grupo» y «Subir» deja el resultado debajo del encabezado', async () => {
    await montar();
    expect(seccion('Pagos de tarjeta').querySelector('button[aria-expanded]')).toBeNull();
    expect(seccion('Pagos de tarjeta').textContent).toContain(t.delSistema);
    expect(
      document.querySelector(`button[aria-label="${t.moverGrupo('Pagos de tarjeta')}"]`),
    ).toBeNull();

    await userEvent.click(porNombre(t.moverGrupo('Transporte')));
    expect(barra()?.textContent).toContain(t.esGrupo('Transporte', 'el tercero'));
    expect(barra()?.textContent).not.toContain(t.otroGrupo);
    await userEvent.click(porNombre(t.subirA('Transporte')));
    await vi.waitFor(() => {
      expect(resultados()[0]?.textContent).toContain(t.grupoMovido('Transporte', 'el segundo'));
    });
    expect(op08()).toMatchObject({
      tipo: 'grupo',
      id: id('Transporte'),
      orden: 2,
      esperado: { orden: 3 },
    });
    expect(seccion('Transporte').contains(resultados()[0] ?? null)).toBe(true);
    const orden = [...document.querySelectorAll('section h2')].map((h) => h.textContent.trim());
    expect(orden.slice(0, 3)).toEqual(['Casa', 'Transporte', 'Comida fuera']);
  });
});
