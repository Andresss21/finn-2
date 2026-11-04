// FT-26 Cambiar el estado bancario (07 §17: un texto o un estado es una CMP). El formulario arma la entrada de OP-30 con el estado
// que vio la persona como `esperado`; si cambia el saldo confirmado lo calcula el servidor y lo prueban las E2E (PF-3).
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import '../../app/globals.css';
import { transaccion as t } from '../../textos/transaccion';
import { FormularioActividadEstado, type PropsFormularioActividadEstado } from './formulario';

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

const ok = Promise.resolve({ ok: true as const, valor: {}, yaAplicada: false, avisos: [] });
const base: Omit<PropsFormularioActividadEstado, 'accion'> = {
  transaccionId: 't1',
  nombre: 'PRICESMART',
  estadoActual: 'pendiente',
  detalle: '/actividad/t1',
};
const radio = (nodo: HTMLElement, nombre: string): HTMLElement => {
  const r = [...nodo.querySelectorAll<HTMLElement>('[role=radio]')].find((x) =>
    x.closest('label')?.textContent?.startsWith(nombre),
  );
  if (r === undefined) throw new Error(`no hay una opción «${nombre}»`);
  return r;
};
const guardar = (nodo: HTMLElement): HTMLButtonElement | undefined =>
  [...nodo.querySelectorAll('button')].find((b) => b.textContent === t.guardarEstado);

describe('PRU-CMP-TX estado bancario de una transacción', () => {
  it('PRU-CMP-TX-454 [CA-26.5] una pendiente ofrece «Pendiente» y «Confirmada»; al elegir «Confirmada» y guardar envía el estado nuevo con el visto como esperado y vuelve al detalle', async () => {
    const accion = vi.fn(() => ok);
    const nodo = await montar(<FormularioActividadEstado {...base} accion={accion} />);
    expect(nodo.textContent).toContain(t.estadoPendiente);
    expect(nodo.textContent).toContain(t.estadoConfirmada);

    await userEvent.click(radio(nodo, 'Confirmada'));
    await userEvent.click(guardar(nodo) as HTMLElement);
    expect(accion).toHaveBeenCalledWith({
      transaccionId: 't1',
      estadoNuevo: 'confirmada',
      modo: 'confirmar',
      esperado: { estado: 'pendiente' },
    });
    expect(replace).toHaveBeenCalledWith('/actividad/t1');
  });

  it('PRU-CMP-TX-455 [] si no se cambia el estado, guardar vuelve al detalle sin llamar al servidor', async () => {
    const accion = vi.fn(() => ok);
    const nodo = await montar(<FormularioActividadEstado {...base} accion={accion} />);
    await userEvent.click(guardar(nodo) as HTMLElement);
    expect(accion).not.toHaveBeenCalled();
    expect(replace).toHaveBeenCalledWith('/actividad/t1');
  });

  it('PRU-CMP-TX-456 [] «Conciliada» no se ofrece: una transacción conciliada explica por qué y no tiene dónde guardar', async () => {
    const accion = vi.fn(() => ok);
    const nodo = await montar(
      <FormularioActividadEstado {...base} estadoActual="conciliada" accion={accion} />,
    );
    expect(nodo.textContent).toContain(t.estadoConciliadaNota);
    expect(nodo.querySelectorAll('[role=radio]')).toHaveLength(0);
    expect(guardar(nodo)).toBeUndefined();
  });

  it('PRU-CMP-TX-457 [] un rechazo del servidor queda a la vista junto al formulario', async () => {
    const accion = vi.fn(() =>
      Promise.resolve({
        ok: false as const,
        error: {
          categoria: 'DOMINIO' as const,
          codigo: 'transicion_estado_bancario_invalida',
          mensaje: 'Ese cambio de estado no está permitido.',
        },
      }),
    );
    const nodo = await montar(<FormularioActividadEstado {...base} accion={accion} />);
    await userEvent.click(radio(nodo, 'Confirmada'));
    await userEvent.click(guardar(nodo) as HTMLElement);
    expect(nodo.textContent).toContain('Ese cambio de estado no está permitido.');
    expect(replace).not.toHaveBeenCalled();
  });
});
