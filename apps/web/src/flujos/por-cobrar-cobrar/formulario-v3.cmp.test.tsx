// Cobrar con los campos v3 (C-45): el monto es el billete (CAMPOS-V3 §4), la cuenta, la fecha y la casilla de AV-22 van en un grupo
// de filas y «Cobrar» sigue §5 y §11. Los CA-K3-n (PROMPT-CAMPOS §5) van en el texto del título. La acción es del servidor: se simula.
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import type { FechaLocal } from '@finn/dominio/valores';
import '../../app/globals.css';
import { cobrarPorCobrar } from '../../servidor/acciones/eventos';
import { base } from '../../textos/base';
import { registrarGasto as g } from '../../textos/registrar-gasto';
import { porCobrarCobrar as t } from '../../textos/por-cobrar-cobrar';
import { FormularioPorCobrarCobrar } from './formulario';

vi.mock('next/navigation', () => ({
  usePathname: () => '/por-cobrar/cobrar',
  useRouter: () => ({ replace: vi.fn(), back: vi.fn(), push: vi.fn() }),
}));
vi.mock('next/link', async () => {
  const { createElement } = await import('react');
  const Enlace = ({ href, children, ...resto }: { href: string; children?: ReactNode }) =>
    createElement('a', { href, ...resto }, children);
  return Object.assign(Enlace, { default: Enlace, useLinkStatus: () => ({ pending: false }) });
});
vi.mock('../../servidor/acciones/eventos', () => ({ cobrarPorCobrar: vi.fn() }));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const montados: { raiz: Root; nodo: HTMLElement }[] = [];
afterEach(() => {
  for (const { raiz, nodo } of montados.splice(0)) {
    act(() => {
      raiz.unmount();
    });
    nodo.remove();
  }
  vi.mocked(cobrarPorCobrar).mockReset();
});

const LINEA = '00000000-0000-4000-8000-0000000000d1';
const EFECTIVO = '00000000-0000-4000-8000-0000000000a1';

async function montar(): Promise<HTMLElement> {
  document.body.style.cssText = 'background: var(--fondo); color: var(--texto)';
  const nodo = document.createElement('div');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  await act(() => {
    raiz.render(
      <FormularioPorCobrarCobrar
        hoy={'2026-10-15' as FechaLocal}
        fecha="2026-10-15"
        rutaPadre="/por-cobrar"
        lineaInicial={LINEA}
        partidas={[
          {
            id: LINEA,
            deudor: 'Carlos',
            comercio: 'PRICESMART',
            abierto: '$40.00',
            abiertoTexto: '40.00',
            tarjeta: { id: 'k1', nombre: 'Visa Oro' },
            categoriaPagoId: undefined,
          },
        ]}
        cuentas={[
          {
            id: EFECTIVO,
            nombre: 'Planilla',
            detalle: 'Saldo $100.00',
            tarjeta: false,
            categoriaPagoId: undefined,
          },
        ]}
      />,
    );
    return Promise.resolve();
  });
  montados.push({ raiz, nodo });
  return nodo;
}

const total = () =>
  document.querySelector<HTMLInputElement>('.campo-billete input') as HTMLInputElement;
const cobrar = () =>
  [...document.querySelectorAll<HTMLButtonElement>('button[type="submit"]')].find((b) =>
    b.textContent.startsWith(t.cobrar),
  ) as HTMLButtonElement;
const motivo = () =>
  document.getElementById(cobrar().getAttribute('aria-describedby') ?? '')?.textContent;

describe('PRU-CMP-COBRO cobrar con los campos v3', () => {
  it('PRU-CMP-COBRO-883 [C-45] CA-K3-8 y CA-K3-13: el monto abierto viene en el billete y la casilla de reservar es una fila del grupo; sin monto «Cobrar» queda apagado con «Escribí el monto para guardar.» y tocarlo no envía', async () => {
    const nodo = await montar();
    expect(total().value).toBe('40.00');
    expect(cobrar().textContent).toBe(t.cobrarMonto('$40.00'));
    const grupo = nodo.querySelector('.grupo-campos');
    expect(grupo?.textContent).toContain(t.cuenta);
    expect(grupo?.querySelector('input[name="fecha"]')).not.toBeNull();
    const casilla = grupo?.querySelector<HTMLInputElement>('input[type="checkbox"]');
    expect(casilla?.checked).toBe(true);
    // CA-K3-8: tocar el texto de la fila cambia la casilla
    await userEvent.click(grupo?.querySelector('.control-nombre') as HTMLElement);
    expect(casilla?.checked).toBe(false);
    await userEvent.clear(total());
    expect(cobrar().getAttribute('aria-disabled')).toBe('true');
    expect(motivo()).toBe(g.motivoMonto);
    await userEvent.click(cobrar(), { force: true });
    expect(cobrarPorCobrar).not.toHaveBeenCalled();
    await vi.waitFor(() => {
      expect(document.body.textContent).toContain(base.montoMayorQueCero);
    });
  });
});
