import axe from 'axe-core';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../app/globals.css';
import { ajustesWebhook as t } from '../../textos/ajustes-webhook';
import { PanelToken } from './panel';

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
  window.localStorage.clear();
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

describe('PRU-CMP-AJUS', () => {
  it('PRU-CMP-AJUS-701 [CA-E5-21] el resultado de generar muestra el token completo con «Copiar» y, al desmontar, ningún estado lo conserva', async () => {
    const rotar = rotarOk();
    const alCerrar = vi.fn();
    const { nodo, desmontar } = montar(
      <PanelToken configurado rotar={rotar} alCerrar={alCerrar} />,
    );
    // Antes de confirmar: la advertencia y el botón de peligro; nada de token ni de sufijo
    expect(nodo.textContent).toContain(t.hoja.advertenciaTitulo);
    expect(nodo.textContent).not.toContain(TOKEN);
    expect(rotar).not.toHaveBeenCalled();
    expect(boton(nodo, t.generarNuevo).getAttribute('class')).toMatch(/bg-peligro/);

    await tocar(nodo, t.generarNuevo);
    expect(rotar).toHaveBeenCalledTimes(1);
    // El token completo (43 caracteres), una sola vez, con «Copiar» y «Copialo ahora»
    expect(nodo.querySelector('[data-testid="token"]')?.textContent).toBe(TOKEN);
    expect(nodo.textContent.split(TOKEN).length).toBe(2);
    expect(nodo.textContent).toContain(t.hoja.listoNuevo);
    expect(nodo.textContent).toContain(t.hoja.copialoAhora);
    expect(boton(nodo, t.copiar)).toBeTruthy();
    expect(almacenado()).not.toContain(TOKEN);

    desmontar();
    expect(nodo.textContent).not.toContain(TOKEN);
    expect(almacenado()).not.toContain(TOKEN);
    expect(document.body.textContent).not.toContain(TOKEN);
    // Una hoja nueva arranca sin el token
    const otra = montar(<PanelToken configurado rotar={rotar} alCerrar={alCerrar} />);
    expect(otra.nodo.textContent).not.toContain(TOKEN);
    expect(otra.nodo.querySelector('[data-testid="token"]')).toBeNull();
  });
});

describe('PRU-CMP-AJUS (token)', () => {
  it('PRU-CMP-AJUS-702 [CA-03.1] el token se ve una sola vez: con "Copiar", hasta que lo pegué; al cerrar y volver a abrir ya no está ni en el almacenamiento', async () => {
    const rotar = rotarOk();
    const alCerrar = vi.fn();
    const { nodo, desmontar } = montar(
      <PanelToken configurado={false} rotar={rotar} alCerrar={alCerrar} />,
    );
    expect(nodo.textContent).not.toContain(TOKEN);
    expect(nodo.textContent).not.toContain(t.hoja.advertenciaTitulo);

    await tocar(nodo, t.generar);
    expect(rotar).toHaveBeenCalledTimes(1);
    expect(nodo.querySelector('[data-testid="token"]')?.textContent).toBe(TOKEN);
    expect(nodo.textContent).toContain(t.hoja.listoPrimero);
    expect(nodo.textContent).toContain(`/api/sms`);
    expect(almacenado()).not.toContain(TOKEN);

    await tocar(nodo, t.hoja.listo);
    expect(alCerrar).toHaveBeenCalledTimes(1);
    desmontar();
    const otra = montar(<PanelToken configurado rotar={rotar} alCerrar={alCerrar} />);
    expect(otra.nodo.textContent).not.toContain(TOKEN);
  });

  it('PRU-CMP-AJUS-703 con un token, la hoja advierte antes y no rota hasta confirmar; cancelar cierra sin hacer nada', async () => {
    const rotar = rotarOk();
    const alCerrar = vi.fn();
    const { nodo } = montar(<PanelToken configurado rotar={rotar} alCerrar={alCerrar} />);
    expect(nodo.textContent).toContain(t.hoja.advertencia);
    await tocar(nodo, t.cancelar);
    expect(alCerrar).toHaveBeenCalledTimes(1);
    expect(rotar).not.toHaveBeenCalled();
  });

  it('PRU-CMP-AJUS-704 un error de la operación se muestra con "Intentar de nuevo" y sin token', async () => {
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
    const { nodo } = montar(<PanelToken configurado={false} rotar={rotar} alCerrar={vi.fn()} />);
    await tocar(nodo, t.generar);
    expect(nodo.textContent).toContain('Referencia E-ABC123');
    expect(nodo.querySelector('[data-testid="token"]')).toBeNull();
    expect(boton(nodo, 'Intentar de nuevo')).toBeTruthy();
  });

  it('PRU-CMP-AJUS-705 la hoja, antes y después de generar, no tiene violaciones de axe', async () => {
    const { nodo } = montar(<PanelToken configurado rotar={rotarOk()} alCerrar={vi.fn()} />);
    expect((await axe.run(nodo)).violations.map((v) => v.id)).toEqual([]);
    await tocar(nodo, t.generarNuevo);
    expect((await axe.run(nodo)).violations.map((v) => v.id)).toEqual([]);
  });
});
