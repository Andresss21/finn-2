// [C-45] Los formularios de Presupuesto con la familia v3 (CAMPOS-V3 §2 a §6, §9 y §11): Asignar, Mover dinero, Sacar, Archivar,
// Fusionar y los paneles de Estructura. Cada bloque de datos es un `GrupoCampos`; los montos van en fila con «$», las categorías
// en la lista propia (o en segmentado con 3 opciones o menos) y el botón de guardar se ve apagado con `aria-disabled` y dice
// debajo qué falta. Los CA-K3-n de PROMPT-CAMPOS.md §5 van en el título.
import type { GrupoDeEstructura } from '@finn/dominio/selectores';
import type { Centavos } from '@finn/dominio/valores';
import axe from 'axe-core';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import '../app/globals.css';
import { crearEnEstructura } from '../servidor/acciones/categorias';
import { asignarEnCategoria, moverDinero } from '../servidor/acciones/presupuesto';
import { base } from '../textos/base';
import { categoriasArchivar as ta } from '../textos/categorias-archivar';
import { categoriasFusionar as tf } from '../textos/categorias-fusionar';
import { estructura as te } from '../textos/estructura';
import { presupuestoAsignar as tas } from '../textos/presupuesto-asignar';
import { presupuestoMover as tm } from '../textos/presupuesto-mover';
import { FormularioAsignar } from './presupuesto-asignar-categoria/formulario';
import { FormularioArchivar } from './presupuesto-categorias-archivar/formulario';
import { FormularioFusionar } from './presupuesto-categorias-fusionar/formulario';
import { FormularioSacar } from './presupuesto-categorias-sacar/formulario';
import { FormularioEstructura } from './presupuesto-estructura/formulario';
import { FormularioMover } from './presupuesto-mover/formulario';

// `next/link` y `next/navigation` necesitan el enrutador de Next, y las acciones son del servidor: se simulan.
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ replace: vi.fn(), back: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock('next/link', async () => {
  const { createElement } = await import('react');
  const Enlace = ({ href, children, ...resto }: { href: string; children?: ReactNode }) =>
    createElement('a', { href, ...resto }, children);
  return Object.assign(Enlace, { default: Enlace, useLinkStatus: () => ({ pending: false }) });
});
vi.mock('../servidor/acciones/presupuesto', () => ({
  asignarEnCategoria: vi.fn(),
  asignarRapido: vi.fn(),
  moverDinero: vi.fn(() => new Promise(() => undefined)),
}));
vi.mock('../servidor/acciones/categorias', () => ({
  crearEnEstructura: vi.fn(),
  editarEnEstructura: vi.fn(),
  eliminarEnEstructura: vi.fn(),
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
  sessionStorage.clear();
  delete document.documentElement.dataset['theme'];
  vi.mocked(asignarEnCategoria).mockClear();
  vi.mocked(moverDinero).mockClear();
  vi.mocked(crearEnEstructura).mockClear();
});

async function montar(ui: ReactNode): Promise<HTMLElement> {
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

const ok = (valor: unknown) =>
  Promise.resolve({ ok: true as const, valor, yaAplicada: false, avisos: [] });
const previsualiza = () =>
  vi.fn((entrada: unknown) =>
    (entrada as { modo: string }).modo === 'previsualizar'
      ? ok({
          revisionVista: 'r1',
          huellaImpacto: 'h1',
          impacto: { deltaLpa: 0, deltaDisponible: [] },
          avisos: [],
          rechazos: [],
        })
      : ok({}),
  );

/** El control de un rótulo (input o disparador), buscado por el texto con que empieza su `<label>`. */
const de = (nodo: HTMLElement, etiqueta: string): HTMLElement =>
  [...nodo.querySelectorAll('label')]
    .filter((l) => l.textContent.trim().startsWith(etiqueta))
    .map((l) => l.control)
    .find((c): c is HTMLElement => c instanceof HTMLElement) as HTMLElement;
const filaDe = (el: Element): HTMLElement => el.closest<HTMLElement>('.campo-fila') as HTMLElement;
const enGrupo = (el: Element): boolean => el.closest('.grupo-campos') !== null;
const afijo = (el: Element) => filaDe(el).querySelector('.campo-afijo')?.textContent;
const segmentado = (nodo: HTMLElement, etiqueta: string) =>
  nodo.querySelector<HTMLElement>(`[role=radiogroup][aria-label="${etiqueta}"]`) as HTMLElement;
const boton = (nodo: HTMLElement, texto: string): HTMLButtonElement =>
  [...nodo.querySelectorAll('button')].find((b) =>
    b.textContent.trim().startsWith(texto),
  ) as HTMLButtonElement;
const descrito = (el: Element): string =>
  (el.getAttribute('aria-describedby') ?? '')
    .split(' ')
    .map((id) => document.getElementById(id)?.textContent ?? '')
    .join(' ');

/** Un botón apagado (`aria-disabled`) se toca con el teclado: el puntero de Playwright espera a que se habilite. */
async function tocar(b: HTMLElement): Promise<void> {
  b.focus();
  await userEvent.keyboard('{Enter}');
}

/** Abre la lista propia de una fila y elige la opción que empieza con `nombre`. */
async function elegir(disparador: HTMLElement, nombre: string): Promise<void> {
  await userEvent.click(disparador);
  const opcion = [...document.querySelectorAll<HTMLElement>('[role=option]')].find((o) =>
    o.textContent.startsWith(nombre),
  ) as HTMLElement;
  await userEvent.click(opcion);
}

const CATEGORIAS = [
  { id: 'c1', nombre: 'Super', asignado: 10000, disponible: 5000 },
  { id: 'c2', nombre: 'Restaurantes', asignado: 0, disponible: -2630 },
  { id: 'c3', nombre: 'Salidas', asignado: 0, disponible: 0 },
  { id: 'c4', nombre: 'Ropa', asignado: 2000, disponible: 100 },
] as unknown as readonly {
  id: string;
  nombre: string;
  asignado: Centavos;
  disponible: Centavos;
}[];

const mover = () => (
  <FormularioMover
    periodoInicio="2027-02-01"
    categorias={CATEGORIAS}
    origenInicial=""
    destinoInicial=""
    rutaPadre="/presupuesto"
    superpuesto={false}
  />
);
const asignar = () => (
  <FormularioAsignar
    categoriaId="c1"
    categoria="Super"
    archivada={false}
    periodoInicio="2027-02-01"
    asignado={10000 as Centavos}
    disponible={5000 as Centavos}
    asignadoEsperado={10000 as Centavos}
    rutaPadre="/presupuesto"
    superpuesto={false}
  />
);
const sacar = (accion = vi.fn(ok)) => (
  <FormularioSacar
    accion={accion}
    categoriaId="c9"
    categoria="Gimnasio"
    asignado={4000 as Centavos}
    disponible={4000 as Centavos}
    destinos={[CATEGORIAS[0] as (typeof CATEGORIAS)[number]]}
    rutaPadre="/presupuesto"
    superpuesto={false}
  />
);
const archivar = (accion = previsualiza()) => (
  <FormularioArchivar
    accion={accion}
    categoriaId="c9"
    categoria="Gimnasio"
    disponible={4000 as Centavos}
    futuras={0}
    programadas={[{ id: 'p1', comercio: 'Gimnasio', monto: 3000 as Centavos }]}
    destinos={CATEGORIAS}
  />
);
const fusionar = (accion = previsualiza()) => (
  <FormularioFusionar
    accion={accion}
    origen={{ id: 'c9', nombre: 'Café' }}
    destinos={CATEGORIAS}
    resumen={{
      periodosConAsignacion: 1,
      transacciones: 2,
      condonaciones: 0,
      programadas: 0,
      reglas: 0,
    }}
  />
);
const grupo = (id: string, nombre: string): GrupoDeEstructura => ({
  grupo: {
    id: id as GrupoDeEstructura['grupo']['id'],
    nombre,
    archivado: false,
    sistema: false,
  },
  categorias: [],
});
const estructura = () => (
  <FormularioEstructura
    modo="categoria-nueva"
    superpuesto={false}
    grupos={[grupo('g1', 'Gastos'), grupo('g2', 'Hogar')]}
  />
);

describe('PRU-CMP-PRES Presupuesto con los campos v3', () => {
  it('PRU-CMP-PRES-802 [C-45, FT-11] CA-K3-5 y CA-K3-13: en Mover dinero «Sacar de» y «Poner en» son filas con la lista propia y el Disponible negativo en problema, el monto lleva «$»; sin elegir, «Mover» se ve apagado, dice cuántos campos corregir y al tocarlo no envía y lleva el foco al primero', async () => {
    const nodo = await montar(mover());
    const origen = de(nodo, tm.origen);
    expect(enGrupo(origen)).toBe(true);
    expect(origen.getAttribute('aria-haspopup')).toBe('listbox');
    expect(enGrupo(de(nodo, tm.destino))).toBe(true);
    const monto = de(nodo, tm.monto);
    expect(afijo(monto)).toBe(base.moneda);
    expect(nodo.querySelector('select')).toBeNull();
    const moverBoton = () => boton(nodo, tm.mover);
    expect(moverBoton().getAttribute('aria-disabled')).toBe('true');
    expect(moverBoton().disabled).toBe(false);
    expect(descrito(moverBoton())).toBe(base.corregirCampos(3));
    await tocar(moverBoton());
    await expect.poll(() => filaDe(origen).dataset['error']).toBe('');
    await expect.poll(() => document.activeElement).toBe(origen);
    expect(moverDinero).not.toHaveBeenCalled();

    await userEvent.click(origen);
    const restaurantes = [...document.querySelectorAll<HTMLElement>('[role=option]')].find((o) =>
      o.textContent.startsWith('Restaurantes'),
    ) as HTMLElement;
    const detalle = restaurantes.querySelector<HTMLElement>('.campo-detalle') as HTMLElement;
    expect(detalle.textContent).toBe(tm.disponibleDe('−$26.30'));
    expect(detalle.dataset['negativo']).toBe('');
    await userEvent.keyboard('{Escape}');
    await expect.poll(() => document.activeElement).toBe(origen);
  });

  it('PRU-CMP-PRES-803 [C-45, FT-11, CA-11.2] CA-K3-3: D-6 en Mover dinero: mover más que el Disponible no marca error en el campo; con origen, destino y monto se pide el impacto al servidor', async () => {
    const nodo = await montar(mover());
    await elegir(de(nodo, tm.origen), 'Salidas');
    await elegir(de(nodo, tm.destino), 'Super');
    const monto = de(nodo, tm.monto) as HTMLInputElement;
    await userEvent.type(monto, '1500.456');
    expect(monto.value).toBe('1,500.45');
    await vi.waitFor(() => {
      expect(moverDinero).toHaveBeenCalledTimes(1);
    });
    expect(moverDinero).toHaveBeenLastCalledWith(
      expect.objectContaining({ origenId: 'c3', destinoId: 'c1', monto: '1500.45' }),
    );
    expect(filaDe(monto).dataset['error']).toBeUndefined();
  });

  it('PRU-CMP-PRES-804 [C-45, FT-10] CA-K3-13: en Asignar el monto y su signo son filas de un grupo; sin monto, «Guardar» dice «Escribí el monto para guardar.» y al tocarlo no envía y lleva el foco al monto', async () => {
    const nodo = await montar(asignar());
    const monto = de(nodo, tas.nuevoAsignado) as HTMLInputElement;
    expect(enGrupo(monto)).toBe(true);
    expect(afijo(monto)).toBe(base.moneda);
    expect(monto.value).toBe('100.00');
    expect(enGrupo(segmentado(nodo, base.signoDelMonto))).toBe(true);
    await userEvent.clear(monto);
    const guardar = () => boton(nodo, tas.guardar);
    await expect.poll(() => guardar().getAttribute('aria-disabled')).toBe('true');
    expect(descrito(guardar())).toBe(base.motivoMonto);
    monto.blur();
    await tocar(guardar());
    await expect.poll(() => filaDe(monto).dataset['error']).toBe('');
    await expect.poll(() => document.activeElement).toBe(monto);
    expect(asignarEnCategoria).not.toHaveBeenCalled();
  });
});

describe('PRU-CMP-CATEG categorías con los campos v3', () => {
  it('PRU-CMP-CATEG-734 [C-45, FT-19] CA-K3-6 y CA-K3-13: en Sacar el destino con dos opciones es un segmentado en su fila y el monto lleva «$»; sin monto, «Sacar» dice «Escribí el monto para guardar.» y al tocarlo marca «Escribí un monto mayor que $0.00.» sin enviar', async () => {
    const accion = vi.fn(ok);
    const nodo = await montar(sacar(accion));
    const destino = segmentado(nodo, ta.sacar.destino);
    expect(destino.dataset['v3']).toBe('');
    expect(enGrupo(destino)).toBe(true);
    const monto = de(nodo, ta.sacar.monto) as HTMLInputElement;
    expect(afijo(monto)).toBe(base.moneda);
    expect(monto.value).toBe('40.00');
    await userEvent.clear(monto);
    const sacarBoton = () => boton(nodo, ta.sacar.sacar);
    await expect.poll(() => sacarBoton().getAttribute('aria-disabled')).toBe('true');
    expect(descrito(sacarBoton())).toBe(base.motivoMonto);
    await tocar(sacarBoton());
    await expect.poll(() => filaDe(monto).textContent).toContain(base.montoMayorQueCero);
    expect(accion).not.toHaveBeenCalled();
  });

  it('PRU-CMP-CATEG-735 [C-45, FT-19, CA-E4-24] CA-K3-6 y CA-K3-13: en Archivar el Disponible y la programada son filas de un grupo (la programada en segmentado); «Pasarla a otra categoría» sin destino deja el botón apagado con el motivo y al tocarlo marca «Elegí una categoría.» y lleva el foco a la lista', async () => {
    const accion = previsualiza();
    const nodo = await montar(archivar(accion));
    await vi.waitFor(() => {
      expect(accion).toHaveBeenCalledTimes(1);
    });
    const disponible = de(nodo, ta.destinoDisponible('$40.00'));
    expect(enGrupo(disponible)).toBe(true);
    expect(disponible.getAttribute('aria-haspopup')).toBe('listbox');
    const programada = segmentado(nodo, ta.programada('Gimnasio', '$30.00'));
    expect(enGrupo(programada)).toBe(true);
    const pasarla = [...programada.querySelectorAll<HTMLElement>('[role=radio]')].find(
      (r) => r.textContent === ta.pasarla,
    ) as HTMLElement;
    await userEvent.click(pasarla);
    const archivarBoton = () => boton(nodo, ta.archivarNombre('Gimnasio'));
    await expect.poll(() => archivarBoton().getAttribute('aria-disabled')).toBe('true');
    expect(descrito(archivarBoton())).toBe(base.corregirCampos(1));
    await tocar(archivarBoton());
    const destino = de(nodo, ta.pasarlaA);
    await expect.poll(() => filaDe(destino).textContent).toContain(ta.elegirCategoria);
    await expect.poll(() => document.activeElement).toBe(destino);
    expect(accion).toHaveBeenCalledTimes(1);
  });

  it('PRU-CMP-CATEG-736 [C-45, FT-20] CA-K3-5 y CA-K3-13: en Fusionar «Fusionar con» es una fila con la lista propia; sin elegir, «Fusionar» se ve apagado con el motivo y al tocarlo marca «Elegí una categoría.» y lleva el foco a la lista', async () => {
    const accion = previsualiza();
    const nodo = await montar(fusionar(accion));
    const destino = de(nodo, tf.destino);
    expect(enGrupo(destino)).toBe(true);
    expect(destino.getAttribute('aria-haspopup')).toBe('listbox');
    const fusionarBoton = boton(nodo, tf.fusionar);
    expect(fusionarBoton.getAttribute('aria-disabled')).toBe('true');
    expect(descrito(fusionarBoton)).toBe(base.corregirCampos(1));
    await tocar(fusionarBoton);
    await expect.poll(() => filaDe(destino).textContent).toContain(tf.elegirCategoria);
    await expect.poll(() => document.activeElement).toBe(destino);
    expect(accion).not.toHaveBeenCalled();
    await elegir(destino, 'Salidas');
    await vi.waitFor(() => {
      expect(accion).toHaveBeenCalledTimes(1);
    });
  });

  it('PRU-CMP-CATEG-737 [C-45, FT-18] CA-K3-6 y CA-K3-13: en Nueva categoría el nombre y el grupo son filas de un grupo (dos grupos: segmentado); sin nombre, «Crear» se ve apagado con el motivo y al tocarlo no envía y lleva el foco al nombre', async () => {
    const nodo = await montar(estructura());
    const nombre = de(nodo, te.nombre) as HTMLInputElement;
    expect(enGrupo(nombre)).toBe(true);
    expect(enGrupo(segmentado(nodo, te.grupo))).toBe(true);
    const crear = boton(nodo, te.crear);
    expect(crear.getAttribute('aria-disabled')).toBe('true');
    expect(descrito(crear)).toBe(base.corregirCampos(1));
    await tocar(crear);
    await expect.poll(() => filaDe(nombre).dataset['error']).toBe('');
    await expect.poll(() => document.activeElement).toBe(nombre);
    expect(crearEnEstructura).not.toHaveBeenCalled();
  });

  it.each(['claro', 'oscuro'])(
    'PRU-CMP-CATEG-738 [C-45] CA-K3-14: en el tema %s Asignar, Mover, Sacar, Archivar, Fusionar y Nueva categoría no tienen violaciones de axe',
    async (tema) => {
      document.documentElement.dataset['theme'] = tema;
      const raices = [
        await montar(asignar()),
        await montar(mover()),
        await montar(sacar()),
        await montar(archivar()),
        await montar(fusionar()),
        await montar(estructura()),
      ];
      for (const raiz of raices) {
        const { violations } = await axe.run(raiz, {
          runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
        });
        expect(
          violations.map((v) => `${v.id}: ${v.nodes.map((x) => x.target.join(' ')).join(', ')}`),
        ).toEqual([]);
      }
    },
  );
});
