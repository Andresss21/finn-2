// FT-28 Devolución desde `/registrar` (D4; 07 §17: un texto o un estado es una CMP). La pantalla busca la compra con la lectura de
// CP-3 y lleva a `/actividad/[id]/devolver`, o arma la entrada de OP-33b sin compra. Los números los prueban las E2E (PF-3).
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import type { Centavos, FechaLocal } from '@finn/dominio/valores';
import '../../app/globals.css';
import { registrarDevolucion as t } from '../../textos/registrar-devolucion';
import type { AccionEscritura } from '../../formularios/use-operacion';
import { FormularioDevolucion, type BuscarCompras, type CompraCandidata } from './devolucion';

// `next/link` y `next/navigation` necesitan `process` y el enrutador de Next: se simulan (el enrutado se prueba en E2E).
vi.mock('next/navigation', () => ({
  usePathname: () => '/registrar/devolucion',
  useRouter: () => ({ replace: vi.fn(), back: vi.fn() }),
}));
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

const compra = (id: string, comercio: string, restante: number): CompraCandidata => ({
  transaccionId: id,
  fecha: '2027-02-10',
  comercio,
  cuenta: { nombre: 'Visa' },
  restante: restante as Centavos,
});
const ok = <T,>(valor: T) =>
  Promise.resolve({ ok: true as const, valor, yaAplicada: false, avisos: [] });
const base = {
  hoy: '2027-03-01' as FechaLocal,
  cuentas: [{ valor: 'k-visa', etiqueta: 'Visa' }],
  categorias: [{ valor: 'c-super', etiqueta: 'Super', grupo: 'Casa' }],
};

describe('PRU-CMP-TX-420 devolución desde Registrar', () => {
  it('PRU-CMP-TX-420 [CA-28.1] lista las compras recientes con lo que queda y la búsqueda de CP-3 las reemplaza; cada una lleva a devolver esa compra', async () => {
    const buscar = vi.fn<BuscarCompras>(() =>
      ok({ contexto: { candidatas: [compra('t-zapatos', 'ZAPATERIA', 4000)] } }),
    );
    const nodo = await montar(
      <FormularioDevolucion
        {...base}
        accion={vi.fn(() => ok({}))}
        buscar={buscar}
        recientes={[compra('t-ropa', 'TIENDA ROPA', 10000)]}
      />,
    );
    expect(nodo.textContent).toContain(t.recientes);
    const enlace = () => nodo.querySelector<HTMLAnchorElement>('[data-compras] a');
    expect(enlace()?.textContent).toContain('TIENDA ROPA');
    expect(enlace()?.querySelector('[data-centavos]')?.getAttribute('data-centavos')).toBe('10000');
    expect(enlace()?.getAttribute('href')).toBe(
      `/actividad/t-ropa/devolver?volver=${encodeURIComponent('/registrar/devolucion')}`,
    );

    await userEvent.type(nodo.querySelector('input[type="search"]') as HTMLElement, 'zapa');
    await vi.waitFor(() => {
      expect(enlace()?.textContent).toContain('ZAPATERIA');
    });
    expect(buscar).toHaveBeenLastCalledWith({ busqueda: 'zapa' });
    expect(nodo.textContent).toContain(t.resultados);
  });

  it('PRU-CMP-TX-421 [CA-28.7] sin compra original pide monto, cuenta y categoría y envía OP-33b sin reparto', async () => {
    const accion = vi.fn<AccionEscritura>(() => ok({}));
    const nodo = await montar(
      <FormularioDevolucion {...base} accion={accion} buscar={vi.fn()} recientes={[]} />,
    );
    expect(nodo.textContent).toContain(t.sinCompras);
    const guardar = [...nodo.querySelectorAll('button')].find(
      (b) => b.textContent === t.guardar,
    ) as HTMLElement;
    await userEvent.click(guardar);
    expect(accion).not.toHaveBeenCalled();
    expect(nodo.querySelectorAll('select[aria-invalid="true"]')).toHaveLength(2);

    await userEvent.type(nodo.querySelector('input[name="total"]') as HTMLElement, '30');
    const selects = [...nodo.querySelectorAll('select')];
    await userEvent.selectOptions(selects[0] as HTMLElement, 'k-visa');
    await userEvent.selectOptions(selects[1] as HTMLElement, 'c-super');
    await userEvent.click(guardar);
    await vi.waitFor(() => {
      expect(accion).toHaveBeenCalledTimes(1);
    });
    const entrada = accion.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(entrada).toMatchObject({
      fecha: '2027-03-01',
      total: '30',
      cuentaId: 'k-visa',
      categoriaId: 'c-super',
    });
    expect(entrada).not.toHaveProperty('reparto');
    expect(entrada).not.toHaveProperty('transaccionOriginalId');
  });
});
