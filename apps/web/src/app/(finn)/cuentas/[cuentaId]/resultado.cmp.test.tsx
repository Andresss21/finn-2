// CH-240 (E2-13): el resultado de verificar saldo y de pagar la tarjeta queda en el detalle, bajo las acciones, sin pantalla propia.
// Se prueba la pieza que lo dibuja y el contrato de la URL que lo lleva; el recorrido completo lo prueba la E2E del detalle.
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../../../app/globals.css';
import { leerResultado, rutaConResultado } from '../../../../flujos/cuentas-resultado';
import { ResultadoDelFlujo } from './resultado';

vi.mock('next/link', async () => {
  const { createElement } = await import('react');
  const Enlace = ({ href, children, ...resto }: { href: string; children?: ReactNode }) =>
    createElement('a', { href, ...resto }, children);
  return Object.assign(Enlace, { default: Enlace, useLinkStatus: () => ({ pending: false }) });
});
vi.mock('next/navigation', () => ({ usePathname: () => '/', useRouter: () => ({}) }));

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
function montar(ui: ReactNode): HTMLElement {
  const nodo = document.createElement('div');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(ui);
  });
  montados.push({ raiz, nodo });
  return nodo;
}

describe('PRU-CMP-CTA-743 el resultado de un flujo corto queda en el detalle', () => {
  it('PRU-CMP-CTA-743 [CH-240] la URL del detalle lleva el resultado y se lee de vuelta; un valor mal formado no se muestra', () => {
    const verificado = { tipo: 'verificado', fecha: '2027-03-10', marcadas: 12 } as const;
    const pagado = { tipo: 'pagado', monto: '300.00', excedente: true } as const;
    expect(
      leerResultado(
        rutaConResultado('/cuentas/c1', verificado).split('=')[1]?.replace(/%3A/g, ':'),
      ),
    ).toEqual(verificado);
    expect(rutaConResultado('/cuentas/c1', pagado)).toBe(
      '/cuentas/c1?resultado=pagado%3A300.00%3A1',
    );
    expect(leerResultado('pagado:300.00:1')).toEqual(pagado);
    for (const malo of [
      undefined,
      '',
      'pagado',
      'pagado:abc:1',
      'pagado:300.00:2',
      'verificado:ayer:3',
      'otro:1:2',
    ]) {
      expect(leerResultado(malo)).toBeUndefined();
    }
  });

  it('PRU-CMP-CTA-743 [CH-240] verificar saldo sin diferencia dice que coincide y cuántas transacciones quedaron conciliadas, sin tiempo límite ni salida', () => {
    const nodo = montar(
      <ResultadoDelFlujo
        resultado={{ tipo: 'verificado', fecha: '2027-03-10', marcadas: 12 }}
        nombre="Cuenta corriente"
      />,
    );
    const r = nodo.querySelector('[data-testid="resultado"]');
    expect(r?.textContent).toBe(
      'Verificaste el saldo al 10/03/2027: coincide con el banco. 12 transacciones quedaron conciliadas.',
    );
    expect(r?.querySelector('button')).toBeNull();
  });

  it('PRU-CMP-CTA-743 [CH-240] pagar la tarjeta deja «Pago guardado», el aviso del excedente y el enlace a la categoría de pago', () => {
    const nodo = montar(
      <ResultadoDelFlujo
        resultado={{ tipo: 'pagado', monto: '150.00', excedente: true }}
        nombre="Visa Oro"
        categoriaPagoId="pago-visa"
      />,
    );
    expect(nodo.querySelector('[data-testid="resultado"]')?.textContent).toBe(
      'Pago guardado: $150.00 · Visa Oro',
    );
    expect(nodo.textContent).toContain('Pagaste más de lo reservado para Visa Oro');
    const enlace = [...nodo.querySelectorAll('a')].find((a) =>
      a.textContent.includes('categoría de pago'),
    );
    expect(enlace?.getAttribute('href')).toBe('/presupuesto/categorias/pago-visa');
    expect(enlace?.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    // Sin resultado no dibuja nada
    expect(montar(<ResultadoDelFlujo resultado={undefined} nombre="x" />).innerHTML).toBe('');
  });
});
