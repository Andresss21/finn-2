// TA-590 (CH-C-2, CH-241 h): el último SMS recibido en Conectar los SMS (`AjustesDto.webhook.ultimoSmsEn`, sin cambios en 04).
import axe from 'axe-core';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../../globals.css';
import { ajustesWebhook as t } from '../../../../textos/ajustes-webhook';
import { PanelConexion } from './conexion';

// Solo el límite externo: `next/link` necesita el enrutador de Next, que el navegador de prueba no tiene.
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

const conexion = (nodo: HTMLElement): HTMLElement =>
  nodo.querySelector<HTMLElement>('[data-conexion]') as HTMLElement;

describe('PRU-CMP-AJUS', () => {
  it('PRU-CMP-AJUS-711 [FT-03] (CH-241 h) con ultimoSmsEn, «Conectado. El último SMS llegó {fecha}» con la fecha formateada; sin él, solo el estado de la conexión', async () => {
    const llegoHoy = montar(
      <PanelConexion
        configurado
        rotadoEn="2027-02-01T12:00:00.000Z"
        ultimoSmsEn="2027-02-05T18:41:00.000Z"
        hoy="2027-02-05"
        formato="json"
      />,
    );
    expect(conexion(llegoHoy).textContent).toContain(
      'Conectado. El último SMS llegó hoy a las 12:41.',
    );

    // Un solo `main` a la vez: axe revisa los puntos de referencia de todo el documento
    expect((await axe.run(llegoHoy)).violations.map((v) => v.id)).toEqual([]);

    const otroDia = montar(
      <PanelConexion
        configurado
        rotadoEn="2027-02-01T12:00:00.000Z"
        ultimoSmsEn="2027-02-04T10:07:00.000Z"
        hoy="2027-02-05"
        formato="json"
      />,
    );
    expect(conexion(otroDia).textContent).toContain(
      'Conectado. El último SMS llegó el 04/02/2027 a las 04:07.',
    );

    const sinSms = montar(
      <PanelConexion
        configurado
        rotadoEn="2027-02-01T12:00:00.000Z"
        hoy="2027-02-05"
        formato="json"
      />,
    );
    expect(conexion(sinSms).textContent).toBe(t.conectado);

    const sinToken = montar(<PanelConexion configurado={false} hoy="2027-02-05" formato="json" />);
    expect(sinToken.querySelector('[data-conexion]')).toBeNull();
  });
});
