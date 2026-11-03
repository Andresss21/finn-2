// FT-38, SMS no reconocidos y con error (07 §17: un texto o un estado de un componente es una CMP). Lo que dice cada fila y el detalle
// del error; que OP-49 y OP-50 respeten sus reglas lo prueban el dominio, la integración y las E2E.
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../app/globals.css';
import {
  MovimientoBandeja,
  type AccionBandeja,
  type MovimientoDto,
} from '../../componentes/dominio/movimiento-bandeja';
import { bandeja as t } from '../../textos/bandeja';
import { cuentas } from '../../textos/cuentas';
import DetalleError from './detalle-error';
import { entradaDeReproceso, referenciaDe } from './error-sms';

// `next/link` necesita `process` y el enrutador de Next, que el navegador de prueba no tiene (el enrutado se prueba en E2E).
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
  vi.unstubAllGlobals();
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

const SMS = 'VISA 4821: compra rara en un comercio que Finn no conoce';
const vacio: MovimientoDto = {
  id: 'm1',
  estado: 'no_reconocido',
  sms: { id: 's1', texto: SMS },
  procesamiento: { intento: 1 },
  cuenta: null,
  fecha: null,
  monto: null,
  comercio: null,
  categoriaSugerida: null,
  aprobacion: { posible: false, faltantes: ['cuenta', 'fecha', 'monto', 'tipo'] },
};
const etiqueta = (accion: string): string =>
  cuentas.bandeja.accionDe(accion, cuentas.bandeja.sinComercio);

describe('PRU-CMP-BAND', () => {
  it('PRU-CMP-BAND-140 [CA-38.6] «Copiar referencia» copia el idError del detalle y lo avisa; si el portapapeles falla, dice la referencia', async () => {
    const escribir = vi.fn<(texto: string) => Promise<void>>().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText: escribir } });
    const nodo = montar(<DetalleError errorDetalle="INTERNO FN003 E-7K2M9Q" />);
    expect(nodo.querySelector('[data-testid="referencia"]')?.textContent).toBe('E-7K2M9Q');
    const copiar = [...nodo.querySelectorAll('button')].find(
      (b) => b.textContent === cuentas.bandeja.copiarReferencia,
    );
    await act(async () => {
      copiar?.click();
      await Promise.resolve();
    });
    expect(escribir).toHaveBeenCalledExactlyOnceWith('E-7K2M9Q');
    expect(nodo.querySelector('[role="status"]')?.textContent).toBe(t.referenciaCopiada);

    escribir.mockRejectedValue(new Error('denegado'));
    await act(async () => {
      copiar?.click();
      await Promise.resolve();
    });
    expect(nodo.querySelector('[role="status"]')?.textContent).toBe(t.noSePudoCopiar('E-7K2M9Q'));
  });

  it('PRU-CMP-BAND-141 un no reconocido cita el SMS y ofrece «Registrar a mano»; uno con error cita el SMS y ofrece «Intentar de nuevo» y «Copiar referencia»', async () => {
    const acciones: AccionBandeja[] = [];
    const nodo = montar(
      <>
        <MovimientoBandeja
          movimiento={vacio}
          hrefRevisar="/bandeja/m1"
          alAccionar={(a) => acciones.push(a)}
        />
        <MovimientoBandeja
          movimiento={{ ...vacio, id: 'm2', estado: 'error' }}
          hrefRevisar="/bandeja/m2"
          alAccionar={(a) => acciones.push(a)}
        />
      </>,
    );
    const [noReconocido, conError] = [...nodo.querySelectorAll('article')];
    expect(noReconocido?.querySelector('blockquote')?.textContent).toBe(SMS);
    expect(noReconocido?.querySelector('a')?.textContent).toBe(cuentas.bandeja.registrarAMano);
    expect(conError?.querySelector('blockquote')?.textContent).toBe(SMS);
    const botones = [...(conError?.querySelectorAll('button') ?? [])];
    expect(botones.map((b) => b.getAttribute('aria-label'))).toEqual([
      etiqueta(cuentas.bandeja.intentarDeNuevo),
      etiqueta(cuentas.bandeja.copiarReferencia),
    ]);
    await act(() => {
      for (const b of botones) b.click();
      return Promise.resolve();
    });
    expect(acciones).toEqual(['reintentar', 'copiar']);
  });

  it('PRU-CMP-BAND-142 la referencia es el idError del detalle o, sin uno, el propio detalle; el reintento lleva el último intento visto', () => {
    expect(referenciaDe('INTERNO FN003 E-7K2M9Q')).toBe('E-7K2M9Q');
    expect(referenciaDe('content_type')).toBe('content_type');
    expect(referenciaDe(undefined)).toBe('');
    expect(entradaDeReproceso({ sms: { id: 's1' }, procesamiento: { intento: 3 } })).toEqual({
      smsId: 's1',
      intentoVisto: 3,
    });
    expect(entradaDeReproceso({ sms: {} })).toBeUndefined();
  });
});
