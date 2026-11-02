import axe from 'axe-core';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../app/globals.css';
import { ajustesWebhook as t } from '../../textos/ajustes-webhook';
import { PanelConexion } from './conexion';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const TOKEN = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOP-_';
const montados: { raiz: Root; nodo: HTMLElement }[] = [];
afterEach(() => {
  for (const { raiz, nodo } of montados.splice(0)) {
    act(() => {
      raiz.unmount();
    });
    nodo.remove();
  }
  window.sessionStorage.clear();
});

function montar(ui: ReactNode): { nodo: HTMLElement; desmontar: () => void } {
  document.body.style.cssText = 'background: var(--fondo); color: var(--texto)';
  const nodo = document.createElement('main');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(ui);
  });
  montados.push({ raiz, nodo });
  return {
    nodo,
    desmontar: () => {
      act(() => {
        raiz.unmount();
      });
    },
  };
}

const rotarOk = () =>
  vi.fn(() =>
    Promise.resolve({ ok: true as const, valor: { token: TOKEN }, yaAplicada: false, avisos: [] }),
  );
const boton = (nodo: HTMLElement, texto: string): HTMLButtonElement => {
  const b = [...nodo.querySelectorAll('button')].find((x) => x.textContent === texto);
  if (b === undefined) throw new Error(`no hay un botón «${texto}»`);
  return b;
};
const tocar = async (nodo: HTMLElement, texto: string): Promise<void> => {
  await act(() => {
    boton(nodo, texto).click();
    return Promise.resolve();
  });
};
const almacenado = (): string =>
  JSON.stringify([Object.entries(window.sessionStorage), Object.entries(window.localStorage)]);

describe('PRU-CMP-BAND', () => {
  it('PRU-CMP-BAND-101 [CA-03.1] el token se ve una sola vez: con "Copiar", hasta que lo pegué; al cerrar y volver a abrir ya no está ni en el almacenamiento', async () => {
    const rotar = rotarOk();
    const { nodo, desmontar } = montar(
      <PanelConexion configurado={false} formato="json" rotar={rotar} />,
    );
    expect(nodo.textContent).toContain(t.sinToken);
    expect(nodo.textContent).not.toContain(TOKEN);

    await tocar(nodo, t.generar);
    expect(rotar).toHaveBeenCalledTimes(1);
    expect(nodo.querySelector('[data-testid="token"]')?.textContent).toBe(TOKEN);
    expect(nodo.textContent).toContain(t.copiaAhora);
    expect(nodo.textContent).toContain(`/api/sms`);
    expect(boton(nodo, t.copiar)).toBeTruthy();
    // CA-03.4 (el lado del componente): el token no pasa por `sessionStorage` ni por `localStorage`
    expect(almacenado()).not.toContain(TOKEN);

    await tocar(nodo, t.yaLoPegue);
    expect(nodo.textContent).not.toContain(TOKEN);

    // Cerrar y volver a abrir: el servidor ya dice que hay token y el componente nuevo no lo conoce
    desmontar();
    const otra = montar(
      <PanelConexion
        configurado
        rotadoEn="2027-02-05T16:32:00.000Z"
        formato="json"
        rotar={rotar}
      />,
    );
    expect(otra.nodo.textContent).not.toContain(TOKEN);
    expect(otra.nodo.textContent).toContain('05/02/2027 10:32');
  });

  it('PRU-CMP-BAND-102 con token, "Cambiar token" advierte antes y no rota hasta confirmar; cancelar no hace nada', async () => {
    const rotar = rotarOk();
    const { nodo } = montar(
      <PanelConexion
        configurado
        rotadoEn="2027-02-05T16:32:00.000Z"
        formato="json"
        rotar={rotar}
      />,
    );
    expect(nodo.textContent).not.toContain(t.sinToken);
    await tocar(nodo, t.cambiar);
    expect(nodo.textContent).toContain(t.advertenciaCambio);
    expect(rotar).not.toHaveBeenCalled();
    await tocar(nodo, t.cancelar);
    expect(nodo.textContent).not.toContain(t.advertenciaCambio);
    expect(rotar).not.toHaveBeenCalled();

    await tocar(nodo, t.cambiar);
    await tocar(nodo, t.confirmarCambio);
    expect(rotar).toHaveBeenCalledTimes(1);
    expect(nodo.querySelector('[data-testid="token"]')?.textContent).toBe(TOKEN);
  });

  it('PRU-CMP-BAND-102 las instrucciones de 04 §8.8 siguen la variante del servidor y nunca llevan el token', async () => {
    const json = montar(<PanelConexion configurado={false} formato="json" rotar={rotarOk()} />);
    expect(json.nodo.textContent).toContain(t.cuerpoJson);
    expect(json.nodo.textContent).toContain(t.contenidoJson);
    expect(json.nodo.textContent).not.toContain(t.remitenteTexto);
    const texto = montar(<PanelConexion configurado={false} formato="texto" rotar={rotarOk()} />);
    expect(texto.nodo.textContent).toContain(t.remitenteTexto);
    expect(texto.nodo.textContent).toContain(t.contenidoTexto);
    await tocar(texto.nodo, t.generar);
    // El token se muestra en un solo lugar: las instrucciones dicen "el token que copiaste"
    expect(texto.nodo.textContent.split(TOKEN).length).toBe(2);
  });

  it('PRU-CMP-BAND-102 un error de la operación se muestra con "Intentar de nuevo" y sin token', async () => {
    const rotar = vi.fn(() =>
      Promise.resolve({
        ok: false as const,
        error: {
          categoria: 'INTERNO' as const,
          codigo: 'interno',
          mensaje: 'Algo falló. Referencia E-ABC123.',
        },
      }),
    );
    const { nodo } = montar(<PanelConexion configurado={false} formato="json" rotar={rotar} />);
    await tocar(nodo, t.generar);
    expect(nodo.textContent).toContain('Referencia E-ABC123');
    expect(nodo.querySelector('[data-testid="token"]')).toBeNull();
    expect(boton(nodo, 'Intentar de nuevo')).toBeTruthy();
  });

  it('PRU-CMP-BAND-102 el panel con el token a la vista no tiene violaciones de axe', async () => {
    const { nodo } = montar(<PanelConexion configurado={false} formato="json" rotar={rotarOk()} />);
    await tocar(nodo, t.generar);
    const { violations } = await axe.run(nodo);
    expect(violations.map((v) => v.id)).toEqual([]);
  });
});
