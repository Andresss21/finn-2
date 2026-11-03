// FT-37, descartar y restaurar (07 §17: un texto o un estado de un componente es una CMP). Dibuja lo que ofrece cada fila y lo que
// queda en su lugar al descartar; qué estados admite el servidor (OP-39, OP-40) lo prueban el dominio, la integración y las E2E.
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../app/globals.css';
import { Resultado } from '../../componentes/base/resultado';
import {
  MovimientoBandeja,
  type AccionBandeja,
  type MovimientoDto,
} from '../../componentes/dominio/movimiento-bandeja';
import { bandeja as t } from '../../textos/bandeja';
import { cuentas } from '../../textos/cuentas';
import { sePuedeDescartar, textoDescartado, textoRestaurado } from './descarte';

// `next/link` necesita `process` y el enrutador de Next, que el navegador de prueba no tiene (el enrutado se prueba en E2E).
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

function montar(ui: ReactNode): HTMLElement {
  document.body.style.cssText = 'background: var(--fondo); color: var(--texto)';
  const nodo = document.createElement('main');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(ui);
  });
  montados.push({ raiz, nodo });
  return nodo;
}

const base: MovimientoDto = {
  id: 'm1',
  estado: 'pendiente',
  sms: { texto: 'Compra SUPER SELECTOS 45' },
  cuenta: { nombre: 'Visa Oro' },
  fecha: '2027-02-20',
  monto: 4500 as MovimientoDto['monto'],
  comercio: 'SUPER SELECTOS',
  categoriaSugerida: { nombre: 'Super', porRegla: false },
  aprobacion: { posible: true, faltantes: [] },
};
const botones = (nodo: HTMLElement): (string | null)[] =>
  [...nodo.querySelectorAll('button')].map((b) => b.getAttribute('aria-label'));

describe('PRU-CMP-BAND', () => {
  it('PRU-CMP-BAND-130 [CA-37.1] un pendiente listo ofrece «Descartar» y avisa a la lista; su resultado dice qué se descartó y «Restaurar» lo revierte', async () => {
    const acciones: AccionBandeja[] = [];
    const restaurar = vi.fn();
    const nodo = montar(
      <>
        <MovimientoBandeja
          movimiento={base}
          hrefRevisar="/bandeja/m1"
          alAccionar={(a) => acciones.push(a)}
        />
        <Resultado
          texto={textoDescartado(base.comercio, base.monto)}
          salida={{ etiqueta: t.restaurar, ejecutar: restaurar }}
        />
      </>,
    );
    const descartar = nodo.querySelector<HTMLButtonElement>(
      `button[aria-label="${cuentas.bandeja.accionDe(cuentas.bandeja.descartar, 'SUPER SELECTOS')}"]`,
    );
    await act(() => {
      descartar?.click();
      return Promise.resolve();
    });
    expect(acciones).toEqual(['descartar']);

    expect(nodo.querySelector('[data-testid="resultado"]')?.textContent).toContain(
      'Descartaste SUPER SELECTOS $45.00.',
    );
    const salida = [...nodo.querySelectorAll('[data-testid="resultado"] button')].find(
      (b) => b.textContent === t.restaurar,
    );
    await act(() => {
      (salida as HTMLButtonElement).click();
      return Promise.resolve();
    });
    expect(restaurar).toHaveBeenCalledTimes(1);
  });

  it('PRU-CMP-BAND-131 [CA-37.3] un posible duplicado ofrece «Es otro gasto» y el resultado de restaurar no trae salida cuando el estado no la admite', async () => {
    const acciones: AccionBandeja[] = [];
    const nodo = montar(
      <>
        <MovimientoBandeja
          movimiento={{ ...base, estado: 'posible_duplicado' }}
          hrefRevisar="/bandeja/m1"
          alAccionar={(a) => acciones.push(a)}
        />
        <Resultado texto={textoRestaurado(base.comercio, base.monto)} />
      </>,
    );
    expect(botones(nodo)).toEqual([
      cuentas.bandeja.accionDe(cuentas.bandeja.esOtroGasto, 'SUPER SELECTOS'),
      cuentas.bandeja.accionDe(cuentas.bandeja.descartar, 'SUPER SELECTOS'),
    ]);
    await act(() => {
      nodo.querySelector('button')?.click();
      return Promise.resolve();
    });
    expect(acciones).toEqual(['es-otro-gasto']);
    expect(nodo.querySelector('[data-testid="resultado"]')?.textContent).toContain(
      'Restauraste SUPER SELECTOS $45.00.',
    );
    expect(nodo.querySelectorAll('[data-testid="resultado"] button')).toHaveLength(0);
  });

  it('PRU-CMP-BAND-132 [CA-37.6] un movimiento con coincidencia no ofrece «Descartar» ni como acción ni como salida al restaurar', () => {
    const nodo = montar(
      <MovimientoBandeja
        movimiento={{ ...base, estado: 'con_coincidencia' }}
        hrefRevisar="/bandeja/m1"
      />,
    );
    expect(nodo.querySelectorAll('button')).toHaveLength(0);
    expect(nodo.textContent).not.toContain(cuentas.bandeja.descartar);
    expect(sePuedeDescartar('con_coincidencia')).toBe(false);
    for (const estado of ['pendiente', 'posible_duplicado', 'no_reconocido', 'error'])
      expect(sePuedeDescartar(estado)).toBe(true);
  });
});
