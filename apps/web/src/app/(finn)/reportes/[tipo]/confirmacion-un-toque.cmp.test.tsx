// CH-217: la confirmación de AV-11 en las acciones de un toque de «Ritmo» (FT-62) y «Realidad» (FT-63) y, con la misma pieza, de
// «Tarjetas» y «Flujo de efectivo». Si OP-14 o OP-18 dejaría Listo para asignar en negativo, el servidor responde
// `REQUIERE_CONFIRMACION`: la pantalla lo dice con el monto del servidor (PF-3) y no escribe hasta que la persona confirma.
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { ResultadoAccion } from '@finn/aplicacion/errores';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../../globals.css';
import { HallazgosRealidad, type HallazgoRealidad } from './realidad-hallazgos';
import { HallazgosRitmo, type Hallazgo } from './ritmo-hallazgos';

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
});

const ref = (id: string, nombre: string) => ({ id, nombre });
const ritmo = {
  tipo: 'ritmo',
  clave: 'categoria:rest',
  impacto: 5556,
  estado: 'problema',
  categoria: ref('rest', 'Restaurantes'),
  exceso: 5556,
  sobregiroActual: 2630,
  fin: '2027-03-20',
  accion: { tipo: 'asignar', montoNuevo: 17556, esperado: 12000 },
} as unknown as Hallazgo;
const realidad = {
  tipo: 'realidad',
  clave: 'categoria:rest',
  impacto: 3000,
  estado: 'advertencia',
  categoria: ref('rest', 'Restaurantes'),
  causa: 'pasas',
  promedioGastado: 18000,
  asignadoPromedio: 15000,
  sugerido: 18000,
  accion: { tipo: 'asignar' },
} as unknown as HallazgoRealidad;

const REQUIERE: ResultadoAccion<unknown> = {
  ok: false,
  error: {
    categoria: 'REQUIERE_CONFIRMACION',
    codigo: 'requiere_confirmacion',
    mensaje: 'Requiere confirmación',
    previsualizacion: {
      revisionVista: 'v1',
      huellaImpacto: 'h1',
      avisos: [{ codigo: 'AV-11', datos: { lpa: -10000 } }],
    },
  },
};
const OK: ResultadoAccion<unknown> = { ok: true, valor: {}, yaAplicada: false, avisos: [] };

/** Un servidor que frena la primera llamada y escribe solo cuando llega la huella. */
const servidor = () =>
  vi.fn((entrada: unknown): Promise<ResultadoAccion<unknown>> => {
    const e = entrada as { huellaImpacto?: string };
    return Promise.resolve(e.huellaImpacto === undefined ? REQUIERE : OK);
  });

const montar = (nodo: ReactNode): HTMLElement => {
  const caja = document.createElement('div');
  document.body.append(caja);
  const raiz = createRoot(caja);
  act(() => {
    raiz.render(nodo);
  });
  montados.push({ raiz, nodo: caja });
  return caja;
};
const boton = (raiz: HTMLElement, texto: string): HTMLButtonElement => {
  const b = [...raiz.querySelectorAll('button')].find((x) => x.textContent === texto);
  if (b === undefined) throw new Error(`Sin botón «${texto}»`);
  return b;
};
const tocar = async (b: HTMLButtonElement): Promise<void> => {
  await act(async () => {
    b.click();
    await Promise.resolve();
  });
};
const AVISO = 'Esta asignación dejará Listo para asignar en -$100.00.';

describe('PRU-CMP-REP-260 AV-11 en las acciones de un toque', () => {
  it('PRU-CMP-REP-260 [FT-62, CA-62.3, AV-11] «Asignar» de Ritmo que dejaría Listo para asignar en negativo muestra el aviso con el monto del servidor y no escribe; «Confirmar» envía la misma entrada con la huella y recién entonces ofrece «Deshacer»', async () => {
    const asignar = servidor();
    const raiz = montar(
      <HallazgosRitmo hallazgos={[ritmo]} periodoInicio="2027-02-21" asignar={asignar} />,
    );
    await tocar(boton(raiz, 'Asignar $55.56'));
    const panel = raiz.querySelector('[data-confirmacion-un-toque]');
    expect(panel?.textContent).toContain(AVISO.replace('-', '−'));
    expect(asignar).toHaveBeenCalledTimes(1);
    expect(raiz.querySelector('[data-ritmo-asignado]')).toBeNull();
    await tocar(boton(raiz, 'Confirmar'));
    expect(asignar).toHaveBeenCalledTimes(2);
    expect(asignar.mock.calls[1]?.[0]).toMatchObject({
      categoriaId: 'rest',
      montoNuevo: '175.56',
      revisionVista: 'v1',
      huellaImpacto: 'h1',
    });
    expect(raiz.querySelector('[data-confirmacion-un-toque]')).toBeNull();
    expect(raiz.querySelector('[data-ritmo-asignado]')?.textContent).toContain('Deshacer');
  });

  it('PRU-CMP-REP-261 [FT-63, CA-63.1, AV-11] «Ajustar a $180.00» de Realidad pide la confirmación de AV-11 antes de escribir y «Cancelar» la cierra sin escribir', async () => {
    const asignar = servidor();
    const meta = servidor();
    const raiz = montar(
      <HallazgosRealidad
        hallazgos={[realidad]}
        periodoInicio="2027-02-21"
        acciones={{ asignar, meta, esperados: { asignado: { rest: '150.00' }, meta: {} } }}
      />,
    );
    await tocar(boton(raiz, 'Ajustar a $180.00'));
    expect(raiz.querySelector('[data-confirmacion-un-toque]')?.textContent).toContain(
      AVISO.replace('-', '−'),
    );
    await tocar(boton(raiz, 'Cancelar'));
    expect(raiz.querySelector('[data-confirmacion-un-toque]')).toBeNull();
    expect(asignar).toHaveBeenCalledTimes(1);
    expect(raiz.querySelector('[data-realidad-ajustado]')).toBeNull();
    expect(meta).not.toHaveBeenCalled();
  });

  it('PRU-CMP-REP-262 [FT-63, CA-63.2, AV-11] «Ajustar la meta a $180.00» (OP-18) también pide la confirmación y, confirmada, envía la huella', async () => {
    const asignar = servidor();
    const meta = servidor();
    const conMeta = {
      ...realidad,
      accion: { tipo: 'meta', metaId: 'm1' },
    } as unknown as HallazgoRealidad;
    const raiz = montar(
      <HallazgosRealidad
        hallazgos={[conMeta]}
        periodoInicio="2027-02-21"
        acciones={{ asignar, meta, esperados: { asignado: {}, meta: { m1: '150.00' } } }}
      />,
    );
    await tocar(boton(raiz, 'Ajustar la meta a $180.00'));
    expect(raiz.querySelector('[data-confirmacion-un-toque]')).not.toBeNull();
    await tocar(boton(raiz, 'Confirmar'));
    expect(meta).toHaveBeenCalledTimes(2);
    expect(meta.mock.calls[1]?.[0]).toMatchObject({ metaId: 'm1', huellaImpacto: 'h1' });
    expect(asignar).not.toHaveBeenCalled();
    expect(raiz.querySelector('[data-realidad-ajustado]')?.textContent).toContain('Deshacer');
  });
});
