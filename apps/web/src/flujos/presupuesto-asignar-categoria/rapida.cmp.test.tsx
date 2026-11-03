// FT-12 Asignación rápida (07 §17: un texto o un estado es una CMP). `OpcionesRapidas` solo dibuja lo que trae `contexto.rapida` de
// 04 §6.14.4: los valores los calcula el servidor y los prueban el dominio y las E2E (PF-3).
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import '../../app/globals.css';
import { OpcionesRapidas, type DatosRapida, type PropsOpcionesRapidas } from './rapida';

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
  const nodo = document.createElement('div');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(ui);
  });
  montados.push({ raiz, nodo });
  return nodo;
}

const dolares = (n: number) => Math.round(n * 100) as never;
const cuando = (rapida: Partial<DatosRapida>, extra: Partial<PropsOpcionesRapidas> = {}) =>
  montar(
    <OpcionesRapidas
      rapida={{ igualPeriodoAnterior: dolares(0), ...rapida }}
      deshabilitado={false}
      alElegir={vi.fn()}
      {...extra}
    />,
  );
/** Cada botón como «etiqueta|centavos»: el monto que dibuja `Monto` lleva su valor en `data-centavos`. */
const opciones = (nodo: HTMLElement): string[] =>
  [...nodo.querySelectorAll('button')].map((b) => {
    const monto = b.querySelector<HTMLElement>('[data-centavos]');
    return `${monto?.previousElementSibling?.textContent}|${monto?.dataset['centavos']}`;
  });

describe('PRU-CMP-PRES', () => {
  it('PRU-CMP-PRES-120 [CA-12.6] con 2 períodos ofrece «Tu promedio de gasto (2 períodos)» con $85.00; con 1 período, «(1 período)» y su gastado', () => {
    const dos = cuando({ promedioGasto: { monto: dolares(85), periodos: 2 } });
    expect(dos.textContent).toContain('Tu promedio de gasto (2 períodos)');
    expect(opciones(dos)).toContain('Tu promedio de gasto (2 períodos)|8500');
    const uno = cuando({ promedioGasto: { monto: dolares(90), periodos: 1 } });
    expect(opciones(uno)).toContain('Tu promedio de gasto (1 período)|9000');
    const tres = cuando({ promedioGasto: { monto: dolares(100.01), periodos: 3 } });
    expect(opciones(tres)).toContain('Tu promedio de gasto|10001');
  });

  it('PRU-CMP-PRES-121 [CA-12.7] sin períodos cerrados en que existía la categoría no se ofrece «Tu promedio de gasto»', () => {
    const nodo = cuando({});
    expect(nodo.textContent).not.toContain('Tu promedio de gasto');
    expect(opciones(nodo)).toEqual(['Lo mismo que el período pasado|0']);
  });

  it('PRU-CMP-PRES-122 sin meta o con Falta $0.00 no se ofrece «Lo que falta para la meta»; con Falta mayor, sí, con su monto', () => {
    const sinMeta = cuando({});
    expect(sinMeta.textContent).not.toContain('Lo que falta para la meta');
    const cubierta = cuando({ faltaMeta: dolares(200) }, { faltaDeLaMeta: dolares(0) });
    expect(cubierta.textContent).not.toContain('Lo que falta para la meta');
    const conFalta = cuando({ faltaMeta: dolares(120) }, { faltaDeLaMeta: dolares(120) });
    expect(opciones(conFalta)).toContain('Lo que falta para la meta|12000');
  });

  it('PRU-CMP-PRES-123 [CA-12.9] «Cubrir el sobregiro» trae el monto que calculó el servidor y solo se ofrece con sobregiro', () => {
    const con = cuando({ cubrirSobregiro: dolares(146.3) });
    expect(opciones(con)).toContain('Cubrir el sobregiro|14630');
    const sin = cuando({});
    expect(sin.textContent).not.toContain('Cubrir el sobregiro');
  });

  it('PRU-CMP-PRES-124 [CA-12.2] tocar «Lo mismo que el período pasado» elige su variante y, deshabilitado, no elige nada', async () => {
    const alElegir = vi.fn();
    const nodo = cuando({ igualPeriodoAnterior: dolares(250) }, { alElegir });
    const boton = [...nodo.querySelectorAll('button')].find((b) =>
      b.textContent.includes('Lo mismo que el período pasado'),
    );
    expect(boton?.textContent).toContain('$250.00');
    await userEvent.click(boton as HTMLElement);
    expect(alElegir).toHaveBeenCalledExactlyOnceWith('igual_periodo_anterior');
    const quieto = vi.fn();
    const apagado = cuando({}, { alElegir: quieto, deshabilitado: true });
    expect(apagado.querySelector('button')?.disabled).toBe(true);
  });
});
