// FT-19 Archivar una categoría (07 §17: un texto, un estado o el foco de un componente es una CMP). El formulario solo dibuja lo
// que trae `formulario({ operacion: 'archivar_categoria' })` y arma la entrada de OP-09: los números del impacto los pone el
// servidor y los prueban el dominio, la integración y las E2E (PF-3).
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import '../../app/globals.css';
import { categoriasArchivar as t } from '../../textos/categorias-archivar';
import { FormularioArchivar, type PropsFormularioArchivar } from './formulario';

// `next/navigation` necesita `process`: el enrutador se simula para ver adónde manda el marco del flujo.
const replace = vi.fn();
vi.mock('next/navigation', () => ({ usePathname: () => '/', useRouter: () => ({ replace }) }));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const montados: { raiz: Root; nodo: HTMLElement }[] = [];
afterEach(() => {
  for (const { raiz, nodo } of montados.splice(0)) {
    act(() => {
      raiz.unmount();
    });
    nodo.remove();
  }
  replace.mockClear();
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

const ID = '11111111-1111-4111-8111-111111111111';
const PROGRAMADA = '22222222-2222-4222-8222-222222222222';
const OTRA = '33333333-3333-4333-8333-333333333333';
const ok = (valor: unknown) =>
  Promise.resolve({ ok: true as const, valor, yaAplicada: false, avisos: [] });
const vista = (extra: Record<string, unknown> = {}) => ({
  revisionVista: 'r1',
  huellaImpacto: 'h1',
  impacto: { deltaLpa: 4000, deltaDisponible: [], deltaTarjetas: [] },
  avisos: [],
  rechazos: [],
  ...extra,
});
const base: Omit<PropsFormularioArchivar, 'accion'> = {
  categoriaId: ID,
  categoria: 'Gimnasio',
  disponible: 0 as never,
  futuras: 0,
  programadas: [],
  destinos: [{ id: OTRA, nombre: 'Salidas', disponible: 5000 as never }],
};

const boton = (nodo: HTMLElement, texto: string): HTMLButtonElement => {
  const b = [...nodo.querySelectorAll('button')].find((x) => x.textContent === texto);
  if (b === undefined) throw new Error(`no hay un botón «${texto}»`);
  return b;
};
const tocar = async (nodo: HTMLElement, texto: string): Promise<void> => {
  await userEvent.click(boton(nodo, texto));
};
/** Elige `opcion` en el `<select>` nativo cuya etiqueta contiene `grupo`. */
const elegir = async (nodo: HTMLElement, grupo: string, opcion: string): Promise<void> => {
  const etiqueta = [...nodo.querySelectorAll('label')].find((l) => l.textContent.includes(grupo));
  const select = nodo.querySelector<HTMLSelectElement>(`select[id="${etiqueta?.htmlFor}"]`);
  if (select === null) throw new Error(`no hay «${grupo}»`);
  const o = [...select.options].find((x) => x.text === opcion);
  if (o === undefined) throw new Error(`no hay «${opcion}» en «${grupo}»`);
  await userEvent.selectOptions(select, o.value);
};

const PROG = [{ id: PROGRAMADA, comercio: 'Gimnasio', monto: 3000 as never }];
/** E4-1: el impacto se pide solo, al abrir y con cada decisión; se espera a que el servidor conteste. */
const conImpacto = async (nodo: HTMLElement): Promise<void> => {
  await vi.waitFor(() => {
    expect(
      nodo.querySelector('[data-impacto-k4]') ?? nodo.querySelector('[role="status"]:not(:empty)'),
    ).not.toBeNull();
  });
};
const previsualiza = (extra: Record<string, unknown> = {}) =>
  vi.fn((entrada: unknown) =>
    (entrada as { modo: string }).modo === 'previsualizar' ? ok(vista(extra)) : ok({}),
  );

describe('PRU-CMP-CATEG', () => {
  it('PRU-CMP-CATEG-101 [CA-E4-1] sin nada que decidir (Disponible $0.00, sin futuras ni programadas) pide el impacto al abrir, lo dibuja debajo, y «Archivar {categoría}» confirma y manda al detalle', async () => {
    const accion = previsualiza();
    const nodo = montar(<FormularioArchivar {...base} accion={accion} />);
    expect(nodo.textContent).toContain(t.nadaQueDecidir('Gimnasio'));
    await conImpacto(nodo);
    expect(accion).toHaveBeenCalledTimes(1);
    expect(accion).toHaveBeenLastCalledWith({ categoriaId: ID, modo: 'previsualizar' });
    expect(nodo.textContent).toContain(t.rotuloImpacto);

    await tocar(nodo, t.archivarNombre('Gimnasio'));
    expect(accion).toHaveBeenLastCalledWith({
      categoriaId: ID,
      modo: 'confirmar',
      revisionVista: 'r1',
      huellaImpacto: 'h1',
    });
    expect(nodo.textContent).toContain(t.listo);
    expect(replace).toHaveBeenCalledWith(`/presupuesto/categorias/${ID}`);
  });

  it('PRU-CMP-CATEG-102 [CA-E4-24] con Disponible, futuras y una programada, «Desactivarla» viene elegida y el servidor recibe la decisión; cambiarla a otra categoría sin destino no pide nada hasta elegirlo', async () => {
    const accion = previsualiza();
    const nodo = montar(
      <FormularioArchivar
        {...base}
        accion={accion}
        disponible={4000 as never}
        futuras={1}
        programadas={PROG}
      />,
    );
    expect(nodo.textContent).toContain(t.futuras(1));
    expect(nodo.textContent).toContain(t.destinoDisponible('$40.00'));
    await conImpacto(nodo);
    expect(accion).toHaveBeenCalledTimes(1);
    expect(accion).toHaveBeenLastCalledWith({
      categoriaId: ID,
      destinoDisponible: 'lpa',
      devolverAsignacionesFuturas: true,
      programadas: [{ programadaId: PROGRAMADA, accion: 'desactivar' }],
      modo: 'previsualizar',
    });

    await elegir(nodo, 'Programada', t.pasarla);
    expect(accion).toHaveBeenCalledTimes(1);
    expect(boton(nodo, t.archivarNombre('Gimnasio')).disabled).toBe(true);
  });

  it('PRU-CMP-CATEG-103 [CA-E4-1, CA-E4-24] cambiar una decisión vuelve a pedir el impacto al servidor con lo elegido y una programada puede pasar a otra categoría', async () => {
    const accion = previsualiza();
    const nodo = montar(
      <FormularioArchivar
        {...base}
        accion={accion}
        disponible={4000 as never}
        programadas={PROG}
      />,
    );
    await conImpacto(nodo);
    await elegir(nodo, 'Mandar', 'Salidas');
    await elegir(nodo, 'Programada', t.pasarla);
    await elegir(nodo, t.pasarlaA, 'Salidas');
    await vi.waitFor(() => {
      expect(accion).toHaveBeenLastCalledWith({
        categoriaId: ID,
        destinoDisponible: { categoriaId: OTRA },
        programadas: [{ programadaId: PROGRAMADA, accion: 'reasignar', categoriaId: OTRA }],
        modo: 'previsualizar',
      });
    });
  });

  it('PRU-CMP-CATEG-104 un Disponible negativo pide con qué cubrirlo y una previsualización rechazada lo dice y deja el pie deshabilitado', async () => {
    const accion = previsualiza({
      huellaImpacto: null,
      impacto: null,
      rechazos: [{ codigo: 'categoria_ya_archivada' }],
    });
    const nodo = montar(
      <FormularioArchivar {...base} accion={accion} disponible={-2000 as never} />,
    );
    expect(nodo.textContent).toContain(t.cubrirSobregiro('−$20.00'));
    await conImpacto(nodo);
    expect(accion).toHaveBeenLastCalledWith({
      categoriaId: ID,
      cubrirSobregiroCon: 'lpa',
      modo: 'previsualizar',
    });
    expect(nodo.textContent).toContain(t.rechazos.categoria_ya_archivada);
    expect(nodo.querySelector('[data-impacto-k4]')).toBeNull();
    expect(boton(nodo, t.archivarNombre('Gimnasio')).disabled).toBe(true);
  });

  it('PRU-CMP-PRES-282 [CA-E4-1, CA-E4-26] el impacto de Archivar es una tarjeta K4 de filas debajo de las decisiones, sin botones propios ni «antes → después»; el pie de 44 px o más es el que confirma', async () => {
    const accion = previsualiza();
    const nodo = montar(<FormularioArchivar {...base} accion={accion} />);
    await conImpacto(nodo);
    const tarjeta = nodo.querySelector('[data-impacto-k4] ul');
    expect(tarjeta?.className).toContain('rounded-contenedor');
    expect(
      [...(tarjeta?.querySelectorAll(':scope > li') ?? [])].map((li) => li.textContent),
    ).toEqual([t.impactoLpa('+$40.00')]);
    expect(nodo.querySelector('[data-impacto-k4]')?.querySelectorAll('button')).toHaveLength(0);
    expect(
      boton(nodo, t.archivarNombre('Gimnasio')).getBoundingClientRect().height,
    ).toBeGreaterThanOrEqual(44);
    expect(nodo.textContent).not.toContain('→');
  });
});
