// FT-35 y FT-38, los estados con pantalla propia de `/bandeja/[movimientoId]` (S4 del export, CH-137; 07 §17: un texto o un estado de un
// componente es una CMP). Dibujan lo que trae `bandeja()` (`duplicado`, `procesamiento`); las decisiones del pie, el aprobado y el panel
// de computadora los prueban las E2E (las Server Actions no se simulan, 07 §7).
import axe from 'axe-core';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../app/globals.css';
import type { Centavos, FechaLocal } from '@finn/dominio/valores';
import { bandeja as t } from '../../textos/bandeja';
import { cuentas as c } from '../../textos/cuentas';
import { Coincidencia } from './coincidencia';
import Encabezado, { type ResumenDelMovimiento } from './encabezado';
import EstadoPropio, { type DuplicadoDe } from './estados';
import { PanelNavegacion } from './panel-navegacion';

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
  delete document.documentElement.dataset['theme'];
  document.body.removeAttribute('style');
});

function montar(ui: ReactNode): HTMLElement {
  document.body.style.cssText = 'background: var(--fondo); color: var(--texto)';
  const nodo = document.createElement('main');
  nodo.style.width = '350px';
  nodo.className = 'flex flex-col gap-5';
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(ui);
  });
  montados.push({ raiz, nodo });
  return nodo;
}

const IGUAL: DuplicadoDe = {
  tipo: 'transaccion',
  id: '33333333-3333-4333-8333-333333333333',
  fecha: '2027-02-14' as FechaLocal,
  monto: 3000 as Centavos,
  comercio: 'PUMA SANTA ELENA',
  cuenta: 'Visa Oro',
};
const resumen = (extra: Partial<ResumenDelMovimiento> = {}): ResumenDelMovimiento => ({
  vista: 'duplicado',
  comercio: 'PUMA SANTA ELENA',
  monto: 3000 as Centavos,
  sale: true,
  cuenta: 'Visa Oro',
  fecha: '2027-02-14',
  sugerida: null,
  ...extra,
});

describe('PRU-CMP-BAND', () => {
  it('PRU-CMP-BAND-220 [FT-35] un posible duplicado dice con qué gasto coincide y lo muestra en una tarjeta de al menos 44 px que enlaza a la transacción, con la nota de «Es duplicado»', () => {
    const nodo = montar(<EstadoPropio estado="posible_duplicado" duplicado={IGUAL} />);
    expect(nodo.textContent).toContain(t.revisar.igualA('14/02/2027'));
    expect(nodo.textContent).toContain(t.revisar.igualDetalle);
    const tarjeta = nodo.querySelector<HTMLAnchorElement>('a');
    expect(tarjeta?.getAttribute('href')).toBe(`/actividad/${IGUAL.id}`);
    expect(tarjeta?.textContent).toContain('PUMA SANTA ELENA');
    expect(tarjeta?.textContent).toContain('Visa Oro · 14/02/2027');
    expect(tarjeta?.textContent).toContain('−$30.00');
    expect((tarjeta?.getBoundingClientRect().height ?? 0) >= 44).toBe(true);
    expect(nodo.textContent).toContain(t.revisar.duplicadoNota);
    expect(nodo.querySelectorAll('input, select, [role=radiogroup]')).toHaveLength(0);
  });

  it('PRU-CMP-BAND-221 [FT-35] si el gasto igual es otro movimiento, la tarjeta enlaza a ese movimiento; sin él, solo queda el aviso', () => {
    const otro = montar(
      <EstadoPropio
        estado="posible_duplicado"
        duplicado={{ ...IGUAL, tipo: 'movimiento', comercio: null, cuenta: null }}
      />,
    );
    expect(otro.querySelector('a')?.getAttribute('href')).toBe(`/bandeja/${IGUAL.id}`);
    expect(otro.querySelector('a')?.textContent).toContain(c.bandeja.sinComercio);
    const sin = montar(<EstadoPropio estado="posible_duplicado" duplicado={undefined} />);
    expect(sin.querySelector('a')).toBeNull();
    expect(sin.textContent).toContain(c.bandeja.estados.duplicado);
  });

  it('PRU-CMP-BAND-222 [FT-38] un SMS no reconocido invita a registrarlo a mano o descartarlo, y uno con error dice que no se registró nada', () => {
    const no = montar(<EstadoPropio estado="no_reconocido" duplicado={undefined} />);
    expect(no.textContent).toContain(t.revisar.noReconocido);
    const error = montar(<EstadoPropio estado="error" duplicado={undefined} />);
    expect(error.textContent).toContain(t.revisar.falloTitulo);
    expect(error.textContent).toContain(t.revisar.falloTexto);
    expect(error.textContent).toContain('No se registró nada');
  });

  it('PRU-CMP-BAND-223 [FT-35] el encabezado de un movimiento que ya se resolvió dice «Aprobado» o «Descartado» en lugar de su vista', () => {
    const aprobado = montar(
      <Encabezado resumen={resumen({ vista: 'listo', final: 'aprobado' })} />,
    );
    expect(aprobado.textContent).toContain(t.aprobadoSinDatos);
    expect(aprobado.textContent).not.toContain(c.bandeja.estados.listo);
    expect(aprobado.querySelector('[data-estado=positivo]')).not.toBeNull();
    const descartado = montar(
      <Encabezado resumen={resumen({ vista: 'listo', final: 'descartado' })} />,
    );
    expect(descartado.textContent).toContain(t.descartados.descartado);
    expect(descartado.querySelector('[data-estado=cero]')).not.toBeNull();
  });

  it('PRU-CMP-BAND-230 [FT-35] el panel de computadora dice «n de N» y sus flechas enlazan al anterior y al siguiente; en los extremos la flecha está deshabilitada', () => {
    const medio = montar(
      <PanelNavegacion navegacion={{ posicion: 2, total: 6, anterior: 'a', siguiente: 'b' }} />,
    );
    expect(medio.textContent).toContain(t.revisar.panel.posicion(2, 6));
    expect(
      medio.querySelector(`a[aria-label="${t.revisar.panel.anterior}"]`)?.getAttribute('href'),
    ).toBe('/bandeja/a');
    expect(
      medio.querySelector(`a[aria-label="${t.revisar.panel.siguiente}"]`)?.getAttribute('href'),
    ).toBe('/bandeja/b');
    const primero = montar(<PanelNavegacion navegacion={{ posicion: 1, total: 1 }} />);
    expect(primero.querySelector('a')).toBeNull();
    expect([...primero.querySelectorAll('button')].every((b) => b.hasAttribute('disabled'))).toBe(
      true,
    );
  });

  it('PRU-CMP-BAND-224 [FT-35] los estados con pantalla propia no tienen violaciones de axe en claro ni en oscuro', async () => {
    for (const tema of ['light', 'dark']) {
      document.documentElement.dataset['theme'] = tema;
      const nodo = montar(
        <>
          <Encabezado resumen={resumen()} />
          <EstadoPropio estado="posible_duplicado" duplicado={IGUAL} />
          <EstadoPropio estado="no_reconocido" duplicado={undefined} />
          <EstadoPropio estado="error" duplicado={undefined} />
          <Coincidencia
            coincidencia={{
              programada: 'Netflix',
              fecha: '20 de febrero',
              monto: '$15.49',
              registrada: false,
            }}
          />
        </>,
      );
      const { violations } = await axe.run(nodo, {
        runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
      });
      expect(
        violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
      ).toEqual([]);
    }
  });
});
