// EntradaFecha (P1-03 del export; 07 §17: un componente con su aspecto y su teclado es una CMP): campo dd/mm/aaaa con las barras
// automáticas y un calendario que se abre con un botón. El «hoy» llega por la prop, nunca del reloj del dispositivo.
import { FechaLocal } from '@finn/dominio/valores';
import axe from 'axe-core';
import { act, useState, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import '../../app/globals.css';
import { EntradaFecha } from './entrada-fecha';

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
  document.body.style.cssText =
    'background: var(--fondo); color: var(--texto); font-family: var(--fuente-cuerpo)';
  const nodo = document.createElement('main');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(ui);
  });
  montados.push({ raiz, nodo });
  return nodo;
}

const HOY = FechaLocal.desdeTexto('2026-10-15');
const APERTURA = FechaLocal.desdeTexto('2026-10-03');

function Campo({
  elegidas,
  inicial = HOY,
}: {
  readonly elegidas: string[];
  readonly inicial?: FechaLocal;
}) {
  const [valor, setValor] = useState<FechaLocal>(inicial);
  return (
    <EntradaFecha
      nombre="fecha"
      etiqueta="Fecha"
      valor={valor}
      alCambiar={(f) => {
        elegidas.push(f);
        setValor(f);
      }}
      minima={APERTURA}
      maxima={HOY}
      hoy={HOY}
      requerido
    />
  );
}

const texto = (raiz: HTMLElement): HTMLInputElement => {
  const campo = raiz.querySelector<HTMLInputElement>('input[type=text]');
  if (campo === null) throw new Error('no hay campo de texto');
  return campo;
};
const boton = (raiz: HTMLElement): HTMLButtonElement => {
  const b = raiz.querySelector<HTMLButtonElement>('button[aria-haspopup=dialog]');
  if (b === null) throw new Error('no hay botón del calendario');
  return b;
};
async function abrir(raiz: HTMLElement): Promise<HTMLElement> {
  await act(async () => {
    await userEvent.click(boton(raiz));
  });
  await vi.waitFor(() => {
    if (raiz.querySelector('[role=dialog]') === null) throw new Error('el calendario no abrió');
  });
  return raiz.querySelector<HTMLElement>('[role=dialog]') as HTMLElement;
}
const celda = (d: HTMLElement, n: string): HTMLButtonElement => {
  const c = [...d.querySelectorAll<HTMLButtonElement>('[role=gridcell] button')].find((b) =>
    b.getAttribute('aria-label')?.startsWith(`${n} de `),
  );
  if (c === undefined) throw new Error(`no hay el día ${n}`);
  return c;
};

const temas = ['claro', 'oscuro'] as const;

describe('PRU-CMP-TX', () => {
  it('PRU-CMP-TX-480 [FT-21] el campo muestra dd/mm/aaaa, pone las barras al escribir y entrega la FechaLocal solo con la fecha completa', async () => {
    const elegidas: string[] = [];
    const raiz = montar(<Campo elegidas={elegidas} />);
    const campo = texto(raiz);
    expect(campo.value).toBe('15/10/2026');
    expect(campo.inputMode).toBe('numeric');
    expect(campo.labels?.[0]?.textContent).toContain('Fecha');
    await act(async () => {
      await userEvent.clear(campo);
      await userEvent.type(campo, '1210');
    });
    expect(campo.value).toBe('12/10');
    expect(elegidas).toEqual([]);
    await act(async () => {
      await userEvent.type(campo, '2026');
    });
    expect(campo.value).toBe('12/10/2026');
    expect(elegidas).toEqual(['2026-10-12']);
  });

  it('PRU-CMP-TX-480 [CA-21.7] una fecha que no existe o fuera del rango avisa y no se entrega', async () => {
    const elegidas: string[] = [];
    const raiz = montar(<Campo elegidas={elegidas} />);
    const campo = texto(raiz);
    await act(async () => {
      await userEvent.clear(campo);
      await userEvent.type(campo, '31022026');
    });
    expect(raiz.textContent).toContain('Esa fecha no existe. Escribila como dd/mm/aaaa.');
    expect(campo.getAttribute('aria-invalid')).toBe('true');
    await act(async () => {
      await userEvent.clear(campo);
      await userEvent.type(campo, '16102026');
    });
    expect(raiz.textContent).toContain('Elegí una fecha dentro del rango permitido.');
    await act(async () => {
      await userEvent.clear(campo);
      await userEvent.type(campo, '02102026');
    });
    expect(raiz.textContent).toContain('Elegí una fecha dentro del rango permitido.');
    expect(elegidas).toEqual([]);
  });

  it('PRU-CMP-TX-481 [FT-21] el botón abre el calendario en el mes de la fecha, con el día elegido, hoy marcado y los días fuera del rango tachados y deshabilitados', async () => {
    const raiz = montar(<Campo elegidas={[]} />);
    expect(boton(raiz).getAttribute('aria-expanded')).toBe('false');
    const dialogo = await abrir(raiz);
    expect(boton(raiz).getAttribute('aria-expanded')).toBe('true');
    expect(dialogo.getAttribute('aria-label')).toBe('Calendario');
    expect(dialogo.textContent).toContain('octubre 2026');
    expect(dialogo.querySelector('[role=grid]')).not.toBeNull();
    expect(dialogo.querySelectorAll('[role=columnheader]')).toHaveLength(7);
    // 1 de octubre de 2026 es jueves: tres celdas vacías antes del 1.
    const primera = dialogo.querySelectorAll('[role=row]')[1];
    expect(primera?.querySelectorAll('[role=gridcell]:empty')).toHaveLength(3);
    expect(celda(dialogo, '15').getAttribute('aria-label')).toBe('15 de octubre, hoy');
    expect(celda(dialogo, '15').getAttribute('aria-current')).toBe('date');
    expect(celda(dialogo, '15').getAttribute('aria-pressed')).toBe('true');
    expect(celda(dialogo, '16').disabled).toBe(true);
    expect(celda(dialogo, '16').getAttribute('aria-label')).toBe('16 de octubre, no disponible');
    expect(celda(dialogo, '2').disabled).toBe(true);
    expect(celda(dialogo, '3').disabled).toBe(false);
    expect(getComputedStyle(celda(dialogo, '16')).textDecorationLine).toBe('line-through');
  });

  it('PRU-CMP-TX-482 [FT-21] elegir un día cierra el calendario, devuelve el foco al botón y entrega la fecha', async () => {
    const elegidas: string[] = [];
    const raiz = montar(<Campo elegidas={elegidas} />);
    const dialogo = await abrir(raiz);
    await act(async () => {
      await userEvent.click(celda(dialogo, '9'));
    });
    expect(raiz.querySelector('[role=dialog]')).toBeNull();
    expect(elegidas).toEqual(['2026-10-09']);
    expect(texto(raiz).value).toBe('09/10/2026');
    expect(document.activeElement).toBe(boton(raiz));
  });

  it('PRU-CMP-TX-483 [FT-21] el teclado recorre el calendario con flechas, Inicio, Fin, RePág y AvPág, elige con Enter y Esc lo cierra', async () => {
    const elegidas: string[] = [];
    const raiz = montar(<Campo elegidas={elegidas} />);
    const dialogo = await abrir(raiz);
    const foco = () => document.activeElement?.getAttribute('aria-label') ?? '';
    expect(foco()).toBe('15 de octubre, hoy');
    await act(async () => {
      await userEvent.keyboard('{ArrowLeft}');
    });
    expect(foco()).toBe('14 de octubre');
    await act(async () => {
      await userEvent.keyboard('{ArrowUp}');
    });
    expect(foco()).toBe('7 de octubre');
    await act(async () => {
      await userEvent.keyboard('{Home}');
    });
    expect(foco()).toBe('5 de octubre'); // lunes
    await act(async () => {
      await userEvent.keyboard('{End}');
    });
    expect(foco()).toBe('11 de octubre'); // domingo
    await act(async () => {
      await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    });
    // El rango termina hoy: el foco no pasa del 15.
    expect(foco()).toBe('15 de octubre, hoy');
    // RePág pide el mes anterior; el rango empieza el 3/10 y el foco se queda en ese límite.
    await act(async () => {
      await userEvent.keyboard('{PageUp}');
    });
    expect(foco()).toBe('3 de octubre');
    expect(dialogo.textContent).toContain('octubre 2026');
    await act(async () => {
      await userEvent.keyboard('{PageDown}');
    });
    expect(foco()).toBe('15 de octubre, hoy');
  });

  it('PRU-CMP-TX-483 [FT-21] Enter elige el día enfocado y Esc cierra sin elegir y devuelve el foco al botón', async () => {
    const elegidas: string[] = [];
    const raiz = montar(<Campo elegidas={elegidas} />);
    await abrir(raiz);
    await act(async () => {
      await userEvent.keyboard('{ArrowLeft}{ArrowLeft}{Enter}');
    });
    expect(elegidas).toEqual(['2026-10-13']);
    expect(raiz.querySelector('[role=dialog]')).toBeNull();
    await abrir(raiz);
    await act(async () => {
      await userEvent.keyboard('{ArrowLeft}{Escape}');
    });
    expect(raiz.querySelector('[role=dialog]')).toBeNull();
    expect(elegidas).toEqual(['2026-10-13']);
    expect(document.activeElement).toBe(boton(raiz));
  });

  it('PRU-CMP-TX-484 [FT-21] las flechas de mes cambian el mes mostrado y cada celda y botón mide al menos 44 px', async () => {
    const raiz = montar(
      <EntradaFecha
        nombre="fecha"
        etiqueta="Fecha"
        valor={HOY}
        alCambiar={() => undefined}
        hoy={HOY}
      />,
    );
    const dialogo = await abrir(raiz);
    const anterior = dialogo.querySelector<HTMLButtonElement>('[aria-label="Mes anterior"]');
    const siguiente = dialogo.querySelector<HTMLButtonElement>('[aria-label="Mes siguiente"]');
    await act(async () => {
      await userEvent.click(siguiente as HTMLButtonElement);
    });
    expect(dialogo.textContent).toContain('noviembre 2026');
    await act(async () => {
      await userEvent.click(anterior as HTMLButtonElement);
      await userEvent.click(anterior as HTMLButtonElement);
    });
    expect(dialogo.textContent).toContain('septiembre 2026');
    for (const b of dialogo.querySelectorAll('button')) {
      const caja = b.getBoundingClientRect();
      expect(caja.width, b.getAttribute('aria-label') ?? '').toBeGreaterThanOrEqual(44);
      expect(caja.height, b.getAttribute('aria-label') ?? '').toBeGreaterThanOrEqual(44);
    }
    const abrirBoton = boton(raiz).getBoundingClientRect();
    expect(abrirBoton.width).toBeGreaterThanOrEqual(44);
    expect(abrirBoton.height).toBeGreaterThanOrEqual(44);
  });

  it.each(temas)(
    'PRU-CMP-TX-485 [FT-21] axe sin violaciones con el calendario cerrado y abierto en el tema %s',
    async (tema) => {
      document.documentElement.dataset['theme'] = tema;
      const raiz = montar(<Campo elegidas={[]} />);
      const reglas = { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] };
      const cerrado = await axe.run(raiz, reglas);
      expect(cerrado.violations.map((v) => v.id)).toEqual([]);
      await abrir(raiz);
      const abierto = await axe.run(raiz, reglas);
      expect(
        abierto.violations.map(
          (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`,
        ),
      ).toEqual([]);
    },
  );
});
