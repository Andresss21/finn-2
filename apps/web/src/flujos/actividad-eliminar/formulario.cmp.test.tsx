// FT-26 Eliminar una transacción (07 §17: un texto o un estado es una CMP). El formulario solo dibuja lo que trae la previsualización
// de OP-29 y arma su entrada: los montos los pone el servidor y los prueban el dominio y las E2E (PF-3).
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import '../../app/globals.css';
import { transaccion as t } from '../../textos/transaccion';
import { FormularioActividadEliminar, type PropsFormularioActividadEliminar } from './formulario';

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

const SALIDAS = '11111111-1111-4111-8111-111111111111';
const ok = (valor: unknown) =>
  Promise.resolve({ ok: true as const, valor, yaAplicada: false, avisos: [] });
const vista = (extra: Record<string, unknown> = {}) => ({
  revisionVista: 'r1',
  huellaImpacto: 'h1',
  impacto: { deltaLpa: 3000, deltaDisponible: [{ categoriaId: SALIDAS, delta: 2000 }] },
  nombres: { [SALIDAS]: 'Salidas' },
  avisos: [],
  ...extra,
});
const base: Omit<PropsFormularioActividadEliminar, 'accion'> = {
  transaccionId: 't1',
  nombre: 'PRICESMART',
  detalle: '/actividad/t1',
  eventos: [],
};

const boton = (nodo: HTMLElement, texto: string): HTMLButtonElement => {
  const b = [...nodo.querySelectorAll('button')].find((x) => x.textContent === texto);
  if (b === undefined) throw new Error(`no hay un botón «${texto}»`);
  return b;
};

describe('PRU-CMP-TX eliminar una transacción', () => {
  it('PRU-CMP-TX-450 [CA-26.1, AV-01] «Ver qué cambia» previsualiza con la transacción y muestra el impacto de AV-01 del servidor; «Eliminar» confirma con la misma revisión y la huella', async () => {
    const accion = vi.fn((entrada: unknown) =>
      (entrada as { modo: string }).modo === 'previsualizar'
        ? ok(vista({ avisos: [{ codigo: 'AV-01' }] }))
        : ok({}),
    );
    const nodo = await montar(<FormularioActividadEliminar {...base} accion={accion} />);
    expect(nodo.textContent).toContain(t.eliminarPregunta('PRICESMART'));

    await userEvent.click(boton(nodo, t.verCambios));
    expect(accion).toHaveBeenLastCalledWith({ transaccionId: 't1', modo: 'previsualizar' });
    expect(nodo.textContent).toContain('+$30.00');
    expect(nodo.textContent).toContain('Salidas');
    expect(nodo.textContent).toContain('+$20.00');
    expect(nodo.textContent).toContain(t.avisosEliminar['AV-01']);

    await userEvent.click(boton(nodo, t.eliminar));
    expect(accion).toHaveBeenLastCalledWith({
      transaccionId: 't1',
      modo: 'confirmar',
      revisionVista: 'r1',
      huellaImpacto: 'h1',
    });
    expect(replace).toHaveBeenCalledWith('/actividad');
  });

  it('PRU-CMP-TX-451 [CA-26.6, AV-16] una transacción conciliada muestra AV-16 antes de eliminar, con el cambio posterior que va a quedar', async () => {
    const accion = vi.fn(() => ok(vista({ avisos: [{ codigo: 'AV-16' }] })));
    const nodo = await montar(<FormularioActividadEliminar {...base} accion={accion} />);
    await userEvent.click(boton(nodo, t.verCambios));
    expect(nodo.textContent).toContain(t.avisosEliminar['AV-16']);
    expect(boton(nodo, t.eliminar)).toBeTruthy();
  });

  it('PRU-CMP-TX-452 [CA-26.4] con eventos vinculados explica transaccion_con_eventos, lista los eventos y enlaza a la transacción, sin ofrecer eliminar', async () => {
    const accion = vi.fn(() => ok({}));
    const nodo = await montar(
      <FormularioActividadEliminar
        {...base}
        accion={accion}
        bloqueo="Esta compra tiene cobros, condonaciones o devoluciones. Eliminalos primero."
        eventos={[
          { clave: 'c1', tipo: 'cobro', fecha: '2027-02-16' as never, monto: 1000 as never },
        ]}
      />,
    );
    expect(nodo.textContent).toContain(t.noSePuedeEliminar);
    expect(nodo.textContent).toContain('Eliminalos primero.');
    expect(nodo.querySelector('[data-eventos]')?.textContent).toContain('$10.00');
    expect(nodo.querySelector('a')?.getAttribute('href')).toBe('/actividad/t1');
    expect([...nodo.querySelectorAll('button')].map((b) => b.textContent)).not.toContain(
      t.verCambios,
    );
    expect(accion).not.toHaveBeenCalled();
  });

  it('PRU-CMP-TX-453 [] si el servidor rechaza al previsualizar, el rechazo queda a la vista y se puede volver a intentar', async () => {
    const accion = vi.fn(() =>
      Promise.resolve({
        ok: false as const,
        error: {
          categoria: 'DOMINIO' as const,
          codigo: 'cuenta_archivada',
          mensaje: 'La cuenta está archivada.',
        },
      }),
    );
    const nodo = await montar(<FormularioActividadEliminar {...base} accion={accion} />);
    await userEvent.click(boton(nodo, t.verCambios));
    expect(nodo.textContent).toContain('La cuenta está archivada.');
    expect(boton(nodo, t.verCambios)).toBeTruthy();
  });
  it('PRU-CMP-TX-501 [CA-28.9] eliminar un evento usa sus textos y envía la entrada de OP-34 en lugar de la transacción, previsualizando primero', async () => {
    const accion = vi.fn((entrada: unknown) =>
      (entrada as { modo: string }).modo === 'previsualizar' ? ok(vista()) : ok({}),
    );
    const nodo = await montar(
      <FormularioActividadEliminar
        {...base}
        accion={accion}
        textos={{
          titulo: t.eliminarEventoTitulo,
          pregunta: t.eliminarEventoPregunta.devolucion,
          nota: t.eliminarEventoNota,
          confirmar: t.eliminarEvento,
        }}
        entrada={{ tipo: 'devolucion', transaccionId: 'd1' }}
      />,
    );
    expect(nodo.textContent).toContain(t.eliminarEventoPregunta.devolucion);
    expect(nodo.textContent).toContain(t.eliminarEventoNota);
    await userEvent.click(boton(nodo, t.verCambios));
    expect(accion).toHaveBeenLastCalledWith({
      tipo: 'devolucion',
      transaccionId: 'd1',
      modo: 'previsualizar',
    });
    await userEvent.click(boton(nodo, t.eliminarEvento));
    expect(accion).toHaveBeenLastCalledWith({
      tipo: 'devolucion',
      transaccionId: 'd1',
      modo: 'confirmar',
      revisionVista: 'r1',
      huellaImpacto: 'h1',
    });
    expect(replace).toHaveBeenCalledWith('/actividad/t1');
  });
});
