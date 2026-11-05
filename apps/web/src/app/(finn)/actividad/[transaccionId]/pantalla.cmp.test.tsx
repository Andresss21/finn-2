// FT-25, detalle (07 §17: un texto o un estado de una pantalla es una CMP). La pantalla dibuja lo que trae `detalleTransaccion()`.
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { DetalleTransaccionDto } from '@finn/aplicacion/consultas/detalle-transaccion';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../../../app/globals.css';
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
    for (const enlace of nodo.querySelectorAll('a'))
      expect(enlace.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
  });
});
