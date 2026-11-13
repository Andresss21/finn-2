// [CH-251] La cifra de Tendencia, Ingresos y gastos, Cumplimiento, Realidad y Flujo de efectivo (E5-5, E5-21; 07 §17: un
// componente es una CMP). Cada cifra es un campo del DTO de `reporte()` (04 §6.9): la pantalla la formatea y no suma ni resta
// (PF-3). El período de la frase es `ultimoPeriodo` (o `resumen.periodo`) tal como llega.
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../../globals.css';
import type { TipoDeReporte } from './tipos';
import { cuerpoDe } from './vistas';
import type { Nombres } from './vistas-detalle';

// Solo el límite externo: `next/link` necesita el enrutador de Next, que el navegador de prueba no tiene.
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

const NOMBRES = { cuentas: [], grupos: [], categorias: [] } as unknown as Nombres;

function cifra(tipo: TipoDeReporte, dto: unknown): string {
  const nodo = document.createElement('main');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(<>{cuerpoDe(tipo, dto, NOMBRES)}</>);
  });
  montados.push({ raiz, nodo });
  // Sin el texto para lectores de pantalla del monto: lo que se ve.
  const p = nodo.querySelector('[data-cifra-reporte]')?.cloneNode(true) as HTMLElement | undefined;
  for (const x of p?.querySelectorAll('.sr-only') ?? []) x.remove();
  return (p?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

const AGOSTO = { inicio: '2026-08-21', fin: '2026-09-20', estado: 'cerrado' } as const;
const ACTUAL = { inicio: '2026-09-21', fin: '2026-10-20', estado: 'activo' } as const;
const punto = (periodo: string, gastos: number, ingresos = 92500) => ({
  periodo,
  ingresos,
  gastos,
  diferencia: ingresos - gastos,
  otrasEntradas: 0,
  restituciones: 0,
  gastosPorGrupo: [],
  asignado: 70000,
});

describe('PRU-CMP-REP', () => {
  it('PRU-CMP-REP-790 [FT-60, CA-60.4] (CH-251) Tendencia e Ingresos y gastos muestran el gastado y la diferencia del último período cerrado con sus fechas; con «Actual», el del período actual', () => {
    const cerrados = {
      periodoActivo: ACTUAL,
      ultimoPeriodo: AGOSTO,
      periodos: [punto('2026-07-21', 61240), punto('2026-08-21', 63560)],
    };
    expect(cifra('tendencia', cerrados)).toBe(
      '$635.60gastado en el último período cerrado, del 21/08 al 20/09',
    );
    expect(cifra('ingresos_gastos', cerrados)).toBe(
      '$289.40te quedó en el último período cerrado, del 21/08 al 20/09 (ingresos − gastos)',
    );
    const actual = {
      periodoActivo: ACTUAL,
      ultimoPeriodo: ACTUAL,
      periodos: [punto(ACTUAL.inicio, 30000)],
    };
    expect(cifra('tendencia', actual)).toBe('$300.00gastado en el período actual');
  });

  it('PRU-CMP-REP-791 [FT-60, CA-60.7] (CH-251) Cumplimiento dice «2 de 8» categorías que se pasaron de lo asignado en el período del resumen', () => {
    const fila = {
      categoria: 'super',
      periodo: ACTUAL.inicio,
      asignado: 35000,
      gastado: 28715,
      diferencia: 6285,
      porcentaje: 8204,
    };
    expect(
      cifra('cumplimiento', {
        filas: [fila],
        resumen: { periodo: ACTUAL, sePasaron: 2, categorias: 8 },
      }),
    ).toBe('2 de 8categorías se pasaron de lo asignado en el período actual');
  });

  it('PRU-CMP-REP-792 [FT-62, FT-68] (CH-251) Realidad dice cuántas categorías se alejan de su promedio y Flujo de efectivo cuánto cambió el efectivo, sin color de problema', () => {
    expect(
      cifra('realidad', {
        periodo: ACTUAL,
        categorias: [
          {
            categoria: { id: 'r', nombre: 'Restaurantes' },
            grupo: { id: 'g', nombre: 'Comida' },
            periodos: [],
            promedioGastado: null,
            sugerido: null,
            gastoComparado: 0,
            variacion: null,
          },
        ],
        hallazgos: [],
        alejadas: 1,
      }),
    ).toBe('1categoría se aleja de tu promedio este período');
    const flujo = {
      periodoActivo: ACTUAL,
      periodos: [
        {
          periodo: ACTUAL,
          saldoInicial: 402720,
          saldoFinal: 440460,
          filas: [{ fila: 'ingresos', monto: 37740 }],
          comprasConTarjeta: 0,
        },
      ],
      variacion: 37740,
      accion: { tipo: 'ver', reporte: 'remanente' },
      hallazgos: [],
    };
    expect(cifra('flujo_efectivo', flujo)).toBe(
      '$377.40cambió el dinero de tus cuentas de efectivo en el período actual',
    );
    expect(
      cifra('flujo_efectivo', {
        ...flujo,
        periodos: [flujo.periodos[0], { ...flujo.periodos[0], periodo: AGOSTO }],
        variacion: -1500,
      }),
    ).toBe('−$15.00cambió el dinero de tus cuentas de efectivo en los períodos elegidos');
  });
});
