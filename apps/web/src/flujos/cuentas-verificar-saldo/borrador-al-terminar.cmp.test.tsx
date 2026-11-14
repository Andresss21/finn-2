// Bug 20: el borrador de «Verificar saldo» (05 §4.11) se borra al terminar con `ok: true`, aunque el paso «Revisar» ya no
// muestre el formulario de los datos. Si quedara, la próxima vez restauraría el id de creación de la verificación ya guardada
// y la previsualización de OP-53 insertaría otra conciliación con ese id (INTERNO).
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../app/globals.css';
import { claveDeBorrador } from '../../formularios/clave-borrador';
import { formularios } from '../../textos/formularios';
import { verificarSaldo as t } from '../../textos/verificar-saldo';
import { FormularioVerificarSaldo } from './formulario';

vi.mock('next/navigation', () => ({
  usePathname: () => '/cuentas/c1/verificar-saldo',
  useRouter: () => ({ replace: vi.fn(), back: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('next/link', async () => {
  const { createElement } = await import('react');
  const Enlace = ({ href, children, ...resto }: { href: string; children?: ReactNode }) =>
    createElement('a', { href, ...resto }, children);
  return Object.assign(Enlace, { default: Enlace, useLinkStatus: () => ({ pending: false }) });
});
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const CLAVE = claveDeBorrador('/cuentas/c1/verificar-saldo');
const ID_GUARDADO = '7d3f6a52-1c0b-4e7a-9a43-5b2f0c9e1d11';

const montados: { raiz: Root; nodo: HTMLElement }[] = [];
afterEach(() => {
  for (const { raiz, nodo } of montados.splice(0)) {
    act(() => {
      raiz.unmount();
    });
    nodo.remove();
  }
  sessionStorage.clear();
});

const previsualizacion = {
  revisionVista: 'r',
  huellaImpacto: 'h',
  propuesta: { saldoFinn: 82727, diferencia: -599, marcaria: 0 },
  avisos: [
    {
      codigo: 'AV-21',
      datos: { operacion: 'OP-20', monto: 599, fechaEstado: '2026-11-14', comercio: 'Ajuste' },
    },
  ],
  rechazos: [],
};

function montar(accion: (p: Record<string, unknown>) => Promise<unknown>): HTMLElement {
  const nodo = document.createElement('div');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  montados.push({ raiz, nodo });
  act(() => {
    raiz.render(
      <FormularioVerificarSaldo
        accion={accion as never}
        cuentaId="c1"
        cuenta="Débito"
        tarjeta={false}
        hoy={'2026-11-14' as never}
        fecha="2026-11-14"
        cantidad={0}
        candidatas={[]}
      />,
    );
  });
  return nodo;
}

const boton = (nodo: HTMLElement, texto: string): HTMLButtonElement | undefined =>
  [...nodo.querySelectorAll('button')].find((b) => b.textContent?.trim() === texto);

describe('PRU-CMP-CTA Verificar saldo: borrador al terminar', () => {
  it('PRU-CMP-CTA-869 [FT-44, FE-14] al confirmar la verificación con ok, se borra el borrador restaurado aunque el paso «Revisar» ya no muestre los datos; al volver a abrir no se restaura el id ya guardado', async () => {
    sessionStorage.setItem(
      CLAVE,
      JSON.stringify({
        version: 1,
        guardadoEn: '2026-11-14T15:00:00.000Z',
        campos: { fecha: '2026-11-14', saldo: '821.28', signo: 'positivo' },
        id: ID_GUARDADO,
        revisionAlAbrir: null,
        avisoVisto: true,
      }),
    );
    const accion = vi.fn((p: Record<string, unknown>) =>
      Promise.resolve(
        p['modo'] === 'confirmar'
          ? { ok: true, valor: { id: p['id'] }, yaAplicada: false, avisos: [] }
          : { ok: true, valor: previsualizacion, yaAplicada: false, avisos: [] },
      ),
    );
    const nodo = montar(accion);
    // El borrador restaura lo escrito y la diferencia en vivo llega del servidor.
    await expect.poll(() => nodo.querySelector('[data-diferencia-vivo]')).not.toBeNull();
    expect(nodo.textContent).toContain(formularios.descartarBorrador);

    await act(async () => {
      boton(nodo, t.verDiferencia)?.click();
      await Promise.resolve();
    });
    await expect.poll(() => boton(nodo, t.revisar)).toBeDefined();
    await act(async () => {
      boton(nodo, t.revisar)?.click();
      await Promise.resolve();
    });
    await expect.poll(() => boton(nodo, t.confirmar)).toBeDefined();
    await act(async () => {
      boton(nodo, t.confirmar)?.click();
      await Promise.resolve();
    });
    await expect.poll(() => nodo.textContent).toContain(t.tituloListo);
    const confirmada = accion.mock.calls.find(([p]) => p['modo'] === 'confirmar')?.[0];
    expect(confirmada?.['id']).toBe(ID_GUARDADO);
    expect(sessionStorage.getItem(CLAVE)).toBeNull();

    // Otra verificación en la misma pestaña empieza de cero: sin borrador ni el id ya guardado.
    const otra = montar(accion);
    await expect.poll(() => otra.querySelector('input[name="saldo"]')).not.toBeNull();
    expect(otra.querySelector<HTMLInputElement>('input[name="saldo"]')?.value).toBe('');
    expect(otra.textContent).not.toContain(formularios.descartarBorrador);
  });
});
