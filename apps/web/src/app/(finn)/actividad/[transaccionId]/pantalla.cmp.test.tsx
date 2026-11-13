// FT-25, detalle (07 §17: un texto o un estado de una pantalla es una CMP). La pantalla dibuja lo que trae `detalleTransaccion()`.
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { DetalleTransaccionDto } from '@finn/aplicacion/consultas/detalle-transaccion';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../../../app/globals.css';
import {
  ContextoAcciones,
  type AccionesPublicadas,
} from '../../../../componentes/marco/publicar-acciones';
import { transaccion as t } from '../../../../textos/transaccion';
import { PantallaDetalleTransaccion } from './pantalla';

// `next/link` necesita el enrutador de Next, que el navegador de prueba no tiene: se simula `next/link` (el límite externo).
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

const activo = {
  inicio: '2027-02-21',
  fin: '2027-03-20',
  dias: 28,
  estado: 'activo',
  transicion: false,
  diasTranscurridos: 3,
  diasRestantes: 25,
};
const SMS = 'BAC: compra por $30.00 en SUPER SELECTOS con tarjeta terminada en 1234';

const dto = (parcial: Record<string, unknown> = {}): DetalleTransaccionDto =>
  ({
    revision: 'r1',
    hoy: '2027-02-23',
    periodoActivo: activo,
    notificacionesNoLeidas: 0,
    bandejaPorRevisar: 0,
    transaccion: {
      id: 't1',
      fecha: '2027-02-22',
      tipo: 'gasto',
      comercio: 'Super',
      total: 3000,
      montoPresentado: -3000,
      estadoBancario: 'pendiente',
      origen: 'sms',
      nota: null,
      periodo: activo,
    },
    efectos: [{ cuenta: { id: 'c1', nombre: 'Visa' }, monto: -3000 }],
    efectosHoy: { categorias: [], tarjetas: [] },
    lineas: [
      {
        id: 'l1',
        orden: 1,
        monto: 3000,
        destino: { categoria: { id: 'k1', nombre: 'Super' } },
        cobros: [],
        condonaciones: [],
        devoluciones: [],
      },
    ],
    cambiosPosteriores: [],
    origenDetalle: { sms: { texto: SMS, recibidoEn: '2027-02-22T19:00:00Z', movimientoId: 'm1' } },
    ...parcial,
  }) as unknown as DetalleTransaccionDto;

function mostrar(d: DetalleTransaccionDto, volver?: string): HTMLElement {
  const nodo = document.createElement('div');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(<PantallaDetalleTransaccion dto={d} volver={volver} />);
  });
  montados.push({ raiz, nodo });
  return nodo;
}

describe('FT-25 detalle de una transacción', () => {
  it('PRU-CMP-TX-410 [CA-25.8] una transacción de origen SMS muestra el texto original del SMS, y «Volver» lleva a la lista o a `?volver=`', () => {
    const nodo = mostrar(dto());
    expect(nodo.querySelector('blockquote')?.textContent).toBe(SMS);
    expect(nodo.querySelector('h1')?.textContent).toBe('Super');
    expect(nodo.querySelector('a')?.getAttribute('href')).toBe('/actividad');
    expect(nodo.querySelector('[data-linea]')?.textContent).toContain('Super');

    const desdeCuenta = mostrar(dto(), '/cuentas/c1');
    expect(desdeCuenta.querySelector('a')?.getAttribute('href')).toBe('/cuentas/c1');
    const manual = mostrar(dto({ origenDetalle: undefined }));
    expect(manual.querySelector('blockquote')).toBeNull();
  });

  it('PRU-CMP-TX-458 [CA-26.1] publica a «Más acciones» registrar la devolución de un gasto, cambiar el estado y, al final en peligro, Eliminar, con `?volver=`; una conciliada deshabilita el cambio con su motivo', () => {
    const publicadas: (AccionesPublicadas | null)[] = [];
    const publicar = (a: AccionesPublicadas | null): void => {
      publicadas.push(a);
    };
    const nodo = document.createElement('div');
    document.body.append(nodo);
    const raiz = createRoot(nodo);
    act(() => {
      raiz.render(
        <ContextoAcciones.Provider value={publicar}>
          <PantallaDetalleTransaccion dto={dto()} volver="/cuentas/c1" />
        </ContextoAcciones.Provider>,
      );
    });
    montados.push({ raiz, nodo });
    const acciones = publicadas.at(-1)?.acciones ?? [];
    expect(acciones.map((a) => a.etiqueta)).toEqual([
      t.registrarDevolucion,
      t.marcarConfirmada,
      t.eliminar,
    ]);
    expect(acciones[0]?.ruta).toBe('/actividad/t1/devolver?volver=%2Fcuentas%2Fc1');
    expect(acciones[1]?.ruta).toBe('/actividad/t1/estado?volver=%2Fcuentas%2Fc1');
    expect(acciones[2]).toMatchObject({
      ruta: '/actividad/t1/eliminar?volver=%2Fcuentas%2Fc1',
      peligro: true,
    });

    const conciliada = document.createElement('div');
    document.body.append(conciliada);
    const otra = createRoot(conciliada);
    act(() => {
      otra.render(
        <ContextoAcciones.Provider value={publicar}>
          <PantallaDetalleTransaccion
            dto={dto({
              transaccion: { ...dto().transaccion, estadoBancario: 'conciliada' },
            })}
            volver={undefined}
          />
        </ContextoAcciones.Provider>,
      );
    });
    montados.push({ raiz: otra, nodo: conciliada });
    const estado = publicadas.at(-1)?.acciones[1];
    expect(estado?.ruta).toBeUndefined();
    expect(estado?.motivo).toBe(t.estadoConciliadaNota);
  });

  it('PRU-CMP-TX-470 [CA-25.8] el detalle muestra «Comercio y nota», las partes con su cubierto y no cubierto, sus eventos y controles de 44 px como mínimo', () => {
    const nodo = mostrar(
      dto({
        lineas: [
          {
            id: 'l1',
            orden: 1,
            monto: 2250,
            destino: { categoria: { id: 'k1', nombre: 'Farmacia' } },
            reparto: { cubierto: 1735, noCubierto: 515 },
            cobros: [],
            condonaciones: [],
            devoluciones: [{ transaccionId: 'd1', fecha: '2027-02-23', monto: 500, caso: 'D-1' }],
          },
          {
            id: 'l2',
            orden: 2,
            monto: 3000,
            destino: { deudor: { id: 'u1', nombre: 'Carlos' } },
            porCobrar: { abierto: 2000, restituido: 1000, condonado: 0, devuelto: 0 },
            cobros: [
              {
                transaccionId: 'c1',
                fecha: '2027-02-22',
                monto: 1000,
                restitucion: 1000,
                excedente: 0,
              },
            ],
            condonaciones: [],
            devoluciones: [],
          },
        ],
        nota: 'x',
      }),
    );
    const titulos = [...nodo.querySelectorAll('h2')].map((h) => h.textContent);
    expect(titulos).toEqual(expect.arrayContaining(['Comercio y nota', 'Partes', 'Eventos']));
    const [farmacia, carlos] = [...nodo.querySelectorAll('[data-linea]')];
    expect(farmacia?.textContent).toContain('Cubierto $17.35 · no cubierto $5.15');
    expect(carlos?.textContent).toContain('Cobrado $10.00 · por cobrar $20.00');
    expect(nodo.querySelector('main')?.textContent).toContain('dividido en 2 partes');
    expect(nodo.querySelector('[aria-hidden="true"] span')).not.toBeNull();
    // A5: en teléfono el «Volver» de la fila del título no se dibuja (va en la barra); se miden los enlaces a la vista.
    for (const enlace of [...nodo.querySelectorAll('a')].filter(
      (a) => a.getClientRects().length > 0,
    ))
      expect(enlace.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
  });
  it('PRU-CMP-TX-500 [CA-28.9] cada evento del detalle trae su enlace «Eliminar» a `/eventos/eliminar` con `?tipo-evento=` y `?evento=` de su id, y ninguno si la compra no tiene eventos', () => {
    const evento = (id: string) => ({ transaccionId: id, fecha: '2027-02-23', monto: 500 });
    const nodo = mostrar(
      dto({
        lineas: [
          {
            id: 'l1',
            orden: 1,
            monto: 2250,
            destino: { categoria: { id: 'k1', nombre: 'Farmacia' } },
            reparto: { cubierto: 2250, noCubierto: 0 },
            cobros: [],
            condonaciones: [{ id: 'k9', fecha: '2027-02-24', monto: 300 }],
            devoluciones: [{ ...evento('d1'), caso: 'D-1' }],
          },
        ],
      }),
    );
    const enlaces = [...nodo.querySelectorAll('a')].filter((a) => a.textContent === 'Eliminar');
    const hrefs = enlaces
      .map((a) => a.getAttribute('href') ?? '')
      .filter((h) => h.includes('/eventos/'));
    expect(hrefs).toHaveLength(2);
    expect(hrefs[0]).toMatch(/\/eventos\/eliminar\?tipo-evento=condonacion&evento=k9$/);
    expect(hrefs[1]).toMatch(/\/eventos\/eliminar\?tipo-evento=devolucion&evento=d1$/);
  });

  it('PRU-CMP-TX-738 [CA-25.8] las partes de un gasto llevan el menos, lo no cubierto va rayado, la parte por cobrar trae «Cobrar» y «Condonar» de 44 px y la sección se llama «Efectos hoy»', () => {
    const nodo = mostrar(
      dto({
        lineas: [
          {
            id: 'l1',
            orden: 1,
            monto: 2250,
            destino: { categoria: { id: 'k1', nombre: 'Farmacia' } },
            reparto: { cubierto: 1735, noCubierto: 515 },
            cobros: [],
            condonaciones: [],
            devoluciones: [],
          },
          {
            id: 'l2',
            orden: 2,
            monto: 3000,
            destino: { deudor: { id: 'u1', nombre: 'Carlos' } },
            porCobrar: { abierto: 2000, restituido: 1000, condonado: 0, devuelto: 0 },
            cobros: [],
            condonaciones: [],
            devoluciones: [],
          },
        ],
      }),
    );
    const [farmacia, carlos] = [...nodo.querySelectorAll('[data-linea]')];
    expect(farmacia?.textContent).toContain('−$22.50');
    expect(farmacia?.querySelector('[data-no-cubierto]')).not.toBeNull();
    expect(
      getComputedStyle(farmacia?.querySelector('[data-no-cubierto]') as Element).backgroundImage,
    ).toContain('gradient');
    expect(carlos?.textContent).toContain(t.deudorPorCobrar('Carlos'));
    const enlaces = [...(carlos?.querySelectorAll('a') ?? [])];
    expect(enlaces.map((a) => a.textContent)).toEqual([t.cobrar, t.condonar]);
    expect(enlaces[0]?.getAttribute('href')).toBe('/por-cobrar/cobrar?linea=l2&deudor=u1');
    expect(enlaces[1]?.getAttribute('href')).toBe('/por-cobrar/condonar/l2');
    for (const e of enlaces) expect(e.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    expect([...nodo.querySelectorAll('h2')].map((h) => h.textContent)).toContain(t.efectosHoy);
  });

  it('PRU-CMP-TX-790 «Efectos hoy» muestra el Disponible de hoy de cada categoría y la deuda de la tarjeta que trae el DTO, sin la fila de la cuenta, y cada fila mide 44 px', () => {
    const nodo = mostrar(
      dto({
        efectosHoy: {
          categorias: [
            { categoria: { id: 'k1', nombre: 'Supermercado' }, disponible: 6285 },
            { categoria: { id: 'k2', nombre: 'Farmacia' }, disponible: -515 },
          ],
          tarjetas: [{ cuenta: { id: 'c1', nombre: 'Visa Oro' }, deuda: 64218 }],
        },
      }),
    );
    const filas = [...nodo.querySelectorAll('[data-efectos-hoy] li')];
    const esperadas = [
      ['Supermercado', t.disponible, '$62.85'],
      ['Farmacia', t.disponible, '−$5.15'],
      [`Visa Oro · ${t.deuda}`, '$642.18'],
    ];
    expect(filas).toHaveLength(esperadas.length);
    filas.forEach((f, k) => {
      for (const x of esperadas[k] ?? []) expect(f.textContent).toContain(x);
    });
    expect(nodo.querySelector('[data-efectos-hoy]')?.textContent).not.toContain('Visa−');
    for (const f of filas) expect(f.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
  });

  it('PRU-CMP-TX-791 sin categoría ni tarjeta, «Efectos hoy» muestra el efecto en cada cuenta', () => {
    const nodo = mostrar(dto());
    const filas = [...nodo.querySelectorAll('[data-efectos-hoy] li')];
    expect(filas).toHaveLength(1);
    expect(filas[0]?.textContent).toContain('Visa');
    expect(filas[0]?.textContent).toContain('−$30.00');
  });
});
