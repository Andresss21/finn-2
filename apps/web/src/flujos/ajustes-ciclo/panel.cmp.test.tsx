import axe from 'axe-core';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import '../../app/globals.css';
import { ajustesCiclo as t } from '../../textos/ajustes-ciclo';
import { PanelCiclo } from './panel';

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

type Datos = Record<string, string | number>;
const previsualizacion = (avisos: Datos[], rechazos: { codigo: string; datos?: Datos }[] = []) => ({
  ok: true as const,
  valor: {
    revisionVista: 'r1',
    huellaImpacto: rechazos.length > 0 ? null : 'h1',
    impacto: null,
    avisos: avisos.map((datos) => ({
      codigo: 'AV-12',
      momento: 'antes',
      requiereConfirmacion: true,
      datos,
    })),
    rechazos,
  },
  yaAplicada: false,
  avisos: [],
});
const guardado = { ok: true as const, valor: {}, yaAplicada: false, avisos: [] };

/** La acción de OP-19: responde según `modo`, como el envoltorio del servidor. */
const accionCon = (vista: ReturnType<typeof previsualizacion>) =>
  vi.fn((entrada: unknown) =>
    Promise.resolve((entrada as { modo: string }).modo === 'previsualizar' ? vista : guardado),
  );

const AV12_CON_TRANSICION = {
  diaInicio: 1,
  rigeDesde: '2027-12-21',
  transicionInicio: '2027-12-21',
  transicionFin: '2027-12-31',
};
const AV12_SIN_TRANSICION = { diaInicio: 21, rigeDesde: '2027-12-21' };

const boton = (nodo: HTMLElement, texto: string): HTMLButtonElement => {
  const b = [...nodo.querySelectorAll('button')].find((x) => x.textContent === texto);
  if (b === undefined) throw new Error(`no hay un botón «${texto}»`);
  return b;
};
/** Deja correr las promesas de la previsualización (el panel la pide solo al abrir y al elegir un día). */
const esperar = async (): Promise<void> => {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
};
const tocar = async (nodo: HTMLElement, texto: string): Promise<void> => {
  await act(() => {
    boton(nodo, texto).click();
    return Promise.resolve();
  });
  await esperar();
};
const elegirDia = async (nodo: HTMLElement, valor: string): Promise<void> => {
  const select = nodo.querySelector('select');
  if (select === null) throw new Error('no hay selección del día');
  await act(async () => {
    await userEvent.selectOptions(select, valor);
  });
  await esperar();
};
const abrirPanel = async (ui: ReactNode): Promise<HTMLElement> => {
  const nodo = montar(ui);
  await esperar();
  return nodo;
};

describe('PRU-CMP-AJUS', () => {
  it('PRU-CMP-AJUS-110 [CA-72.1] AV-12 dice desde cuándo rige y el período de transición con sus días, el dinero no cambia y «Cambiar al día 1» confirma', async () => {
    const accion = accionCon(previsualizacion([AV12_CON_TRANSICION]));
    const nodo = await abrirPanel(
      <PanelCiclo accion={accion} diaVigente={21} alCerrar={vi.fn()} />,
    );
    // Al abrir ya pidió el impacto del día que está elegido; no hay botón «Ver el cambio»
    expect(accion).toHaveBeenCalledWith({ diaInicio: 21, modo: 'previsualizar' });
    await elegirDia(nodo, '1');

    expect(accion).toHaveBeenLastCalledWith({ diaInicio: 1, modo: 'previsualizar' });
    const texto = nodo.textContent;
    expect(texto).toContain(t.revisar);
    expect(texto).toContain('Rige desde el 21/12/2027');
    expect(texto).toContain('El período del 21/12 al 31/12 será de transición, de 11 días');
    expect(texto).toContain(t.dineroNoCambia);
    expect(texto).toContain('21 → 1');
    expect(boton(nodo, t.confirmarDia(1)).disabled).toBe(false);
  });

  it('PRU-CMP-AJUS-111 [CA-72.4] un día igual al vigente se rechaza con "El ciclo ya empieza el día 21." en el campo y «Cambiar el ciclo» queda deshabilitado y enlazado a ese mensaje', async () => {
    const accion = accionCon(
      previsualizacion([], [{ codigo: 'ciclo_sin_cambio', datos: { dia: 21 } }]),
    );
    const nodo = await abrirPanel(
      <PanelCiclo accion={accion} diaVigente={21} alCerrar={vi.fn()} />,
    );

    expect(nodo.textContent).toContain('El ciclo ya empieza el día 21.');
    expect(nodo.textContent).not.toContain(t.revisar);
    const confirmar = boton(nodo, t.confirmar);
    expect(confirmar.disabled).toBe(true);
    const enlazado = confirmar.getAttribute('aria-describedby');
    expect(enlazado).not.toBeNull();
    expect(document.getElementById(enlazado ?? '')?.textContent).toContain(
      'El ciclo ya empieza el día 21.',
    );
    const select = nodo.querySelector('select');
    expect(select?.getAttribute('aria-invalid')).toBe('true');
    expect(select?.getAttribute('aria-describedby')).toContain(enlazado ?? '');
  });

  it('PRU-CMP-AJUS-112 [CA-72.5] la previsualización no guarda: solo «Cambiar al día 21» confirma, y «Cancelar» cierra sin confirmar', async () => {
    const accion = accionCon(previsualizacion([AV12_SIN_TRANSICION]));
    const alCerrar = vi.fn();
    const nodo = await abrirPanel(
      <PanelCiclo accion={accion} diaVigente={5} alCerrar={alCerrar} />,
    );
    await elegirDia(nodo, '21');
    expect(nodo.textContent).toContain(t.sinTransicion);
    expect(
      accion.mock.calls.every((c) => (c[0] as { modo: string }).modo === 'previsualizar'),
    ).toBe(true);

    const antes = accion.mock.calls.length;
    await tocar(nodo, t.confirmarDia(21));
    expect(accion).toHaveBeenCalledTimes(antes + 1);
    expect(accion).toHaveBeenLastCalledWith({
      diaInicio: 21,
      modo: 'confirmar',
      revisionVista: 'r1',
      huellaImpacto: 'h1',
    });
    expect(nodo.textContent).toContain(t.listo(21, '21/12/2027'));

    const otro = await abrirPanel(
      <PanelCiclo accion={accionCon(previsualizacion([]))} diaVigente={5} alCerrar={alCerrar} />,
    );
    await tocar(otro, 'Cancelar');
    expect(alCerrar).toHaveBeenCalledTimes(1);
  });

  it('PRU-CMP-AJUS-113 [FT-72, Q-ajustes] con una vigencia futura se muestra con su fecha y el día que fijará; sin ella, "Ninguna"', async () => {
    const sin = await abrirPanel(
      <PanelCiclo accion={accionCon(previsualizacion([]))} diaVigente={21} alCerrar={vi.fn()} />,
    );
    expect(sin.querySelector('[data-ciclo-futura]')?.textContent).toBe(t.sinFutura);
    expect(sin.querySelector('[data-ciclo-vigente]')?.textContent).toBe('21');
    sin.remove();

    const con = await abrirPanel(
      <PanelCiclo
        accion={accionCon(previsualizacion([]))}
        diaVigente={21}
        futura={{ diaInicio: 1, rigeDesde: '2027-12-21' }}
        alCerrar={vi.fn()}
      />,
    );
    expect(con.querySelector('[data-ciclo-futura]')?.textContent).toBe(
      'Día 1, desde el 21/12/2027',
    );
  });

  it('PRU-CMP-AJUS-114 [FT-72] la hoja, con el impacto a la vista y con el mismo día, no tiene violaciones de accesibilidad', async () => {
    const nodo = await abrirPanel(
      <PanelCiclo
        accion={accionCon(previsualizacion([AV12_CON_TRANSICION]))}
        diaVigente={21}
        alCerrar={vi.fn()}
      />,
    );
    expect((await axe.run(nodo)).violations).toEqual([]);
    await elegirDia(nodo, '1');
    expect(nodo.textContent).toContain(t.revisar);
    // El botón pasa de deshabilitado a habilitado con una transición de color: axe mide cuando ya terminó
    await new Promise((r) => setTimeout(r, 600));
    expect((await axe.run(nodo)).violations).toEqual([]);
  });
});
