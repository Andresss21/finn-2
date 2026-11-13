// «Cobro» en `/registrar` (CH-258): aparece después de «Ingreso» solo si el servidor dice que hay por cobrar abierto.
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';

const estado = vi.hoisted(() => ({ abierto: true }));
vi.mock('next/link', async () => {
  const { createElement } = await import('react');
  const Enlace = ({
    href,
    children,
    ...r
  }: {
    href: string;
    children?: import('react').ReactNode;
  }) => createElement('a', { href, ...r }, children);
  return Object.assign(Enlace, { default: Enlace, useLinkStatus: () => ({ pending: false }) });
});
vi.mock('next/navigation', () => ({
  usePathname: () => '/registrar',
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ refresh: () => undefined, replace: () => undefined, back: () => undefined }),
}));
vi.mock('../../servidor/consultas', () => ({ depsDeConsulta: () => Promise.resolve({}) }));
vi.mock('../../servidor/consultar', () => ({ consultar: (f: () => unknown) => f() }));
vi.mock('@finn/aplicacion/consultas/cuentas', () => ({
  cuentas: () =>
    Promise.resolve({ efectivo: [{}, {}], tarjetas: [], inversiones: [], prestamos: [] }),
}));
vi.mock('@finn/aplicacion/consultas/por-cobrar', () => ({
  porCobrar: () =>
    Promise.resolve({
      deudores: estado.abierto ? [{ items: [{ estado: 'abierto' }] }] : [],
    }),
}));

import { LectorRegistrar } from './lector';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

async function enlaces(abierto: boolean): Promise<string[]> {
  estado.abierto = abierto;
  const ui = await LectorRegistrar();
  const nodo = document.createElement('div');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(ui);
  });
  const hrefs = [...nodo.querySelectorAll('a')].map((a) => a.getAttribute('href') ?? '');
  act(() => {
    raiz.unmount();
  });
  nodo.remove();
  return hrefs;
}

describe('PRU-CMP-TX', () => {
  it('PRU-CMP-TX-801 [CH-258] «Cobro» lleva a /por-cobrar/cobrar, va después de Ingreso y desaparece sin por cobrar abierto', async () => {
    const con = await enlaces(true);
    expect(con.indexOf('/por-cobrar/cobrar')).toBe(con.indexOf('/registrar/ingreso') + 1);
    expect(await enlaces(false)).not.toContain('/por-cobrar/cobrar');
  });
});
