import axe from 'axe-core';
import { act, useState, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import '../../app/globals.css';
import { Superpuesto, type DesdeSuperpuesto } from '../marco/superpuesto';
import { PaginaFlujo } from '../marco/pagina-flujo';
import { AvisoEnLinea, type EstadoFinanciero } from './aviso';
import { ErrorPantalla } from './error-pantalla';
import { Resultado } from './resultado';
import { Vacio } from './vacio';

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

// Radix escucha el puntero y el teclado de verdad: se opera fuera de `act`.
async function sinAct(accion: () => Promise<void>): Promise<void> {
  const entorno = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean };
  entorno.IS_REACT_ACT_ENVIRONMENT = false;
  try {
    await accion();
  } finally {
    entorno.IS_REACT_ACT_ENVIRONMENT = true;
  }
}

const dialogo = (): HTMLElement =>
  document.querySelector<HTMLElement>('[role=dialog]') as HTMLElement;
const enDialogo = (): boolean => dialogo().contains(document.activeElement);

function Hoja({ desde, alCerrar }: { desde: DesdeSuperpuesto; alCerrar: () => void }) {
  return (
    <Superpuesto
      titulo="Asignar"
      descripcion="Listo para asignar $312.40"
      desde={desde}
      alCerrar={alCerrar}
      acciones={<button type="button">Asignar</button>}
    >
      <label>
        Monto
        <input defaultValue="75.00" />
      </label>
    </Superpuesto>
  );
}

const estados: EstadoFinanciero[] = [
  'positivo',
  'cero',
  'advertencia',
  'problema',
  'deuda',
  'deuda-sin-respaldo',
  'informacion',
];

function Galeria() {
  return (
    <>
      <PaginaFlujo titulo="Pagar tarjeta" alCerrar={() => {}}>
        <AvisoEnLinea estado="problema" titulo="Sobregiro" accion={<a href="#a">Cubrir $26.30</a>}>
          Al cerrar el período, Listo para asignar bajará $26.30.
        </AvisoEnLinea>
        <Resultado
          texto="Asignaste $75.00 a Fondo de emergencia."
          salida={{ etiqueta: 'Deshacer', ejecutar: () => {} }}
        />
        <Vacio titulo="Bandeja al día" texto="No tenés movimientos por revisar." />
        <ErrorPantalla reintentar={() => {}} />
      </PaginaFlujo>
    </>
  );
}

describe('PRU-CMP-VAL-103 superpuestos, avisos, resultados y vacíos', () => {
  it.each(['claro', 'oscuro'] as const)(
    'PRU-CMP-VAL-103 axe sin violaciones en el tema %s',
    async (tema) => {
      document.documentElement.dataset['theme'] = tema;
      const raiz = montar(<Galeria />);
      const { violations } = await axe.run(raiz, {
        runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
      });
      expect(
        violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
      ).toEqual([]);
    },
  );

  it.each(['claro', 'oscuro'] as const)(
    'PRU-CMP-VAL-103 el superpuesto abierto no tiene violaciones de axe en el tema %s',
    async (tema) => {
      document.documentElement.dataset['theme'] = tema;
      montar(<Hoja desde="abajo" alCerrar={() => {}} />);
      const { violations } = await axe.run(dialogo(), {
        runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
      });
      expect(
        violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
      ).toEqual([]);
    },
  );

  it('PRU-CMP-VAL-103 la hoja inferior es un diálogo modal pegado abajo, con foco atrapado, Escape y velo', async () => {
    const cerrar = vi.fn();
    montar(<Hoja desde="abajo" alCerrar={cerrar} />);
    const d = dialogo();
    expect(d.getAttribute('aria-modal')).toBe('true');
    expect(d.getAttribute('aria-labelledby')).toBeTruthy();
    expect(document.getElementById(d.getAttribute('aria-labelledby') ?? '')?.textContent).toBe(
      'Asignar',
    );
    const r = d.getBoundingClientRect();
    expect(Math.round(r.bottom)).toBe(window.innerHeight);
    expect(Math.round(r.width)).toBe(document.documentElement.clientWidth);
    expect(document.querySelector('[data-testid=velo]')).not.toBeNull();
    expect(enDialogo()).toBe(true);

    await sinAct(async () => {
      for (let i = 0; i < 8; i++) {
        await userEvent.keyboard('{Tab}');
        expect(enDialogo()).toBe(true);
      }
      for (let i = 0; i < 4; i++) {
        await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
        expect(enDialogo()).toBe(true);
      }
      await userEvent.keyboard('{Escape}');
    });
    expect(cerrar).toHaveBeenCalledTimes(1);

    cerrar.mockClear();
    await sinAct(async () => {
      await userEvent.click(document.querySelector('[data-testid=velo]') as HTMLElement);
    });
    expect(cerrar).toHaveBeenCalledTimes(1);
  });

  it('PRU-CMP-VAL-103 el panel lateral se pega a la derecha, cierra con el botón y devuelve el foco al disparador', async () => {
    function Con() {
      const [abierto, setAbierto] = useState(false);
      return (
        <>
          <button
            type="button"
            onClick={() => {
              setAbierto(true);
            }}
          >
            Abrir
          </button>
          {abierto ? (
            <Hoja
              desde="lado"
              alCerrar={() => {
                setAbierto(false);
              }}
            />
          ) : null}
        </>
      );
    }
    const raiz = montar(<Con />);
    const disparador = raiz.querySelector('button') as HTMLButtonElement;
    await sinAct(async () => {
      await userEvent.click(disparador);
    });
    await vi.waitFor(() => {
      expect(dialogo()).not.toBeNull();
    });
    const r = dialogo().getBoundingClientRect();
    expect(Math.round(r.right)).toBe(document.documentElement.clientWidth);
    expect(Math.round(r.height)).toBe(window.innerHeight);
    expect(enDialogo()).toBe(true);
    const cerrar = dialogo().querySelector('[aria-label=Cerrar]') as HTMLElement;
    expect(cerrar.getBoundingClientRect().width).toBeGreaterThanOrEqual(44);
    await sinAct(async () => {
      await userEvent.click(cerrar);
    });
    await vi.waitFor(() => {
      expect(document.querySelector('[role=dialog]')).toBeNull();
    });
    // Radix devuelve el foco en el turno siguiente al desmontaje.
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(disparador);
    });
  });

  it('PRU-CMP-VAL-103 sin descripción, el diálogo no declara aria-describedby', () => {
    montar(
      <Superpuesto titulo="Cobrar" alCerrar={() => {}}>
        <p>Hola</p>
      </Superpuesto>,
    );
    expect(dialogo().hasAttribute('aria-describedby')).toBe(false);
  });

  it('PRU-CMP-VAL-103 la página de flujo es un main con h1 y sin foco atrapado', async () => {
    const cerrar = vi.fn();
    const raiz = montar(
      <PaginaFlujo titulo="Pagar tarjeta" alCerrar={cerrar}>
        <p>x</p>
      </PaginaFlujo>,
    );
    expect(raiz.querySelector('main h1')?.textContent).toBe('Pagar tarjeta');
    expect(raiz.querySelector('[role=dialog]')).toBeNull();
    await sinAct(async () => {
      await userEvent.click(raiz.querySelector('[aria-label=Cerrar]') as HTMLElement);
    });
    expect(cerrar).toHaveBeenCalledTimes(1);
  });

  it('PRU-CMP-VAL-103 el aviso en línea comunica cada estado con tres señales: color, glifo y texto', () => {
    const raiz = montar(
      <>
        {estados.map((e) => (
          <AvisoEnLinea key={e} estado={e} titulo={`Título ${e}`}>
            Texto {e}
          </AvisoEnLinea>
        ))}
      </>,
    );
    const fondos = new Set<string>();
    const glifos = new Set<string>();
    for (const e of estados) {
      const aviso = raiz.querySelector<HTMLElement>(`[data-estado="${e}"]`) as HTMLElement;
      const glifo = aviso.querySelector('svg[role=img]') as SVGElement;
      expect(glifo.getAttribute('aria-label'), e).toBeTruthy();
      glifos.add(glifo.innerHTML);
      fondos.add(getComputedStyle(aviso).backgroundColor);
      expect(aviso.textContent).toContain(`Título ${e}`);
      expect(getComputedStyle(aviso).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    }
    expect(glifos.size).toBe(estados.length);
    expect(fondos.size).toBe(estados.length);
  });

  it('PRU-CMP-VAL-103 el aviso lleva role=status solo si aparece después de cargar la pantalla', () => {
    const raiz = montar(
      <>
        <AvisoEnLinea estado="informacion">Con la pantalla</AvisoEnLinea>
        <AvisoEnLinea estado="advertencia" aparecioDespues>
          Después
        </AvisoEnLinea>
      </>,
    );
    const roles = [...raiz.querySelectorAll('[data-estado]')].map((n) => n.getAttribute('role'));
    expect(roles).toEqual([null, 'status']);
  });

  it('PRU-CMP-VAL-103 el resultado de una acción queda en su lugar con su salida y su enlace', async () => {
    const deshacer = vi.fn();
    const raiz = montar(
      <Resultado
        texto="Aprobado: SUPER SELECTOS ESCALON · $35.00"
        salida={{ etiqueta: 'Deshacer', ejecutar: deshacer }}
        enlace={<a href="/transacciones/1">Ver transacción</a>}
      />,
    );
    const r = raiz.querySelector('[data-testid=resultado]') as HTMLElement;
    expect(r.textContent).toContain('Aprobado: SUPER SELECTOS ESCALON');
    expect(r.querySelector('a')?.getAttribute('href')).toBe('/transacciones/1');
    expect(r.getBoundingClientRect().height).toBeGreaterThanOrEqual(56);
    for (const control of r.querySelectorAll('a, button')) {
      expect(control.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    }
    await sinAct(async () => {
      await userEvent.click(r.querySelector('button') as HTMLElement);
    });
    expect(deshacer).toHaveBeenCalledTimes(1);
  });

  it('PRU-CMP-VAL-103 el vacío muestra título y texto, y el error se anuncia y deja reintentar', async () => {
    const reintentar = vi.fn();
    const raiz = montar(
      <>
        <Vacio titulo="Bandeja al día" texto="No tenés movimientos por revisar." />
        <ErrorPantalla reintentar={reintentar} />
      </>,
    );
    expect(raiz.querySelector('h2')?.textContent).toBe('Bandeja al día');
    expect(raiz.querySelector('[role=alert] h2')?.textContent).toBe('Algo salió mal');
    await sinAct(async () => {
      await userEvent.click(raiz.querySelector('[role=alert] button') as HTMLElement);
    });
    expect(reintentar).toHaveBeenCalledTimes(1);
  });
});
