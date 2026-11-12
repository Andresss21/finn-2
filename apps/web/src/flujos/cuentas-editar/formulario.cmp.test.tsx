// FT-53 Editar cuenta con el subtipo de efectivo (CH-224; 07 §17: un texto o un estado es una CMP). El formulario arma la entrada
// de OP-02 con lo que cambió y el valor visto; el resto del flujo lo prueban las E2E de cuentas.
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import type { FechaLocal } from '@finn/dominio/valores';
import '../../app/globals.css';
import { cuentasGestion } from '../../textos/cuentas-gestion';
import { cuentaSubtipo } from '../../textos/cuenta-subtipo';
import { FormularioCuentasEditar } from './formulario';

// `next/link` y `next/navigation` necesitan `process` y el enrutador de Next: se simulan (el enrutado se prueba en E2E).
const replace = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ replace, back: vi.fn() }),
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
  replace.mockClear();
});

async function montar(ui: ReactNode): Promise<HTMLElement> {
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

const ok = (entrada: unknown) =>
  Promise.resolve({ ok: true as const, valor: { entrada }, yaAplicada: false, avisos: [] });
const INST = '00000000-0000-4000-8000-0000000000aa';
const HOY = '2027-02-05' as FechaLocal;
const opcion = (nodo: HTMLElement, nombre: string) =>
  [...nodo.querySelectorAll<HTMLElement>('[role=radio]')].find((r) => r.textContent === nombre);
const guardar = (nodo: HTMLElement) =>
  [...nodo.querySelectorAll('button')].find(
    (b) => b.textContent === cuentasGestion.editar.guardar,
  ) as HTMLElement;

describe('PRU-CMP-CTA-400 editar el subtipo de efectivo', () => {
  it('PRU-CMP-CTA-400 [FT-53] pasar a billetera oculta Institución y Últimos 4 y envía el subtipo con los dos en nulo y lo visto', async () => {
    const esperado = {
      nombre: 'Cuenta BAC',
      subtipoEfectivo: 'corriente',
      institucionId: INST,
      ultimos4: '4821',
      fechaApertura: '2027-01-01',
    };
    const accion = vi.fn(ok);
    const nodo = await montar(
      <FormularioCuentasEditar
        accion={accion}
        cuentaId="k1"
        hoy={HOY}
        instituciones={[{ id: INST, nombre: 'BAC' }]}
        esperado={esperado}
      />,
    );
    expect(
      nodo.querySelector(`[role=radiogroup][aria-label="${cuentaSubtipo.etiqueta}"]`),
    ).not.toBe(null);
    expect(opcion(nodo, 'Corriente')?.getAttribute('aria-checked')).toBe('true');
    expect(nodo.querySelector('input[maxlength="4"]')).not.toBe(null);

    await userEvent.click(opcion(nodo, 'Billetera') as HTMLElement);
    expect(nodo.textContent).toContain(cuentaSubtipo.ayudas.billetera);
    expect(nodo.querySelector('input[maxlength="4"]')).toBe(null);
    expect(nodo.textContent).not.toContain('Institución');

    await userEvent.click(guardar(nodo));
    expect(accion).toHaveBeenCalledTimes(1);
    const entrada = accion.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(entrada).toMatchObject({
      cuentaId: 'k1',
      subtipoEfectivo: 'billetera',
      institucionId: null,
      ultimos4: null,
      esperado,
    });
    expect(entrada).not.toHaveProperty('nombre');
  });

  it('PRU-CMP-CTA-400 [FT-53] una cuenta que no es de efectivo no muestra el segmentado y los últimos 4 dicen «Opcional»', async () => {
    const nodo = await montar(
      <FormularioCuentasEditar
        accion={vi.fn(ok)}
        cuentaId="k2"
        hoy={HOY}
        instituciones={[]}
        esperado={{
          nombre: 'Visa',
          institucionId: null,
          ultimos4: null,
          fechaApertura: '2027-01-01',
        }}
      />,
    );
    expect(nodo.querySelector(`[aria-label="${cuentaSubtipo.etiqueta}"]`)).toBe(null);
    expect(nodo.querySelector('input[maxlength="4"]')?.getAttribute('placeholder')).toBe(
      cuentaSubtipo.opcional,
    );
  });

  it('PRU-CMP-CTA-400 [CH-240] editar una tarjeta muestra límite, tasa, corte y pago y envía solo los que cambian, con lo visto', async () => {
    const esperado = {
      nombre: 'Visa Oro',
      institucionId: null,
      ultimos4: null,
      fechaApertura: '2027-01-01',
      limiteCredito: '2500.00',
      tasaAnual: '24',
      diaCorte: 15,
      diaPago: 5,
    };
    const accion = vi.fn(ok);
    const nodo = await montar(
      <FormularioCuentasEditar
        accion={accion}
        cuentaId="k3"
        hoy={HOY}
        instituciones={[]}
        esperado={esperado}
      />,
    );
    const campo = (etiqueta: string) =>
      [...nodo.querySelectorAll('label')].find((l) => l.textContent?.startsWith(etiqueta))
        ?.control as HTMLInputElement;
    expect(campo('Límite de crédito').value).toBe('2500.00');
    expect(campo('Día de corte').value).toBe('15');
    await userEvent.clear(campo('Día de corte'));
    await userEvent.type(campo('Día de corte'), '20');
    await userEvent.clear(campo('Límite de crédito'));
    await userEvent.type(campo('Límite de crédito'), '3000');
    await userEvent.click(guardar(nodo));
    const entrada = accion.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(entrada).toMatchObject({ cuentaId: 'k3', diaCorte: 20, esperado });
    expect(entrada).not.toHaveProperty('diaPago');
    expect(entrada).not.toHaveProperty('tasaAnual');
    expect(typeof entrada['limiteCredito']).toBe('string');
  });
});
