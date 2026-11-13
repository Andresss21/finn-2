// CTA-09: después de subir el archivo, la fecha de corte y el saldo final salen del CSV que leyó el servidor (OP-45, CH-201 c) y se
// muestran como datos de solo lectura: no hay campos de entrada para ellos.
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../app/globals.css';
import { FormularioConciliar } from './formulario';

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
  for (const { raiz, nodo } of montados.splice(0)) {
    act(() => {
      raiz.unmount();
    });
    nodo.remove();
  }
});

describe('PRU-CMP-CTA-796 fecha de corte y saldo final del estado', () => {
  it('PRU-CMP-CTA-796 [CA-E4-21] tras subir el archivo se muestran la fecha de corte y el saldo final que devolvió el servidor, sin campos de entrada', async () => {
    const iniciar = vi.fn(() =>
      Promise.resolve({
        ok: true as const,
        valor: {
          fechaEstado: '2027-03-05',
          saldoFinal: 123456,
          movimientos: [],
          carga: 'firma',
          clasificacion: {
            saldoFinn: 120000,
            diferencia: 3456,
            coincidencias: [],
            soloEnEstado: [],
            soloEnFinn: [],
          },
        },
        yaAplicada: false as const,
        avisos: [],
      }),
    );
    const nodo = document.createElement('div');
    document.body.append(nodo);
    const raiz = createRoot(nodo);
    montados.push({ raiz, nodo });
    await act(() => {
      raiz.render(
        <FormularioConciliar
          iniciar={iniciar}
          terminar={vi.fn()}
          agregar={vi.fn()}
          cuentaId="c1"
          cuenta="Cuenta corriente"
          categorias={[]}
          tiposAlta={{ cargo: [], abono: [] }}
        />,
      );
      return Promise.resolve();
    });
    expect(nodo.textContent).not.toContain('Fecha de corte');
    const archivo = nodo.querySelector<HTMLInputElement>('input[type="file"]');
    const csv = new File(['fecha,monto\n'], 'estado.csv', { type: 'text/csv' });
    await act(() => {
      const datos = new DataTransfer();
      datos.items.add(csv);
      if (archivo !== null) archivo.files = datos.files;
      archivo?.dispatchEvent(new Event('change', { bubbles: true }));
      return Promise.resolve();
    });
    const revisar = [...nodo.querySelectorAll('button')].find((b) => b.textContent === 'Revisar');
    await act(async () => {
      revisar?.click();
      await vi.waitFor(() => {
        expect(iniciar).toHaveBeenCalledTimes(1);
      });
    });
    expect(nodo.querySelector('[data-fecha-corte]')?.textContent).toContain('Fecha de corte');
    expect(nodo.querySelector('[data-fecha-corte]')?.textContent).toContain('2027');
    expect(nodo.querySelector('[data-saldo-final]')?.textContent).toContain('$1,234.56');
    expect(nodo.querySelector('input:not([type="file"]):not([type="checkbox"])')).toBeNull();
  });
});
