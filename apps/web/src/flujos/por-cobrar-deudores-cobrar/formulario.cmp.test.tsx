// «Cobrar varios» (OP-31b): un pago del deudor repartido entre sus gastos marcados, del más antiguo al más nuevo. El reparto que se
// ve sale de la regla del dominio sobre los saldos que trae el servidor; lo que se guarda y el resultado son del servidor (se simula).
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import type { FechaLocal } from '@finn/dominio/valores';
import '../../app/globals.css';
import { cobrarVarios } from '../../servidor/acciones/eventos';
import { porCobrarCobrarVarios as v } from '../../textos/por-cobrar-cobrar';
import { FormularioCobrarVarios } from './formulario';

vi.mock('next/navigation', () => ({
  usePathname: () => '/por-cobrar/deudores/d1/cobrar',
  useRouter: () => ({ replace: vi.fn(), back: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock('next/link', async () => {
  const { createElement } = await import('react');
  const Enlace = ({ href, children, ...resto }: { href: string; children?: ReactNode }) =>
    createElement('a', { href, ...resto }, children);
  return Object.assign(Enlace, { default: Enlace, useLinkStatus: () => ({ pending: false }) });
});
vi.mock('../../servidor/acciones/eventos', () => ({ cobrarVarios: vi.fn() }));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const montados: { raiz: Root; nodo: HTMLElement }[] = [];
afterEach(() => {
  for (const { raiz, nodo } of montados.splice(0)) {
    act(() => {
      raiz.unmount();
    });
    nodo.remove();
  }
  vi.mocked(cobrarVarios).mockReset();
});

const DEUDOR = '00000000-0000-4000-8000-0000000000d0';
const L1 = '00000000-0000-4000-8000-0000000000d1';
const L2 = '00000000-0000-4000-8000-0000000000d2';
const EFECTIVO = '00000000-0000-4000-8000-0000000000a1';

async function montar(): Promise<HTMLElement> {
  document.body.style.cssText = 'background: var(--fondo); color: var(--texto)';
  const nodo = document.createElement('div');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  await act(() => {
    raiz.render(
      <FormularioCobrarVarios
        hoy={'2026-10-15' as FechaLocal}
        rutaPadre="/por-cobrar"
        deudorId={DEUDOR}
        deudor="DNERO"
        totalTexto="114.00"
        lineas={[
          {
            id: L1,
            comercio: 'PRICESMART',
            fecha: '01/09/2026',
            abierto: '$40.00',
            abiertoTexto: '40.00',
            tarjeta: undefined,
          },
          {
            id: L2,
            comercio: 'SUPER SELECTOS',
            fecha: '20/09/2026',
            abierto: '$74.00',
            abiertoTexto: '74.00',
            tarjeta: undefined,
          },
        ]}
        cuentas={[{ id: EFECTIVO, nombre: 'Planilla', detalle: 'Saldo $100.00', tarjeta: false }]}
      />,
    );
    return Promise.resolve();
  });
  montados.push({ raiz, nodo });
  return nodo;
}

const total = () =>
  document.querySelector<HTMLInputElement>('.campo-billete input') as HTMLInputElement;
const guardar = () =>
  [...document.querySelectorAll<HTMLButtonElement>('button[type="submit"]')].find((b) =>
    b.textContent.startsWith(v.guardar),
  ) as HTMLButtonElement;
const fila = (comercio: string) =>
  [...document.querySelectorAll<HTMLElement>('.campo-fila')].find((f) =>
    f.textContent.includes(comercio),
  ) as HTMLElement;
const casilla = (comercio: string) =>
  fila(comercio).querySelector<HTMLInputElement>('input[type="checkbox"]') as HTMLInputElement;
const motivo = () =>
  document.getElementById(guardar().getAttribute('aria-describedby') ?? '')?.textContent;

describe('PRU-CMP-COBRO cobrar varios gastos de un deudor', () => {
  it('PRU-CMP-COBRO-141 [C-45] el pago viene con el total abierto, todos los gastos marcados del más antiguo al más nuevo y «Se cobra» de cada uno según el reparto; desmarcar o cambiar el monto lo rehace y sin gastos «Guardar» queda apagado', async () => {
    const nodo = await montar();
    expect(nodo.textContent).toContain('Cobrar a DNERO');
    expect(total().value).toBe('114.00');
    expect(guardar().textContent).toBe(v.guardarMonto('$114.00'));
    expect(casilla('PRICESMART').checked).toBe(true);
    expect(casilla('SUPER SELECTOS').checked).toBe(true);
    const orden = [...nodo.querySelectorAll('.campo-fila')].map((f) => f.textContent);
    expect(orden.findIndex((x) => x.includes('PRICESMART'))).toBeLessThan(
      orden.findIndex((x) => x.includes('SUPER SELECTOS')),
    );
    expect(fila('PRICESMART').textContent).toContain(v.seCobra('$40.00'));
    expect(fila('SUPER SELECTOS').textContent).toContain(v.seCobra('$74.00'));

    await userEvent.clear(total());
    await userEvent.type(total(), '50');
    await vi.waitFor(() => {
      expect(fila('SUPER SELECTOS').textContent).toContain(v.seCobra('$10.00'));
    });
    expect(fila('PRICESMART').textContent).toContain(v.seCobra('$40.00'));

    await userEvent.click(fila('PRICESMART'));
    expect(casilla('PRICESMART').checked).toBe(false);
    expect(fila('PRICESMART').textContent).not.toContain(v.seCobra(''));
    expect(fila('SUPER SELECTOS').textContent).toContain(v.seCobra('$50.00'));

    await userEvent.click(fila('SUPER SELECTOS'));
    expect(guardar().getAttribute('aria-disabled')).toBe('true');
    expect(motivo()).toBe(v.marcarUno);
    await userEvent.click(guardar(), { force: true });
    expect(cobrarVarios).not.toHaveBeenCalled();
  });

  it('PRU-CMP-COBRO-142 [C-45] guardar envía un pago con los gastos marcados y el resultado dice cuánto cobró, cuántos cerró y cuál quedó con saldo; un error del servidor queda junto al botón', async () => {
    vi.mocked(cobrarVarios).mockResolvedValueOnce({
      ok: false,
      error: { categoria: 'DOMINIO', codigo: 'sin_saldo_abierto', mensaje: 'Sin saldo.' },
    });
    await montar();
    await userEvent.clear(total());
    await userEvent.type(total(), '50');
    await userEvent.click(guardar());
    await vi.waitFor(() => {
      expect(document.body.textContent).toContain('Sin saldo.');
    });
    expect(vi.mocked(cobrarVarios).mock.calls[0]?.[0]).toMatchObject({
      deudorId: DEUDOR,
      lineaIds: [L1, L2],
      cuentaId: EFECTIVO,
      fecha: '2026-10-15',
      total: '50.00',
    });

    // La salida de OP-31b llega del servidor con ids y `Centavos`; aquí, sus valores
    const salida = {
      id: 'x',
      cobros: [
        { lineaId: L1, monto: 4000, queda: 0 },
        { lineaId: L2, monto: 1000, queda: 6400 },
      ],
    } as unknown as Extract<Awaited<ReturnType<typeof cobrarVarios>>, { ok: true }>['valor'];
    vi.mocked(cobrarVarios).mockResolvedValueOnce({
      ok: true,
      valor: salida,
      yaAplicada: false,
      avisos: [],
    });
    await userEvent.click(guardar());
    await vi.waitFor(() => {
      expect(document.querySelector('[data-resultado-flujo="cobrar-varios"]')?.textContent).toBe(
        `${v.cobraste('$50.00', 'DNERO')}: ${v.cerraste(1)}; ${v.queda('SUPER SELECTOS', '$64.00')}`,
      );
    });
    expect(document.querySelector('a[href="/por-cobrar"]')).not.toBeNull();
  });
});
