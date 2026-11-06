// Cuerpo de `/ajustes/diagnostico` (FT-76, CMP): la lista de eventos con su buscador y el disparador de «Ejecutar tareas ahora».
import axe from 'axe-core';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../../globals.css';
import { ajustesDiagnostico as t } from '../../../../textos/ajustes-diagnostico';
import { PanelDiagnostico, type EventoDiagnostico } from './panel';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const EVENTOS: readonly EventoDiagnostico[] = [
  {
    ocurridoEn: '2027-02-10T16:00:00.000Z',
    nivel: 'error',
    origen: 'app',
    mensaje: 'INTERNO FN042 OP-20',
    idError: 'E-7K2QPX',
  },
  {
    ocurridoEn: '2027-02-10T15:00:00.000Z',
    nivel: 'aviso',
    origen: 'webhook',
    mensaje: 'token_invalido',
  },
];

const montados: { raiz: Root; nodo: HTMLElement }[] = [];
afterEach(() => {
  for (const { raiz, nodo } of montados.splice(0)) {
    act(() => {
      raiz.unmount();
    });
    nodo.remove();
  }
  document.documentElement.removeAttribute('data-theme');
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

const ok = () =>
  vi.fn(() =>
    Promise.resolve({
      ok: true as const,
      valor: { hoy: '2027-02-10' },
      yaAplicada: false,
      avisos: [],
    }),
  );

async function escribir(nodo: HTMLElement, texto: string): Promise<void> {
  const caja = nodo.querySelector('input[type="search"]') as HTMLInputElement;
  await act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(caja, texto);
    caja.dispatchEvent(new Event('input', { bubbles: true }));
    return Promise.resolve();
  });
}

const filas = (nodo: HTMLElement): string[] =>
  [...nodo.querySelectorAll('[data-rol="eventos"] > li')].map((x) => x.textContent);

describe('PRU-CMP-AJUS-15x diagnóstico', () => {
  it('PRU-CMP-AJUS-150 [CA-76.3] buscar por la referencia de un error deja ese evento, con su referencia a la vista', async () => {
    const nodo = montar(<PanelDiagnostico eventos={EVENTOS} ejecutar={ok()} />);
    expect(filas(nodo)).toHaveLength(2);
    await escribir(nodo, 'e-7k2qpx');
    const visibles = filas(nodo);
    expect(visibles).toHaveLength(1);
    expect(visibles[0]).toContain('E-7K2QPX');
    expect(visibles[0]).toContain(t.nivel.error);
    await escribir(nodo, 'no existe');
    expect(filas(nodo)).toHaveLength(0);
    expect(nodo.textContent).toContain(t.sinResultados);
  });

  it('PRU-CMP-AJUS-151 [CA-76.4] «Ejecutar tareas ahora» llama a la acción una vez y avisa cuando terminó', async () => {
    const ejecutar = ok();
    const nodo = montar(<PanelDiagnostico eventos={EVENTOS} ejecutar={ejecutar} />);
    const boton = [...nodo.querySelectorAll('button')].find((b) => b.textContent === t.ejecutar);
    expect(boton).toBeDefined();
    await act(() => {
      boton?.click();
      return Promise.resolve();
    });
    expect(ejecutar).toHaveBeenCalledTimes(1);
    expect(nodo.textContent).toContain(t.ejecutadas);
  });

  it('PRU-CMP-AJUS-152 [CA-76.3] sin eventos lo dice, y con la versión desplegada la muestra', () => {
    const nodo = montar(
      <PanelDiagnostico eventos={[]} ejecutar={ok()} version="0123456789abcdef" />,
    );
    expect(nodo.textContent).toContain(t.sinEventos);
    expect(nodo.querySelector('[data-testid="version"]')?.textContent).toBe('0123456789ab');
  });

  it.each(['claro', 'oscuro'] as const)(
    'PRU-CMP-AJUS-153 [CA-76.3] el panel no tiene violaciones de accesibilidad en el tema %s',
    async (tema) => {
      document.documentElement.dataset['theme'] = tema;
      const nodo = montar(<PanelDiagnostico eventos={EVENTOS} ejecutar={ok()} version="abc" />);
      const { violations } = await axe.run(nodo, {
        runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
      });
      expect(violations.map((v) => v.id)).toEqual([]);
    },
  );
});
