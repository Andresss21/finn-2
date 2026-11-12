// FT-28 Devolver (07 §17: un texto o un estado es una CMP). El formulario dibuja el reparto con lo que queda en cada parte y arma la entrada
// de OP-33a: los montos y los rechazos los pone el servidor y los prueban el dominio, la integración y las E2E (PF-3).
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import '../../app/globals.css';
import type { AccionEscritura } from '../../formularios/use-operacion';
import { transaccion as t } from '../../textos/transaccion';
import { FormularioActividadDevolver, type PropsFormularioDevolver } from './formulario';

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
const base: Omit<PropsFormularioDevolver, 'accion'> = {
  transaccionId: 't1',
  hoy: '2027-03-01' as never,
  cuentas: [{ valor: 'c1', etiqueta: 'Ahorro', icono: 'wallet' }],
  cuentaDeLaCompra: 'c1',
  resumen: { total: '$100.00', devuelto: '$0.00', restante: '$100.00' },
  detalle: '/actividad/t1',
  partes: [{ lineaId: 'l1', nombre: 'Ropa', queda: '$100.00', sinCapacidad: false }],
};
const dos: PropsFormularioDevolver['partes'] = [
  { lineaId: 'l1', nombre: 'Super', queda: '$60.00', sinCapacidad: false },
  { lineaId: 'l2', nombre: 'Ana (por cobrar)', queda: '$25.00', sinCapacidad: false },
];

const campo = (nodo: HTMLElement, nombre: string): HTMLInputElement => {
  const c = nodo.querySelector<HTMLInputElement>(`input[name="${nombre}"]`);
  if (c === null) throw new Error(`no hay un campo «${nombre}»`);
  return c;
};
const registrar = (): HTMLButtonElement => {
  const b = [...document.querySelectorAll('button')].find((x) =>
    x.textContent.startsWith(t.registrarDevolucion),
  );
  if (b === undefined) throw new Error('no hay un botón «Registrar devolución»');
  return b;
};

describe('PRU-CMP-TX devolver', () => {
  it('PRU-CMP-TX-490 [CA-28.1] con una sola parte, el monto devuelto se copia al reparto y «Registrar devolución $100.00» envía la compra, la fecha del servidor, la cuenta y esa parte', async () => {
    const accion = vi.fn<AccionEscritura>(ok);
    const nodo = await montar(<FormularioActividadDevolver {...base} accion={accion} />);
    expect(nodo.textContent).toContain(t.quedanPorDevolver('$100.00'));
    expect(registrar().textContent).toBe(t.registrarDevolucion);

    await userEvent.fill(campo(nodo, 'total'), '100');
    expect(campo(nodo, 'reparto.0').value).toBe('100');
    expect(registrar().textContent).toBe(t.registrarDevolucionMonto('$100.00'));

    await userEvent.click(registrar());
    await vi.waitFor(() => {
      expect(accion).toHaveBeenCalledTimes(1);
    });
    const entrada = accion.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(entrada).toMatchObject({
      transaccionOriginalId: 't1',
      fecha: '2027-03-01',
      cuentaId: 'c1',
      reparto: [{ lineaId: 'l1' }],
    });
    expect(String(entrada['total'])).toMatch(/^100(\.00)?$/);
    expect(typeof entrada['id']).toBe('string');
    await vi.waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/actividad/t1');
    });
  });

  it('PRU-CMP-TX-491 [CA-28.6] el rechazo de una parte dice lo que queda en ella: su mensaje queda junto a esa parte, el aviso dice cuál corregir y una parte en cero no viaja', async () => {
    const accion = vi.fn(() =>
      Promise.resolve({
        ok: false as const,
        error: {
          categoria: 'DOMINIO' as const,
          codigo: 'devolucion_mayor_que_linea',
          mensaje: 'En esa parte quedan $25.00 por devolver.',
        },
      }),
    );
    const nodo = await montar(
      <FormularioActividadDevolver {...base} partes={dos} accion={accion} />,
    );
    await userEvent.fill(campo(nodo, 'total'), '50');
    await userEvent.fill(campo(nodo, 'reparto.1'), '40');
    await userEvent.fill(campo(nodo, 'reparto.0'), '10');
    await userEvent.click(registrar());
    await vi.waitFor(() => {
      expect(nodo.textContent).toContain('En esa parte quedan $25.00 por devolver.');
    });
    expect(nodo.textContent).toContain(t.corregiMonto('Ana (por cobrar)'));
    expect(nodo.querySelector('[data-linea="l2"]')?.textContent).toContain(
      'En esa parte quedan $25.00 por devolver.',
    );
    expect(nodo.querySelector('[data-linea="l1"]')?.textContent).not.toContain('En esa parte');
    expect(replace).not.toHaveBeenCalled();
  });

  it('PRU-CMP-TX-492 [] una parte sin lo escrito no viaja en el reparto, y los montos de las partes tienen 44 px de alto como mínimo', async () => {
    const accion = vi.fn<AccionEscritura>(ok);
    const nodo = await montar(
      <FormularioActividadDevolver {...base} partes={dos} accion={accion} />,
    );
    await userEvent.fill(campo(nodo, 'total'), '25');
    await userEvent.fill(campo(nodo, 'reparto.1'), '25');
    for (const c of nodo.querySelectorAll('input'))
      expect(c.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    await userEvent.click(registrar());
    await vi.waitFor(() => {
      expect(accion).toHaveBeenCalledTimes(1);
    });
    const entrada = accion.mock.calls[0]?.[0] as { reparto: { lineaId: string }[] };
    expect(entrada.reparto.map((r) => r.lineaId)).toEqual(['l2']);
  });

  it('PRU-CMP-TX-493 [] una compra sin capacidad restante lo dice con el total, lo devuelto y lo que queda, y no ofrece registrar', async () => {
    const accion = vi.fn<AccionEscritura>(ok);
    const nodo = await montar(
      <FormularioActividadDevolver
        {...base}
        accion={accion}
        resumen={{ total: '$148.60', devuelto: '$148.60', restante: '$0.00' }}
        partes={[{ lineaId: 'l1', nombre: 'Ropa', queda: '$0.00', sinCapacidad: true }]}
      />,
    );
    const sin = nodo.querySelector('[data-sin-capacidad]');
    expect(sin?.textContent).toContain(t.sinNadaTitulo);
    expect(sin?.textContent).toContain('$148.60');
    expect(sin?.textContent).toContain('$0.00');
    expect(nodo.querySelector('a')?.getAttribute('href')).toBe('/actividad/t1');
    expect([...document.querySelectorAll('button')].map((b) => b.textContent)).not.toContain(
      t.registrarDevolucion,
    );
    expect(accion).not.toHaveBeenCalled();
  });

  it('PRU-CMP-TX-731 [CA-E4-20] la cuenta a la que vuelve el dinero se rotula «Vuelve a» y muestra la cuenta elegida', async () => {
    const nodo = await montar(<FormularioActividadDevolver {...base} accion={vi.fn(ok)} />);
    const rotulo = [...nodo.querySelectorAll('label, span')].find(
      (x) => x.textContent === 'Vuelve a',
    );
    expect(rotulo).toBeDefined();
    expect(nodo.textContent).not.toContain('Devolver a');
    expect(nodo.textContent).toContain('Ahorro');
  });
});
