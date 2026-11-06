// FT-47 Condonar (07 §17: un texto o un estado es una CMP). El formulario dibuja lo que trae el DTO (tope abierto, categoría propuesta o la
// petición de elegir una) y arma la entrada de OP-32: los montos, los rechazos y el Disponible los pone el servidor y los prueban el
// dominio, la integración y las E2E (PF-3).
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import '../../app/globals.css';
import type { AccionEscritura } from '../../formularios/use-operacion';
import { porCobrarCondonar as t } from '../../textos/por-cobrar-condonar';
import { FormularioCondonar, type PropsFormularioCondonar } from './formulario';

// `next/link` y `next/navigation` necesitan `process` y el enrutador de Next: se simulan (el enrutado se prueba en E2E).
const replace = vi.fn();
vi.mock('next/navigation', () => ({ usePathname: () => '/', useRouter: () => ({ replace }) }));
vi.mock('next/link', async () => {
  const { createElement } = await import('react');
  const Enlace = ({ href, children, ...resto }: { href: string; children?: ReactNode }) =>
    createElement('a', { href, ...resto }, children);
  return Object.assign(Enlace, { default: Enlace, useLinkStatus: () => ({ pending: false }) });
});

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

async function montar(ui: ReactNode): Promise<HTMLElement> {
  document.body.style.cssText = 'background: var(--fondo); color: var(--texto)';
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

const ok = () => Promise.resolve({ ok: true as const, valor: {}, yaAplicada: false, avisos: [] });
const base: Omit<PropsFormularioCondonar, 'accion'> = {
  lineaId: 'l1',
  deudor: 'Beto',
  abierto: '$15.00',
  montoInicial: '15.00',
  hoy: '2027-02-12' as never,
  categorias: [
    { id: 'c1', nombre: 'Ropa', disponible: '$0.00' },
    { id: 'c2', nombre: 'Salidas', disponible: '$20.00' },
  ],
  categoriaPropuesta: 'c2',
  rutaPadre: '/por-cobrar',
  superpuesto: false,
};

const campo = (nodo: HTMLElement, nombre: string): HTMLInputElement => {
  const c = nodo.querySelector<HTMLInputElement>(`input[name="${nombre}"]`);
  if (c === null) throw new Error(`no hay un campo «${nombre}»`);
  return c;
};
const condonar = (): HTMLButtonElement => {
  const b = [...document.querySelectorAll('button')].find((x) =>
    x.textContent.startsWith(t.condonar),
  );
  if (b === undefined) throw new Error('no hay un botón «Condonar»');
  return b;
};

describe('PRU-CMP-COBRO condonar', () => {
  it('PRU-CMP-COBRO-102 [] abre con el saldo abierto como monto, dice hasta cuánto se puede condonar y propone la categoría de la compra', async () => {
    const nodo = await montar(<FormularioCondonar {...base} accion={vi.fn<AccionEscritura>(ok)} />);
    expect(campo(nodo, 'monto').value).toBe('15.00');
    expect(nodo.textContent).toContain(t.hastaAbierto('$15.00'));
    expect(condonar().textContent).toBe(t.condonarMonto('$15.00'));
    expect(nodo.querySelector<HTMLSelectElement>('select')?.value).toBe('c2');
    expect(nodo.querySelector('[data-sin-propuesta]')).toBeNull();
  });

  it('PRU-CMP-COBRO-103 [] «Condonar» envía la línea, el monto, la fecha del servidor y la categoría elegida', async () => {
    const accion = vi.fn<AccionEscritura>(ok);
    const nodo = await montar(<FormularioCondonar {...base} accion={accion} />);
    await userEvent.fill(campo(nodo, 'monto'), '10');
    await userEvent.click(condonar());
    await vi.waitFor(() => {
      expect(accion).toHaveBeenCalledTimes(1);
    });
    expect(accion.mock.calls[0]?.[0]).toMatchObject({
      lineaId: 'l1',
      monto: '10',
      fecha: '2027-02-12',
      categoriaId: 'c2',
      modo: 'confirmar',
    });
    // sin avisos el flujo termina solo y vuelve a Por cobrar
    await vi.waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/por-cobrar');
    });
  });

  it('PRU-CMP-COBRO-104 [CA-47.3] pasarse del saldo abierto muestra el rechazo del servidor «Solo quedan $15.00 por cobrar.» y no cierra el flujo', async () => {
    const accion = vi.fn<AccionEscritura>(() =>
      Promise.resolve({
        ok: false as const,
        error: {
          categoria: 'DOMINIO' as const,
          codigo: 'condonacion_mayor_que_abierto',
          mensaje: 'Solo quedan $15.00 por cobrar.',
        },
      }),
    );
    const nodo = await montar(<FormularioCondonar {...base} accion={accion} />);
    await userEvent.fill(campo(nodo, 'monto'), '20');
    await userEvent.click(condonar());
    await vi.waitFor(() => {
      expect(nodo.textContent).toContain('Solo quedan $15.00 por cobrar.');
    });
    expect(replace).not.toHaveBeenCalled();
  });

  it('PRU-CMP-COBRO-105 [CA-47.4] con la categoría de la compra archivada no se propone ninguna: pide elegir una activa y no deja condonar sin elegirla', async () => {
    const accion = vi.fn<AccionEscritura>(ok);
    const nodo = await montar(
      <FormularioCondonar {...base} accion={accion} categoriaPropuesta={undefined} />,
    );
    expect(nodo.querySelector('[data-sin-propuesta]')?.textContent).toBe(t.sinPropuesta);
    expect(nodo.querySelector<HTMLSelectElement>('select')?.value).toBe('');
    await userEvent.click(condonar());
    await vi.waitFor(() => {
      expect(nodo.textContent).toContain(t.elegirCategoria);
    });
    expect(accion).not.toHaveBeenCalled();
  });

  it('PRU-CMP-COBRO-106 [AV-02] al terminar con la categoría sobregirada el flujo se queda a decir AV-02 y se cierra con «Listo»', async () => {
    const accion = vi.fn<AccionEscritura>(() =>
      Promise.resolve({
        ok: true as const,
        valor: {},
        yaAplicada: false,
        avisos: [{ codigo: 'AV-02', mensaje: 'x' }],
      }),
    );
    const nodo = await montar(<FormularioCondonar {...base} accion={accion} />);
    await userEvent.click(condonar());
    await vi.waitFor(() => {
      expect(nodo.querySelector('[data-aviso="AV-02"]')?.textContent).toBe(t.avisos['AV-02']);
    });
    expect(nodo.textContent).toContain(t.guardado('$15.00', 'Beto'));
    const listo = [...document.querySelectorAll('button')].find((x) => x.textContent === t.listo);
    expect(listo).toBeDefined();
  });
});
