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
const tocar = async (nodo: HTMLElement, texto: string): Promise<void> => {
  await act(() => {
    boton(nodo, texto).click();
    return Promise.resolve();
  });
};
const elegirDia = async (nodo: HTMLElement, valor: string): Promise<void> => {
  const select = nodo.querySelector('select');
  if (select === null) throw new Error('no hay selección del día');
  await act(async () => {
    await userEvent.selectOptions(select, valor);
  });
};

describe('PRU-CMP-AJUS', () => {
  it('PRU-CMP-AJUS-110 [CA-72.1] AV-12 dice desde cuándo rige y el período de transición con sus días, y el dinero no cambia', async () => {
    const accion = accionCon(previsualizacion([AV12_CON_TRANSICION]));
    const nodo = montar(<PanelCiclo accion={accion} diaVigente={21} />);
    await elegirDia(nodo, '1');
    await tocar(nodo, t.verCambio);

    expect(accion).toHaveBeenCalledWith({ diaInicio: 1, modo: 'previsualizar' });
    const texto = nodo.textContent;
    expect(texto).toContain(t.revisar);
    expect(texto).toContain('Rige desde el 21/12/2027.');
    expect(texto).toContain('El período del 21/12 al 31/12 (11 días) será de transición');
    expect(texto).toContain(t.dineroNoCambia);
  });

  it('PRU-CMP-AJUS-111 [CA-72.4] un día igual al vigente se rechaza con "El ciclo ya empieza el día 21." y no ofrece confirmar', async () => {
    const accion = accionCon(
      previsualizacion([], [{ codigo: 'ciclo_sin_cambio', datos: { dia: 21 } }]),
    );
    const nodo = montar(<PanelCiclo accion={accion} diaVigente={21} />);
    await tocar(nodo, t.verCambio);

    expect(nodo.textContent).toContain('El ciclo ya empieza el día 21.');
    expect(nodo.textContent).not.toContain(t.revisar);
    expect([...nodo.querySelectorAll('button')].some((b) => b.textContent === t.confirmar)).toBe(
      false,
    );
    expect(nodo.querySelector('select')?.getAttribute('aria-invalid')).toBe('true');
  });

  it('PRU-CMP-AJUS-112 [CA-72.5] la previsualización no guarda: solo "Cambiar el ciclo" confirma, y "Volver a editar" regresa sin confirmar', async () => {
    const accion = accionCon(previsualizacion([AV12_SIN_TRANSICION]));
    const nodo = montar(<PanelCiclo accion={accion} diaVigente={5} />);
    await elegirDia(nodo, '21');
    await tocar(nodo, t.verCambio);
    expect(nodo.textContent).toContain(t.sinTransicion);
    expect(accion).toHaveBeenCalledTimes(1);

    await tocar(nodo, t.volverAEditar);
    expect(nodo.querySelector('select')).not.toBeNull();
    expect(accion).toHaveBeenCalledTimes(1);

    await tocar(nodo, t.verCambio);
    await tocar(nodo, t.confirmar);
    expect(accion).toHaveBeenCalledTimes(3);
    expect(accion).toHaveBeenLastCalledWith({
      diaInicio: 21,
      modo: 'confirmar',
      revisionVista: 'r1',
      huellaImpacto: 'h1',
    });
    expect(nodo.textContent).toContain(t.listo(21, '21/12/2027'));
  });

  it('PRU-CMP-AJUS-113 [FT-72, Q-ajustes] con una vigencia futura se muestra con su fecha y el día que fijará; sin ella, "Ninguna"', () => {
    const sin = montar(<PanelCiclo accion={accionCon(previsualizacion([]))} diaVigente={21} />);
    expect(sin.querySelector('[data-ciclo-futura]')?.textContent).toBe(t.sinFutura);
    expect(sin.querySelector('[data-ciclo-vigente]')?.textContent).toBe('21');

    const con = montar(
      <PanelCiclo
        accion={accionCon(previsualizacion([]))}
        diaVigente={21}
        futura={{ diaInicio: 1, rigeDesde: '2027-12-21' }}
      />,
    );
    expect(con.querySelector('[data-ciclo-futura]')?.textContent).toBe(
      'Día 1, desde el 21/12/2027',
    );
  });

  it('PRU-CMP-AJUS-114 [FT-72] la pantalla y la confirmación no tienen violaciones de accesibilidad', async () => {
    const nodo = montar(
      <PanelCiclo accion={accionCon(previsualizacion([AV12_CON_TRANSICION]))} diaVigente={21} />,
    );
    expect((await axe.run(nodo)).violations).toEqual([]);
    await elegirDia(nodo, '1');
    await tocar(nodo, t.verCambio);
    expect((await axe.run(nodo)).violations).toEqual([]);
  });
});
