// FT-29 Categoría de pago de tarjeta (07 §17: un texto o un estado es una CMP). La pantalla solo dibuja lo que trae el DTO de
// 04 §6.3 (`DetallePagoTarjetaDto`): los números de cada escenario salen del motor y los prueban las E2E (PF-3).
import axe from 'axe-core';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { DetalleCategoriaDto } from '@finn/aplicacion/consultas/detalle-categoria';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../../../globals.css';
import { PantallaDetalleCategoria } from './pantalla';

// Se simula `next/link` (el límite externo), nunca `enlace-finn`: otras suites lo importan de verdad.
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

const ACTIVO = {
  inicio: '2027-02-21',
  fin: '2027-03-20',
  dias: 28,
  estado: 'activo',
  transicion: false,
  diasTranscurridos: 10,
  diasRestantes: 18,
};
const FUTURO = {
  inicio: '2027-03-21',
  fin: '2027-04-20',
  dias: 31,
  estado: 'futuro',
  transicion: false,
};
const CERRADO = {
  inicio: '2027-01-21',
  fin: '2027-02-20',
  dias: 31,
  estado: 'cerrado',
  transicion: false,
};
const ID = '11111111-1111-4111-8111-111111111111';
const TARJETA = '22222222-2222-4222-8222-222222222222';
const hoyCero = { deuda: 0, saldoAFavor: 0, reservado: 0, faltaReservar: 0, reservaExcedente: 0 };

/** Un DTO de `detalleCategoria()` de una categoría de pago, armado a mano. */
const dto = (parcial: Record<string, unknown> = {}): DetalleCategoriaDto =>
  ({
    revision: 'r1',
    hoy: '2027-03-02',
    periodoActivo: ACTIVO,
    notificacionesNoLeidas: 0,
    bandejaPorRevisar: 0,
    categoria: { id: ID, nombre: 'Pago Visa Oro' },
    tarjeta: { id: TARJETA, nombre: 'Visa Oro' },
    clase: 'pago',
    periodo: ACTIVO,
    navegacion: { anterior: '2027-01-21', siguiente: '2027-03-21' },
    numeros: { asignado: 0, actividad: 0, arrastre: 0, disponible: 0 },
    tarjetaHoy: hoyCero,
    pagoExcedente: null,
    traslados: [],
    pagos: [],
    pagosImplicitos: [],
    devoluciones: [],
    desgloseAlPagar: {
      deudaAnterior: 0,
      cargosDelCiclo: 0,
      yaPagado: 0,
      paraNoGenerarIntereses: 0,
      ultimoCorte: '2027-02-25',
      proximoPago: '2027-11-15',
    },
    historial: [],
    ...parcial,
  }) as unknown as DetalleCategoriaDto;

const mostrar = (d: DetalleCategoriaDto): HTMLElement => {
  document.body.style.cssText = 'background: var(--fondo); color: var(--texto)';
  const nodo = document.createElement('div');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(<PantallaDetalleCategoria dto={d} desarchivar={vi.fn()} />);
  });
  montados.push({ raiz, nodo });
  return nodo;
};
const texto = (n: HTMLElement): string => n.textContent;

describe('PRU-CMP-PRES categoría de pago de tarjeta', () => {
  it('PRU-CMP-PRES-110 [CA-29.3, AV-04, AV-07] con te falta reservar $30.00 y un pago excedente de $20.00 el número principal es «Te falta reservar $30.00» y AV-04 por $20.00 va aparte, como información secundaria', () => {
    const n = mostrar(
      dto({
        tarjetaHoy: { ...hoyCero, deuda: 3000, faltaReservar: 3000 },
        pagoExcedente: { total: 2000, causas: [{ causa: 'pago', monto: 2000 }] },
      }),
    );
    const principal = n.querySelector('[data-falta-reservar]') as HTMLElement;
    expect(texto(principal)).toContain('Te falta reservar');
    expect(principal.querySelector('[data-centavos]')?.getAttribute('data-centavos')).toBe('3000');
    const aviso = n.querySelector('[data-aviso="AV-04"]') as HTMLElement;
    expect(aviso.querySelector('[data-centavos]')?.getAttribute('data-centavos')).toBe('2000');
    expect(principal.contains(aviso)).toBe(false);
    expect(texto(aviso)).toContain('más de lo reservado');
  });

  it('PRU-CMP-PRES-111 [CA-29.4, AV-05] un pago excedente atribuido a un cobro muestra AV-05 y no AV-04', () => {
    const n = mostrar(
      dto({
        pagoExcedente: { total: 2500, causas: [{ causa: 'cobro', monto: 2500 }] },
      }),
    );
    const aviso = n.querySelector('[data-aviso="AV-05"]') as HTMLElement;
    expect(texto(aviso)).toContain('se aplicó a la tarjeta sin reserva');
    expect(aviso.querySelector('[data-centavos]')?.getAttribute('data-centavos')).toBe('2500');
    expect(n.querySelector('[data-aviso="AV-04"]')).toBeNull();
  });

  it('PRU-CMP-PRES-112 [AV-06, AV-08] una devolución muestra AV-06 según tenga saldo a favor o deuda, y la reserva excedente muestra AV-08', () => {
    const conSaldo = mostrar(
      dto({
        tarjetaHoy: { ...hoyCero, saldoAFavor: 1000, reservaExcedente: 400 },
        pagoExcedente: { total: 1000, causas: [{ causa: 'devolucion', monto: 1000 }] },
      }),
    );
    expect(texto(conSaldo.querySelector('[data-aviso="AV-06"]') as HTMLElement)).toContain(
      'saldo a favor',
    );
    expect(texto(conSaldo.querySelector('[data-aviso="AV-08"]') as HTMLElement)).toContain(
      'reservado de más',
    );
    const conDeuda = mostrar(
      dto({
        tarjetaHoy: { ...hoyCero, deuda: 500, faltaReservar: 500 },
        pagoExcedente: { total: 1000, causas: [{ causa: 'devolucion', monto: 1000 }] },
      }),
    );
    expect(texto(conDeuda.querySelector('[data-aviso="AV-06"]') as HTMLElement)).toContain(
      'ya se había usado para pagar la tarjeta',
    );
  });

  it('PRU-CMP-PRES-113 [CA-29.7] en un período futuro y en uno cerrado no hay «Te falta reservar» ni la tarjeta de hoy', () => {
    for (const periodo of [FUTURO, CERRADO]) {
      const n = mostrar(
        dto({ periodo, tarjetaHoy: { ...hoyCero, deuda: 3000, faltaReservar: 3000 } }),
      );
      expect(n.querySelector('[data-falta-reservar]')).toBeNull();
      expect(texto(n)).not.toContain('Te falta reservar');
      expect(n.querySelector('[data-seccion="tarjeta-hoy"]')).toBeNull();
      expect(n.querySelector('[data-seccion="al-pagar"]')).toBeNull();
    }
  });

  it('PRU-CMP-PRES-114 [CA-29.8] «Pagá antes del 15/11» sale de desgloseAlPagar.proximoPago', () => {
    const n = mostrar(dto());
    const fila = n.querySelector('[data-proximo-pago]') as HTMLElement;
    expect(fila.getAttribute('data-proximo-pago')).toBe('2027-11-15');
    expect(texto(fila)).toBe('Pagá antes del 15/11');
    expect(texto(mostrar(dto()))).toContain('Para no generar intereses');
  });

  it('PRU-CMP-PRES-115 [FT-29] con los traslados del DTO lista cada categoría con su monto y sin te falta reservar muestra «Al día»', () => {
    const n = mostrar(
      dto({
        numeros: { asignado: 0, actividad: 10000, arrastre: 0, disponible: 10000 },
        traslados: [{ categoria: { id: 'c1', nombre: 'Super' }, monto: 10000 }],
      }),
    );
    const fila = n.querySelector('[data-traslado="c1"]') as HTMLElement;
    expect(texto(fila)).toContain('Super');
    expect(fila.querySelector('[data-centavos]')?.getAttribute('data-centavos')).toBe('10000');
    expect(
      n.querySelector('[data-numero="disponible"] [data-centavos]')?.getAttribute('data-centavos'),
    ).toBe('10000');
    expect(texto(n.querySelector('[data-falta-reservar]') as HTMLElement)).toContain(
      'No te falta reservar nada',
    );
  });

  it('PRU-CMP-PRES-116 [AV-04, AV-08] la pantalla no tiene violaciones de accesibilidad con falta de reserva, excedente y reserva excedente', async () => {
    const n = mostrar(
      dto({
        tarjetaHoy: { ...hoyCero, deuda: 3000, faltaReservar: 3000, reservaExcedente: 400 },
        pagoExcedente: { total: 2000, causas: [{ causa: 'pago', monto: 2000 }] },
        traslados: [{ categoria: { id: 'c1', nombre: 'Super' }, monto: 10000 }],
        pagos: [{ transaccionId: 't1', fecha: '2027-02-25', monto: 12000 }],
        historial: [{ periodo: CERRADO, asignado: 12000, disponible: 0 }],
      }),
    );
    const r = await axe.run(n);
    expect(r.violations.map((v) => v.id)).toEqual([]);
  });
});

describe('PRU-CMP-PRES «Reservar $X» en la categoría de pago', () => {
  const visible = (n: Element | null): string =>
    [...(n?.childNodes ?? [])]
      .map((x) =>
        x instanceof HTMLElement && x.classList.contains('sr-only')
          ? ''
          : x instanceof Element
            ? visible(x)
            : (x.textContent ?? ''),
      )
      .join('')
      .replace(/\s+/g, ' ')
      .trim();

  it('PRU-CMP-PRES-450 [FT-29] con «te falta reservar» de $18.75 el principal es «Reservar $18.75» con el monto del DTO y abre Asignar con la variante; con todo reservado es «Pagar la tarjeta»', () => {
    const n = mostrar(
      dto({ tarjetaHoy: { ...hoyCero, deuda: 64218, reservado: 62343, faltaReservar: 1875 } }),
    );
    const principal = n.querySelector('[data-accion-principal]') as HTMLAnchorElement;
    expect(visible(principal)).toBe('Reservar $18.75');
    expect(principal.querySelector('[data-centavos]')?.getAttribute('data-centavos')).toBe('1875');
    expect(principal.getAttribute('href')).toBe(
      `/presupuesto/asignar/${ID}?volver=${encodeURIComponent(`/presupuesto/categorias/${ID}`)}`,
    );
    expect(principal.getAttribute('data-variante')).toBe('reservar_falta');
    expect(principal.getBoundingClientRect().height).toBeGreaterThanOrEqual(52);
    const alDia = mostrar(dto({ tarjetaHoy: { ...hoyCero, deuda: 64218, reservado: 64218 } }));
    const pagar = alDia.querySelector('[data-accion-principal]') as HTMLAnchorElement;
    expect(visible(pagar)).toBe('Pagar la tarjeta');
    expect(pagar.getAttribute('href')).toBe(`/cuentas/${TARJETA}/pagar`);
    expect(alDia.textContent).not.toContain('Reservar $');
    expect(visible(alDia.querySelector('[data-pago-reservado]'))).toBe('$642.18');
  });

  it('PRU-CMP-PRES-451 [FT-29] la rejilla Deuda · Reservado · Te falta y «Para no generar intereses» llevan los valores del DTO; el historial y la tarjeta hoy siguen', () => {
    const n = mostrar(
      dto({
        tarjetaHoy: { ...hoyCero, deuda: 64218, reservado: 62343, faltaReservar: 1875 },
        desgloseAlPagar: {
          deudaAnterior: 51240,
          cargosDelCiclo: 42978,
          yaPagado: 30000,
          paraNoGenerarIntereses: 21240,
          ultimoCorte: '2027-02-25',
          proximoPago: '2027-03-15',
        },
        historial: [{ periodo: CERRADO, asignado: 12000, disponible: 0 }],
      }),
    );
    const rejilla = [...n.querySelectorAll('[data-rejilla]')].map((c) => [
      c.getAttribute('data-rejilla'),
      c.querySelector('[data-centavos]')?.getAttribute('data-centavos'),
    ]);
    expect(rejilla).toEqual([
      ['deuda', '64218'],
      ['reservado', '62343'],
      ['te-falta', '1875'],
    ]);
    const intereses = n.querySelector('[data-seccion="al-pagar"]') as HTMLElement;
    expect(intereses.querySelector('h2')?.textContent).toBe('Para no generar intereses');
    expect(
      [...intereses.querySelectorAll('[data-numero]')].map((x) => [
        x.getAttribute('data-numero'),
        x.querySelector('[data-centavos]')?.getAttribute('data-centavos'),
      ]),
    ).toEqual([
      ['sin-intereses', '21240'],
      ['deuda-anterior', '51240'],
      ['cargos-del-ciclo', '42978'],
      ['ya-pagado', '30000'],
    ]);
    expect(intereses.textContent).toContain('Pagá antes del 15/03');
    expect(n.querySelectorAll('[data-historial-periodo]')).toHaveLength(1);
    expect(n.querySelectorAll('[data-seccion="tarjeta-hoy"] [data-numero]')).toHaveLength(5);
  });
});
