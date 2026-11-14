// Registrar ingreso con los campos v3 (C-45): el total es el billete (CAMPOS-V3 §4), la cuenta, la fecha y la descripción van en un
// grupo de filas y «Guardar ingreso» sigue §5 y §11. Los CA-K3-n (PROMPT-CAMPOS §5) van en el texto del título. La acción es del
// servidor: se simula.
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import type { FechaLocal } from '@finn/dominio/valores';
import '../../app/globals.css';
import { registrarIngreso } from '../../servidor/acciones/transacciones';
import { base } from '../../textos/base';
import { registrarGasto as g } from '../../textos/registrar-gasto';
import { registrarTipo as t } from '../../textos/registrar-tipo';
import { FormularioRegistrarTipo } from './formulario';

vi.mock('next/navigation', () => ({
  usePathname: () => '/registrar/ingreso',
  useRouter: () => ({ replace: vi.fn(), back: vi.fn(), push: vi.fn() }),
}));
vi.mock('next/link', async () => {
  const { createElement } = await import('react');
  const Enlace = ({ href, children, ...resto }: { href: string; children?: ReactNode }) =>
    createElement('a', { href, ...resto }, children);
  return Object.assign(Enlace, { default: Enlace, useLinkStatus: () => ({ pending: false }) });
});
vi.mock('../../servidor/acciones/transacciones', () => ({
  registrarIngreso: vi.fn(),
  transferirEntreCuentas: vi.fn(),
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
  vi.mocked(registrarIngreso).mockReset();
});

const CUENTA = '00000000-0000-4000-8000-0000000000a1';

async function montar(): Promise<HTMLElement> {
  document.body.style.cssText = 'background: var(--fondo); color: var(--texto)';
  const nodo = document.createElement('div');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  await act(() => {
    raiz.render(
      <FormularioRegistrarTipo
        tipo="ingreso"
        hoy={'2026-10-15' as FechaLocal}
        cuentas={[{ id: CUENTA, nombre: 'Planilla' }]}
        cuentaPropuesta={CUENTA}
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
    b.textContent.startsWith(t.guardarIngreso),
  ) as HTMLButtonElement;
const motivo = () =>
  document.getElementById(guardar().getAttribute('aria-describedby') ?? '')?.textContent;

describe('PRU-CMP-TX registrar ingreso con los campos v3', () => {
  it('PRU-CMP-TX-882 [C-45] CA-K3-3 y CA-K3-13: el total es el billete con las comas solas; sin monto «Guardar ingreso» queda apagado con «Escribí el monto para guardar.», tocarlo no envía, marca el monto y lleva el foco; con el monto envía 1236.45', async () => {
    vi.mocked(registrarIngreso).mockResolvedValue({
      ok: true,
      valor: { id: 't1' },
      yaAplicada: false,
      avisos: [],
    } as never);
    const nodo = await montar();
    expect(nodo.querySelectorAll('.campo-billete')).toHaveLength(1);
    const grupo = nodo.querySelector('.grupo-campos');
    expect(grupo?.textContent).toContain(t.cuentaIngreso);
    expect(grupo?.querySelector('input[name="fecha"]')).not.toBeNull();
    expect(grupo?.textContent).toContain(t.descripcion);
    expect(guardar().getAttribute('aria-disabled')).toBe('true');
    expect(motivo()).toBe(g.motivoMonto);
    await userEvent.click(guardar(), { force: true });
    expect(registrarIngreso).not.toHaveBeenCalled();
    await vi.waitFor(() => {
      expect(document.body.textContent).toContain(base.montoMayorQueCero);
    });
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(total());
    });
    await userEvent.type(total(), '1236.456');
    expect(total().value).toBe('1,236.45');
    expect(guardar().hasAttribute('aria-disabled')).toBe(false);
    await userEvent.click(guardar());
    await vi.waitFor(() => {
      expect(registrarIngreso).toHaveBeenCalledTimes(1);
    });
    expect(vi.mocked(registrarIngreso).mock.calls[0]?.[0]).toMatchObject({
      cuentaId: CUENTA,
      total: '1236.45',
    });
  });
});
