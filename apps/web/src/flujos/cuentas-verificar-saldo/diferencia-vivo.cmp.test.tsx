// CTA-07: la diferencia del banco aparece al escribir el saldo, con la previsualización de OP-53 (04 §4.3); la cifra la dice el
// servidor (PF-3). Se prueba con el reloj simulado: el retardo del código no se espera con un `setTimeout` de la prueba.
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../app/globals.css';
import { FormularioVerificarSaldo } from './formulario';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
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
  vi.useRealTimers();
  for (const { raiz, nodo } of montados.splice(0)) {
    act(() => {
      raiz.unmount();
    });
    nodo.remove();
  }
});
const respuesta = (propuesta: unknown) =>
  Promise.resolve({
    ok: true as const,
    valor: { revisionVista: 'r', huellaImpacto: null, propuesta, avisos: [], rechazos: [] },
    yaAplicada: false as const,
    avisos: [],
  });

describe('PRU-CMP-CTA-795 la diferencia al escribir el saldo del banco', () => {
  it('PRU-CMP-CTA-795 [CA-E4-21] al escribir el saldo se previsualiza una sola vez y se muestra la diferencia que devuelve el servidor, sin calcularla', async () => {
    vi.useFakeTimers();
    const accion = vi.fn(() => respuesta({ saldoFinn: 100000, diferencia: -2550, marcaria: 0 }));
    const nodo = document.createElement('div');
    document.body.append(nodo);
    const raiz = createRoot(nodo);
    montados.push({ raiz, nodo });
    await act(() => {
      raiz.render(
        <FormularioVerificarSaldo
          accion={accion}
          cuentaId="c1"
          cuenta="Cuenta corriente"
          tarjeta={false}
          hoy={'2027-03-10' as never}
          fecha="2027-03-10"
          cantidad={0}
          candidatas={[]}
        />,
      );
      return Promise.resolve();
    });
    expect(accion).not.toHaveBeenCalled();
    const entrada = nodo.querySelector<HTMLInputElement>('input[name="saldo"]');
    expect(entrada).not.toBeNull();
    await act(() => {
      const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value') ?? {};
      Reflect.apply(Reflect.get(descriptor, 'set') as (v: string) => void, entrada, ['974.50']);
      entrada?.dispatchEvent(new Event('input', { bubbles: true }));
      return Promise.resolve();
    });
    expect(accion).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });
    expect(accion).toHaveBeenCalledTimes(1);
    expect(accion).toHaveBeenCalledWith(
      expect.objectContaining({ modo: 'previsualizar', saldoEstado: '974.50', cuentaId: 'c1' }),
    );
    expect(nodo.querySelector('[data-diferencia-vivo]')?.textContent).toContain(
      'Diferencia: −$25.50',
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(accion).toHaveBeenCalledTimes(1);
  });
});
