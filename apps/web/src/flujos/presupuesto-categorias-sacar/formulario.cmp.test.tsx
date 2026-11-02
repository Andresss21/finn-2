// FT-19 Sacar el dinero de una archivada (07 §17: un texto, un estado o el foco de un componente es una CMP). El formulario abre con
// la propuesta de AV-14 y arma la entrada de OP-11 con lo que trajo el servidor: los números del resultado los prueban el dominio,
// la integración y las E2E (PF-3).
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import '../../app/globals.css';
import { categoriasArchivar } from '../../textos/categorias-archivar';
import { FormularioSacar, type PropsFormularioSacar } from './formulario';

const t = categoriasArchivar.sacar;
// `next/navigation` necesita `process`: el enrutador se simula para ver adónde manda el marco del flujo.
const replace = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ replace, back: vi.fn() }),
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
const OTRA = '33333333-3333-4333-8333-333333333333';
const base: Omit<PropsFormularioSacar, 'accion'> = {
  categoriaId: ID,
  categoria: 'Gimnasio',
  asignado: 2500 as never,
  disponible: 2500 as never,
  destinos: [{ id: OTRA, nombre: 'Salidas', asignado: 1000 as never, disponible: 1000 as never }],
  rutaPadre: '/presupuesto',
  superpuesto: false,
};
const ok = () => Promise.resolve({ ok: true as const, valor: {}, yaAplicada: false, avisos: [] });

const boton = (nodo: HTMLElement, texto: string): HTMLButtonElement => {
  const b = [...nodo.querySelectorAll('button')].find((x) => x.textContent === texto);
  if (b === undefined) throw new Error(`no hay un botón «${texto}»`);
  return b;
};
const montoEscrito = (nodo: HTMLElement): HTMLInputElement => {
  const i = nodo.querySelector<HTMLInputElement>('input[name="monto"]');
  if (i === null) throw new Error('no hay campo de monto');
  return i;
};

describe('PRU-CMP-CATEG', () => {
  it('PRU-CMP-CATEG-105 abre con la propuesta de AV-14 (todo el Disponible hacia Listo para asignar) y la envía con el Asignado que vio', async () => {
    const accion = vi.fn(ok);
    const nodo = montar(<FormularioSacar {...base} accion={accion} />);
    expect(nodo.textContent).toContain(t.disponible('Gimnasio', '$25.00'));
    expect(montoEscrito(nodo).value).toBe('25.00');

    await userEvent.click(boton(nodo, t.sacar));
    expect(accion).toHaveBeenCalledTimes(1);
    expect(accion).toHaveBeenLastCalledWith({
      categoriaId: ID,
      monto: '25.00',
      destino: 'lpa',
      esperado: { asignacionOrigen: '25.00' },
      modo: 'confirmar',
    });
    expect(nodo.textContent).toContain(t.listo);
    expect(replace).toHaveBeenCalledWith('/presupuesto');
  });

  it('PRU-CMP-CATEG-106 elegir otra categoría y otro monto envía también el Asignado del destino que vio', async () => {
    const accion = vi.fn(ok);
    const nodo = montar(<FormularioSacar {...base} accion={accion} />);
    const opcion = [...nodo.querySelectorAll<HTMLElement>('[role="radio"]')].find((x) =>
      x.closest('label')?.textContent.includes('Salidas'),
    );
    await userEvent.click(opcion as HTMLElement);
    await userEvent.fill(montoEscrito(nodo), '10');
    await userEvent.click(boton(nodo, t.sacar));
    expect(accion).toHaveBeenLastCalledWith({
      categoriaId: ID,
      monto: '10',
      destino: { categoriaId: OTRA },
      esperado: { asignacionOrigen: '25.00', asignacionDestino: '10.00' },
      modo: 'confirmar',
    });
  });

  it('PRU-CMP-CATEG-107 un conflicto de lo que vio ofrece los valores actuales y los usa como lo esperado sin borrar lo escrito', async () => {
    const accion = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false as const,
        error: {
          categoria: 'CONFLICTO',
          codigo: 'conflicto_desactualizado',
          mensaje: 'Cambió mientras mirabas.',
          datos: { actuales: { asignacionOrigen: 2000 } },
        },
      })
      .mockImplementation(ok);
    const nodo = montar(<FormularioSacar {...base} accion={accion} />);
    await userEvent.click(boton(nodo, t.sacar));
    expect(nodo.textContent).toContain('Cambió mientras mirabas.');

    await userEvent.click(boton(nodo, t.usarValoresActuales));
    expect(montoEscrito(nodo).value).toBe('25.00');
    await userEvent.click(boton(nodo, t.sacar));
    expect(accion).toHaveBeenLastCalledWith(
      expect.objectContaining({ esperado: { asignacionOrigen: '20.00' } }),
    );
  });
});
