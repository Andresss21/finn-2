// FT-66 Tarjetas en el tiempo (06 FT-66; 07 §17: un texto o un estado es una CMP). La pantalla dibuja lo que trae el DTO de
// `reporte({ tipo: 'tarjetas' })`; los montos y las fechas salen del motor (PF-3) y «Reservar» se prueba de punta a punta en la E2E.
import axe from 'axe-core';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { ReporteDto } from '@finn/aplicacion/consultas/reporte';
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
const ciclo = (arrastre: number) => ({
  corte: '2027-02-15',
  fechaPago: '2027-03-05',
  deudaEstado: 50000,
  pagadoATiempo: 50000 - arrastre,
  arrastre,
});
const periodo = {
  periodo: '2027-02-21',
  cargos: 0,
  pagos: 35000,
  deudaAlFin: 15000,
};
const dto = (tarjetas: unknown[], hallazgos: unknown[]) =>
  ({
    revision: 'r1',
    hoy: '2027-03-10',
    periodoActivo: {
      inicio: '2027-02-21',
      fin: '2027-03-20',
      dias: 28,
      estado: 'activo',
      transicion: false,
      diasTranscurridos: 17,
      diasRestantes: 11,
    },
    notificacionesNoLeidas: 0,
    bandejaPorRevisar: 0,
    periodos: [],
    tarjetas,
    hallazgos,
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
    raiz.render(<PantallaReporte url="tarjetas" dto={datos} nombres={NOMBRES} parametros={{}} />);
  });
  montados.push({ raiz, nodo });
  return nodo;
};

describe('PRU-CMP-REP-190 tarjetas en el tiempo', () => {
  it('PRU-CMP-REP-190 [FT-66, CA-66.1, CA-66.2] con arrastre 0 dice «Con Visa pagás el total cada mes.» sin hallazgo; la tabla trae corte, fecha de pago, deuda, pagado o acreditado a tiempo y arrastre del DTO', () => {
    const raiz = mostrar(
      dto(
        [
          {
            tarjeta: ref('t1', 'Visa'),
            ciclos: [ciclo(0)],
            periodos: [{ ...periodo, deudaAlFin: 0 }],
            pagaElTotal: true,
          },
        ],
        [],
      ),
    );
    expect(
      raiz.querySelector('nav[aria-label="Reportes"] a[aria-current="page"]')?.textContent,
    ).toBe('Tarjetas');
    expect(raiz.textContent).toContain('Con Visa pagás el total cada mes.');
    expect(raiz.querySelector('[data-hallazgo-tarjeta]')).toBeNull();
    const fila = raiz.querySelector('[data-tarjeta="t1"] [data-fila="2027-02-15"]');
    expect(fila?.querySelector('[data-col="fechaPago"]')?.textContent).toBe('05/03/2027');
    expect(fila?.querySelector('[data-col="pagadoATiempo"]')?.textContent).toContain('500.00');
    expect(fila?.querySelector('[data-col="arrastre"]')?.textContent).toContain('0.00');
    const encabezados = [...raiz.querySelectorAll('[data-tarjeta="t1"] thead th')].map(
      (th) => th.textContent,
    );
    expect(encabezados).toContain('Pagado o acreditado a tiempo');
  });

  it('PRU-CMP-REP-191 [FT-66] con arrastre el hallazgo dice «quedaron … sin pagar del corte del …: esa deuda puede generar intereses.» y, sin nada que reservar, enlaza a pagar la tarjeta; sin violaciones de axe en claro ni en oscuro', async () => {
    const datos = dto(
      [
        {
          tarjeta: ref('t1', 'Visa'),
          ciclos: [ciclo(15000)],
          periodos: [periodo],
          pagaElTotal: false,
        },
      ],
      [
        {
          tipo: 'tarjeta',
          clave: 'tarjeta:t1',
          impacto: 15000,
          estado: 'advertencia',
          tarjeta: ref('t1', 'Visa'),
          arrastre: 15000,
          corte: '2027-02-15',
          sinRespaldo: 0,
          accion: { tipo: 'pagar', tarjetaId: 't1' },
        },
      ],
    );
    for (const tema of ['claro', 'oscuro']) {
      document.documentElement.setAttribute('data-theme', tema);
      const raiz = mostrar(datos);
      const h = raiz.querySelector('[data-hallazgo-tarjeta="tarjeta:t1"]');
      expect(h?.textContent).toContain(
        'Con Visa quedaron $150.00 sin pagar del corte del 15/02/2027: esa deuda puede generar intereses.',
      );
      expect(h?.querySelector('a')?.getAttribute('href')).toBe('/cuentas/t1/pagar');
      expect(h?.querySelector('a')?.textContent).toBe('Pagar Visa');
      expect(raiz.textContent).not.toContain('pagás el total');
      const resultado = await axe.run(raiz);
      expect(
        resultado.violations.map((v) => `${tema}: ${v.id} ${v.nodes[0]?.html.slice(0, 120)}`),
      ).toEqual([]);
      act(() => {
        montados[0]?.raiz.unmount();
      });
      montados.shift()?.nodo.remove();
    }
  });
});
