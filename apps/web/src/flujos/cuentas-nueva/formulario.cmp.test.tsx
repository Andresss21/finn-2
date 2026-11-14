// FT-50 Crear cuenta con un borrador anterior (05 §4.11): un borrador guardado antes de que el formulario tuviera un campo no
// trae esa clave. Al restaurarlo, la clave que falta toma su valor inicial y el campo se muestra vacío, sin romper la pantalla.
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import type { FechaLocal } from '@finn/dominio/valores';
import '../../app/globals.css';
import { cuentaSubtipo } from '../../textos/cuenta-subtipo';
import { cuentasNueva as t } from '../../textos/cuentas-nueva';
import { claveDeBorrador } from '../../formularios/clave-borrador';
import { valoresIniciales } from './campos';
import { FormularioCuentaNueva } from './formulario';

// `next/link` y `next/navigation` necesitan el enrutador de Next, y la acción es del servidor: se simulan.
vi.mock('next/navigation', () => ({
  usePathname: () => '/cuentas/nueva',
  useRouter: () => ({ replace: vi.fn(), back: vi.fn() }),
}));
vi.mock('next/link', async () => {
  const { createElement } = await import('react');
  const Enlace = ({ href, children, ...resto }: { href: string; children?: ReactNode }) =>
    createElement('a', { href, ...resto }, children);
  return Object.assign(Enlace, { default: Enlace, useLinkStatus: () => ({ pending: false }) });
});
vi.mock('../../servidor/acciones/cuentas', () => ({ crearCuenta: vi.fn() }));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

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

const HOY = '2027-02-05' as FechaLocal;

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

const entrada = (nodo: HTMLElement, etiqueta: string): HTMLInputElement | undefined =>
  [...nodo.querySelectorAll('label')]
    .filter((l) => l.textContent.trim().startsWith(etiqueta))
    .map((l) => l.control)
    .find((c): c is HTMLInputElement => c instanceof HTMLInputElement);

describe('PRU-CMP-CTA-820 crear un préstamo con un borrador anterior', () => {
  it('PRU-CMP-CTA-820 [FT-50] con un borrador sin seguro del primer mes ni comisión, elegir Banco Agrícola muestra los dos campos vacíos y no rompe', async () => {
    // El borrador de antes de que existieran los dos campos: sin sus claves.
    const viejo = Object.fromEntries(
      Object.entries(valoresIniciales(HOY, 'efectivo', 'Préstamo de Ana')).filter(
        ([clave]) => clave !== 'seguroPrimerMes' && clave !== 'comision',
      ),
    );
    sessionStorage.setItem(
      claveDeBorrador('/cuentas/nueva'),
      JSON.stringify({
        version: 1,
        guardadoEn: '2027-02-05T10:00:00Z',
        campos: viejo,
        id: null,
        esperado: undefined,
        revisionAlAbrir: null,
      }),
    );
    const nodo = await montar(
      <FormularioCuentaNueva
        hoy={HOY}
        tipoInicial="efectivo"
        subtipo={cuentaSubtipo}
        instituciones={[]}
        nombresTarjetaUsados={[]}
      />,
    );
    await expect
      .poll(() => (entrada(nodo, t.nombre)?.value ?? '') === 'Préstamo de Ana')
      .toBe(true);

    await userEvent.click(nodo.querySelector('label[data-tipo-cuenta=prestamo]') as HTMLElement);
    await expect.poll(() => nodo.querySelector('details[data-seccion=condiciones]')).not.toBeNull();
    await userEvent.click(
      nodo.querySelector('details[data-seccion=condiciones] summary') as HTMLElement,
    );
    const agricola = [...nodo.querySelectorAll<HTMLElement>('[role=radio]')].find(
      (r) => r.closest('label')?.textContent.trim() === t.modelos.banco_agricola,
    );
    expect(agricola).toBeDefined();
    await userEvent.click(agricola as HTMLElement);

    await expect.poll(() => entrada(nodo, t.seguroPrimerMes)?.value).toBe('');
    expect(entrada(nodo, t.comision)?.value).toBe('');
    expect(nodo.textContent).toContain(t.titulo);
  });
});
