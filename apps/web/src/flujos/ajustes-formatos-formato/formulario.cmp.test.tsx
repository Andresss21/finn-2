// FT-73 Formatos bancarios (07 §17: un texto, un estado o el foco de un componente es una CMP). El formulario solo dibuja lo que trae
// `formulario({ operacion: 'formato' })` y arma la entrada de OPT-05 y OPT-06: la política del patrón la aplica el servidor y la prueban
// el dominio, la integración y la E2E.
import axe from 'axe-core';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import '../../app/globals.css';
import { ajustesFormatos as t } from '../../textos/ajustes-formatos';
import type { SalidaProbar } from '@finn/aplicacion/operaciones/formatos';
import { FormularioFormato, type PropsFormularioFormato } from './formulario';

// `next/navigation` necesita `process`: el enrutador se simula para ver adónde manda el marco del flujo.
const replace = vi.fn();
vi.mock('next/navigation', () => ({ usePathname: () => '/', useRouter: () => ({ replace }) }));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const montados: { raiz: Root; nodo: HTMLElement }[] = [];
afterEach(() => {
  for (const { raiz, nodo } of montados.splice(0)) {
    act(() => {
      raiz.unmount();
    });
    nodo.remove();
  }
  replace.mockClear();
  sessionStorage.clear();
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

const BAC = '11111111-1111-4111-8111-111111111111';
const FORMATO_ID = '22222222-2222-4222-8222-222222222222';
const SMS_ID = '33333333-3333-4333-8333-333333333333';
const ok = <T,>(valor: T) =>
  Promise.resolve({ ok: true as const, valor, yaAplicada: false, avisos: [] });
const formato = {
  id: FORMATO_ID,
  institucion: { id: BAC, nombre: 'BAC' },
  nombre: 'BAC compra',
  tipoMovimiento: 'compra',
  patron: String.raw`(?<ultimos4>\d{4}) (?<monto>[\d.]+)`,
  banderas: 'i',
  montoSeparadorMiles: ',',
  montoSeparadorDecimal: '.',
  formatosFecha: ['AAAA/MM/DD'],
  activo: true,
};
const base = (extra: Partial<PropsFormularioFormato> = {}): PropsFormularioFormato => ({
  guardar: vi.fn(() => ok({ formatoId: FORMATO_ID, accion: 'editar' })),
  probar: vi.fn(() => ok<SalidaProbar>({ coincide: true, demasiadoLargo: false })),
  instituciones: [{ id: BAC, nombre: 'BAC' }],
  smsParaProbar: [
    {
      smsId: SMS_ID,
      texto: 'Compra de 4821 por 1,5x',
      recibidoEn: '2027-02-18T20:00:00.000Z',
      estado: 'no_reconocido',
    },
  ],
  formato,
  ...extra,
});

const boton = (nodo: HTMLElement, texto: string): HTMLButtonElement => {
  const b = [...nodo.querySelectorAll('button')].find((x) => x.textContent === texto);
  if (b === undefined) throw new Error(`no hay un botón «${texto}»`);
  return b;
};
const tocar = async (nodo: HTMLElement, texto: string): Promise<void> => {
  await act(async () => {
    boton(nodo, texto).click();
    await Promise.resolve();
  });
};

describe('PRU-CMP-AJUS', () => {
  it('PRU-CMP-AJUS-120 [CA-73.3] probar contra un SMS muestra los grupos capturados y qué normalizador falló, y no guarda nada', async () => {
    const props = base({
      probar: vi.fn(() =>
        ok<SalidaProbar>({
          coincide: false,
          demasiadoLargo: false,
          grupos: { ultimos4: '4821', monto: '1,5x' },
          fallo: 'monto',
        }),
      ),
    });
    const nodo = montar(<FormularioFormato {...props} />);
    await tocar(nodo, t.probar.boton);
    const resultado = nodo.querySelector('[data-resultado-prueba]');
    expect(resultado?.textContent).toContain(t.probar.fallo.monto);
    expect(resultado?.textContent).toContain('ultimos4');
    expect(resultado?.textContent).toContain('4821');
    expect(resultado?.textContent).toContain('1,5x');
    expect(props.probar).toHaveBeenCalledWith(
      expect.objectContaining({
        smsId: SMS_ID,
        formato: expect.objectContaining({ patron: formato.patron, institucionId: BAC }),
      }),
    );
    expect(props.guardar).not.toHaveBeenCalled();
  });

  it('PRU-CMP-AJUS-121 [FT-73] editar manda el id del formato con lo escrito y un rechazo de la política se ve en el campo del patrón', async () => {
    const mensaje = 'El patrón puede tardar demasiado (grado 3). Simplificalo.';
    const props = base({
      guardar: vi.fn(() =>
        Promise.resolve({
          ok: false as const,
          error: {
            categoria: 'VALIDACION' as const,
            codigo: 'patron_lento',
            mensaje,
            campos: { patron: mensaje },
          },
        }),
      ),
    });
    const nodo = montar(<FormularioFormato {...props} />);
    const nombre = nodo.querySelector<HTMLInputElement>('input:not([type=checkbox])');
    if (nombre === null) throw new Error('no hay campo de nombre');
    await act(async () => {
      await userEvent.fill(nombre, 'BAC compra 2');
    });
    await tocar(nodo, t.guardar);
    expect(props.guardar).toHaveBeenCalledWith(
      expect.objectContaining({
        id: FORMATO_ID,
        modo: 'confirmar',
        nombre: 'BAC compra 2',
        institucionId: BAC,
        formatosFecha: ['AAAA/MM/DD'],
        activo: true,
      }),
    );
    expect(nodo.textContent).toContain(mensaje);
    expect(nodo.querySelectorAll('[role="alert"], [aria-live]').length).toBeGreaterThan(0);
  });

  it('PRU-CMP-AJUS-122 [FT-73] sin SMS para probar lo dice y la pantalla no tiene violaciones de accesibilidad', async () => {
    const sin = montar(<FormularioFormato {...base({ smsParaProbar: [] })} />);
    expect(sin.textContent).toContain(t.probar.sinSms);
    expect((await axe.run(sin)).violations).toEqual([]);
  });

  it('PRU-CMP-AJUS-123 [FT-73] la pantalla con el resultado de una prueba no tiene violaciones de accesibilidad', async () => {
    const con = montar(<FormularioFormato {...base()} />);
    await tocar(con, t.probar.boton);
    expect(con.querySelector('[data-resultado-prueba]')?.textContent).toContain(t.probar.coincide);
    expect((await axe.run(con)).violations).toEqual([]);
  });
});
