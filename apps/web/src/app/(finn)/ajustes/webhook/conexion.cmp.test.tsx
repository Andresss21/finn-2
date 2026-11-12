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

function montar(ui: ReactNode): { nodo: HTMLElement } {
  document.body.style.cssText = 'background: var(--fondo); color: var(--texto)';
  const nodo = document.createElement('main');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(ui);
  });
  montados.push({ raiz, nodo });
  return { nodo };
}

const HOY = '2027-02-05';
const enlaceDelToken = (nodo: HTMLElement): HTMLAnchorElement | undefined =>
  [...nodo.querySelectorAll('a')].find((a) => a.getAttribute('href') === '/ajustes/webhook/token');

describe('PRU-CMP-BAND', () => {
  it('PRU-CMP-BAND-101 [CA-03.1] la pantalla nunca muestra el token ni un sufijo ni «Copiar»: dice cuándo se generó y que Finn no lo guarda, y generar abre el flujo corto', () => {
    const sin = montar(<PanelConexion configurado={false} hoy={HOY} formato="json" />);
    expect(sin.nodo.textContent).toContain(t.sinToken);
    expect(enlaceDelToken(sin.nodo)?.textContent).toBe(t.generar);

    const con = montar(
      <PanelConexion configurado rotadoEn="2027-02-05T16:32:00.000Z" hoy={HOY} formato="json" />,
    );
    expect(con.nodo.textContent).toContain('05/02/2027 10:32');
    expect(con.nodo.textContent).toContain(t.noGuardado);
    expect(enlaceDelToken(con.nodo)?.textContent).toBe(t.generarNuevo);
    for (const { nodo } of [sin, con]) {
      expect(nodo.querySelector('[data-testid="token"]')).toBeNull();
      expect([...nodo.querySelectorAll('button')].map((b) => b.textContent)).not.toContain(
        t.copiar,
      );
    }
  });

  it('PRU-CMP-BAND-102 las instrucciones de 04 §8.8 siguen la variante del servidor y nunca llevan el token', () => {
    const json = montar(<PanelConexion configurado={false} hoy={HOY} formato="json" />);
    expect(json.nodo.textContent).toContain(t.cuerpoJson);
    expect(json.nodo.textContent).toContain(t.contenidoJson);
    expect(json.nodo.textContent).not.toContain(t.remitenteTexto);
    expect(json.nodo.textContent).toContain(`/api/sms`);
    const texto = montar(<PanelConexion configurado={false} hoy={HOY} formato="texto" />);
    expect(texto.nodo.textContent).toContain(t.remitenteTexto);
    expect(texto.nodo.textContent).toContain(t.contenidoTexto);
  });

  it('PRU-CMP-BAND-102 la pantalla no tiene violaciones de axe', async () => {
    const { nodo } = montar(
      <PanelConexion configurado rotadoEn="2027-02-05T16:32:00.000Z" hoy={HOY} formato="json" />,
    );
    const { violations } = await axe.run(nodo);
    expect(violations.map((v) => v.id)).toEqual([]);
  });
});

describe('PRU-CMP-AJUS', () => {
  it('PRU-CMP-AJUS-160 [FT-03] (CH-227) Conectar los SMS con ultimoSmsEn dice «Conectado. El último SMS llegó …» con la fecha de la interfaz; sin SMS todavía, solo «Conectado»', () => {
    const conSms = montar(
      <PanelConexion
        configurado
        rotadoEn="2027-02-01T12:00:00.000Z"
        ultimoSmsEn="2027-02-04T10:07:00.000Z"
        hoy={HOY}
        formato="json"
      />,
    );
    const aviso = conSms.nodo.querySelector('[data-conexion]') as HTMLElement;
    expect(aviso.querySelector('[data-estado="positivo"]')).not.toBeNull();
    expect(aviso.textContent).toContain(t.conectadoConSms('el 04/02/2027 a las 04:07'));
    expect(t.conectadoConSms('el 04/02/2027 a las 04:07')).toMatch(
      /^Conectado\. El último SMS llegó /,
    );

    const sinSms = montar(
      <PanelConexion configurado rotadoEn="2027-02-01T12:00:00.000Z" hoy={HOY} formato="json" />,
    );
    const solo = sinSms.nodo.querySelector('[data-conexion]') as HTMLElement;
    expect(solo.textContent).toContain(t.conectado);
    expect(solo.textContent).not.toContain('último SMS');

    // Sin token no está conectado: no hay aviso.
    const sinToken = montar(<PanelConexion configurado={false} hoy={HOY} formato="json" />);
    expect(sinToken.nodo.querySelector('[data-conexion]')).toBeNull();
  });
});
