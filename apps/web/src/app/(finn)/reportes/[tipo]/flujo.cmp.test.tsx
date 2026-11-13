// FT-68 Flujo de efectivo (06 FT-68; 07 §17: un texto o un estado es una CMP). La pantalla dibuja lo que trae el DTO de
// `reporte({ tipo: 'flujo_efectivo' })`; los montos salen del motor (PF-3) y «Reservar» se prueba de punta a punta en la E2E.
import axe from 'axe-core';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { ReporteDto } from '@finn/aplicacion/consultas/reporte';
import { conTexto } from '@finn/aplicacion/consultas/textos-hallazgos';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../../globals.css';
import { PantallaReporte, type Nombres } from './pantalla';

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
  document.documentElement.removeAttribute('data-theme');
});

const ref = (id: string, nombre: string) => ({ id, nombre });
const PERIODO = {
  inicio: '2027-02-21',
  fin: '2027-03-20',
  dias: 28,
  estado: 'activo',
  transicion: false,
  diasTranscurridos: 17,
  diasRestantes: 11,
};
const periodoDeFlujo = (filas: { fila: string; monto: number }[], compras: number) => ({
  periodo: PERIODO,
  saldoInicial: 100000,
  saldoFinal: 100000 + filas.reduce((s, f) => s + f.monto, 0),
  filas,
  comprasConTarjeta: compras,
});
const reservar = {
  tipo: 'reservar',
  tarjeta: ref('t1', 'Visa'),
  categoriaId: 'c1',
  monto: 15000,
  montoNuevo: 15000,
};
const hallazgo = {
  tipo: 'flujo',
  clave: 'tarjeta:t1',
  impacto: 15000,
  estado: 'deuda-sin-respaldo',
  tarjeta: ref('t1', 'Visa'),
  comprasConTarjeta: 40000,
  pagosTarjeta: 25000,
  accion: reservar,
};
const dto = (periodos: unknown[], hallazgos: unknown[], accion: unknown) =>
  ({
    revision: 'r1',
    hoy: '2027-03-10',
    periodoActivo: PERIODO,
    notificacionesNoLeidas: 0,
    bandejaPorRevisar: 0,
    periodos,
    accion,
    // [CH-251] El texto de cada hallazgo es del servidor (06 §3.5.2).
    hallazgos: conTexto(hallazgos as never),
  }) as unknown as ReporteDto;
const NOMBRES = { cuentas: [], grupos: [], categorias: [] } as unknown as Nombres;

const mostrar = (datos: ReporteDto): HTMLElement => {
  document.body.style.cssText = 'background: var(--fondo); color: var(--texto)';
  const nodo = document.createElement('div');
  // Ancho de teléfono: las tablas se desplazan, y la CI corre en otro tamaño que el local.
  nodo.style.width = '320px';
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(
      <PantallaReporte url="flujo-efectivo" dto={datos} nombres={NOMBRES} parametros={{}} />,
    );
  });
  montados.push({ raiz, nodo });
  return nodo;
};

const celda = (raiz: HTMLElement, fila: string) =>
  raiz.querySelector(`[data-fila="${fila}"] [data-col="monto"]`)?.textContent ?? '';

describe('PRU-CMP-REP flujo de efectivo', () => {
  it('PRU-CMP-REP-230 [CA-68.1] la tabla de un período lista el saldo inicial, las filas del DTO con su signo y el saldo final, y dice cuánto se compró con tarjeta', () => {
    const filas = [
      { fila: 'ingresos', monto: 50000 },
      { fila: 'gastos_debito', monto: -20000 },
      { fila: 'pagos_tarjeta', monto: -25000 },
    ];
    const raiz = mostrar(
      dto([periodoDeFlujo(filas, 40000)], [], { tipo: 'ver', reporte: 'remanente' }),
    );
    const rotulos = [...raiz.querySelectorAll('[data-periodo] tbody th')].map(
      (th) => th.textContent,
    );
    expect(rotulos).toEqual([
      'Saldo inicial',
      'Ingresos',
      'Gastos con débito',
      'Pagos de tarjeta',
      'Saldo final',
    ]);
    expect(celda(raiz, 'saldoInicial')).toContain('1,000.00');
    expect(celda(raiz, 'gastos_debito')).toContain('200.00');
    expect(celda(raiz, 'gastos_debito')).toContain('−');
    expect(celda(raiz, 'saldoFinal')).toContain('1,050.00');
    expect(raiz.querySelector('[data-compras-tarjeta]')?.textContent).toBe(
      'Con tarjeta compraste $400.00: por eso tu efectivo bajó menos de lo que gastaste.',
    );
    expect(raiz.querySelector('[data-explicacion]')?.textContent).toBe(
      'Cuánto cambió el dinero de tus cuentas y por qué.',
    );
  });

  it('PRU-CMP-REP-231 [CA-68.2] la fila de transferencias aparece con −$200.00 solo cuando el DTO la trae', () => {
    const con = mostrar(
      dto([periodoDeFlujo([{ fila: 'transferencias', monto: -20000 }], 0)], [], {
        tipo: 'ver',
        reporte: 'remanente',
      }),
    );
    expect(con.querySelector('[data-fila="transferencias"] th')?.textContent).toBe(
      'Transferencias a otras cuentas',
    );
    expect(celda(con, 'transferencias')).toContain('−$200.00');
    const sin = mostrar(
      dto([periodoDeFlujo([{ fila: 'ingresos', monto: 100 }], 0)], [], {
        tipo: 'ver',
        reporte: 'remanente',
      }),
    );
    expect(sin.querySelector('[data-fila="transferencias"]')).toBeNull();
  });

  it('PRU-CMP-REP-232 [CA-68.3] con $400.00 en compras con tarjeta, $250.00 pagados y $150.00 por reservar, termina con «Reservar $150.00 para Visa»; sin hallazgo termina con el enlace a «Lo que te quedó del período»; sin violaciones de axe en claro ni en oscuro', async () => {
    const filas = [{ fila: 'pagos_tarjeta', monto: -25000 }];
    const conHallazgo = dto([periodoDeFlujo(filas, 40000)], [hallazgo], reservar);
    for (const tema of ['claro', 'oscuro']) {
      document.documentElement.setAttribute('data-theme', tema);
      const raiz = mostrar(conHallazgo);
      const h = raiz.querySelector('[data-hallazgo-flujo="tarjeta:t1"]');
      expect(h?.textContent).toContain(
        'Con tarjeta compraste $400.00 y pagaste $250.00 de tarjetas en este período: te falta reservar $150.00 para Visa.',
      );
      // Sin la acción del lector (Server Action) el hallazgo se ve pero no ofrece el botón.
      expect(h?.querySelector('button')).toBeNull();
      expect(raiz.querySelector('[data-flujo-accion] a')).toBeNull();
      const resultado = await axe.run(raiz);
      expect(
        resultado.violations.map((v) => `${tema}: ${v.id} ${v.nodes[0]?.html.slice(0, 120)}`),
      ).toEqual([]);
      act(() => {
        montados[0]?.raiz.unmount();
      });
      montados.shift()?.nodo.remove();
    }
    const sin = mostrar(
      dto([periodoDeFlujo(filas, 10000)], [], { tipo: 'ver', reporte: 'remanente' }),
    );
    const enlace = sin.querySelector('[data-flujo-accion] a');
    expect(enlace?.textContent).toBe('Ver Lo que te quedó del período');
    expect(enlace?.getAttribute('href')).toBe('/reportes/remanente');
  });

  it('PRU-CMP-REP-233 [CA-68.1] con varios períodos hay un gráfico de compras con tarjeta con su tabla equivalente; sin saldos, filas ni compras dice «No hay movimientos en estos períodos»', () => {
    const dos = mostrar(
      dto(
        [
          periodoDeFlujo([{ fila: 'ingresos', monto: 100 }], 500),
          {
            ...periodoDeFlujo([{ fila: 'ingresos', monto: 200 }], 700),
            periodo: { ...PERIODO, inicio: '2027-01-21', fin: '2027-02-20', estado: 'cerrado' },
          },
        ],
        [],
        { tipo: 'ver', reporte: 'remanente' },
      ),
    );
    expect(dos.querySelectorAll('[data-periodo]')).toHaveLength(2);
    expect(dos.querySelector('[data-tabla-reporte] [data-col="comprasConTarjeta"]')).not.toBeNull();
    const vacio = mostrar(
      dto(
        [{ periodo: PERIODO, saldoInicial: 0, saldoFinal: 0, filas: [], comprasConTarjeta: 0 }],
        [],
        { tipo: 'ver', reporte: 'remanente' },
      ),
    );
    expect(vacio.textContent).toContain('No hay movimientos en estos períodos');
  });
});
