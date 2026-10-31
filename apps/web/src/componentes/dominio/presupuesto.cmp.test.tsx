import axe from 'axe-core';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { Centavos } from '@finn/dominio/valores';
import { afterEach, describe, expect, it } from 'vitest';
import '../../app/globals.css';
import { Billete } from './billete';
import { FilaCategoria, type FilaCategoriaDto } from './fila-categoria';
import { FilaPagoTarjeta, type FilaPagoTarjetaDto } from './fila-pago';
import { FilaTransaccion, type TransaccionFilaDto } from './fila-transaccion';
import { SelectorPeriodo, type PeriodoSelectorDto } from './selector-periodo';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const montados: { raiz: Root; nodo: HTMLElement }[] = [];
afterEach(() => {
  for (const { raiz, nodo } of montados.splice(0)) {
    act(() => {
      raiz.unmount();
    });
    nodo.remove();
  }
  delete document.documentElement.dataset['theme'];
  document.body.removeAttribute('style');
});

function montar(ui: ReactNode): HTMLElement {
  document.body.style.cssText =
    'background: var(--fondo); color: var(--texto); font-family: var(--fuente-cuerpo)';
  const nodo = document.createElement('main');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(ui);
  });
  montados.push({ raiz, nodo });
  return nodo;
}

function textoAccesible(n: Node | undefined): string {
  if (n === undefined) return '';
  if (n.nodeType === Node.TEXT_NODE) return n.textContent ?? '';
  if (!(n instanceof Element) || n.getAttribute('aria-hidden') === 'true') return '';
  return [...n.childNodes].map(textoAccesible).join('');
}

const c = (n: number): Centavos => n as Centavos;
const temas = ['claro', 'oscuro'] as const;

const categoria = (
  sobregiro: FilaCategoriaDto['sobregiro'],
  barra: FilaCategoriaDto['barra'],
): FilaCategoriaDto => ({
  categoria: { id: 'c1', nombre: 'Restaurantes' },
  asignado: c(12000),
  gastado: c(14630),
  disponible: c(-2630),
  sobregiro,
  meta: null,
  barra,
});
const pago = (p: Partial<FilaPagoTarjetaDto>): FilaPagoTarjetaDto => ({
  tarjeta: { id: 't1', nombre: 'Visa Oro' },
  disponible: c(62343),
  faltaReservar: c(0),
  reservaExcedente: c(0),
  pagoExcedente: null,
  ...p,
});
const periodo = (p: Partial<PeriodoSelectorDto>): PeriodoSelectorDto => ({
  inicio: '2026-09-21',
  fin: '2026-10-20',
  estado: 'activo',
  transicion: false,
  diasTranscurridos: 25,
  diasRestantes: 5,
  ...p,
});
const transaccion = (p: Partial<TransaccionFilaDto>): TransaccionFilaDto => ({
  id: 'x1',
  comercio: 'Pizza Hut',
  montoPresentado: c(-2450),
  estadoBancario: 'confirmada',
  marcas: {
    porCobrar: false,
    conDevoluciones: false,
    conciliada: false,
    programada: false,
    periodoCerrado: false,
  },
  ...p,
});

describe('PRU-CMP-PRES-101 componentes de dominio del Presupuesto [CF-13]', () => {
  it('PRU-CMP-PRES-101 billete de LPA: positivo con en camino, cero y negativo, con franja', () => {
    const raiz = montar(
      <>
        <Billete
          lpa={c(31240)}
          enCamino={c(4000)}
          lpaNegativo={false}
          variante="billete"
          accion={{ href: '/presupuesto/listo-para-asignar', texto: 'Asignar $312.40' }}
        />
        <Billete lpa={c(0)} enCamino={c(0)} lpaNegativo={false} variante="billete" />
        <Billete lpa={c(-8615)} enCamino={c(0)} lpaNegativo variante="billete" />
        <Billete lpa={c(31240)} enCamino={c(4000)} lpaNegativo={false} variante="franja" />
      </>,
    );
    const [pos, cero, neg, franja] = [...raiz.querySelectorAll('section')];
    expect(textoAccesible(pos)).toContain('$312.40');
    expect(textoAccesible(pos)).toContain('En camino$40.00');
    expect(pos?.querySelector('a')?.getAttribute('href')).toBe('/presupuesto/listo-para-asignar');
    expect(cero?.getAttribute('data-estado-lpa')).toBe('cero');
    expect(textoAccesible(cero)).toContain('Todo asignado');
    expect(cero?.querySelector('[data-estado="cero"] svg')).not.toBeNull();
    expect(neg?.getAttribute('data-estado-lpa')).toBe('negativo');
    expect(textoAccesible(neg)).toContain('menos $86.15');
    expect(textoAccesible(neg)).toContain('Asignaste más de lo que tenés');
    expect(franja?.getAttribute('data-variante')).toBe('franja');
  });

  it('PRU-CMP-PRES-101 fila de categoría: barra con los puntos básicos del DTO y un indicador por sobregiro', () => {
    const raiz = montar(
      <>
        <FilaCategoria
          hrefDetalle="/d/1"
          hrefAsignar="/a/1"
          fila={categoria(
            { tipo: 'debito' },
            { cubiertoBp: 8200, excedenteBp: 1800, tipoExcedente: 'debito' },
          )}
        />
        <FilaCategoria
          hrefDetalle="/d/2"
          fila={{
            ...categoria(
              { tipo: 'tarjeta' },
              { cubiertoBp: 8000, excedenteBp: 2000, tipoExcedente: 'tarjeta' },
            ),
            categoria: { id: 'c2', nombre: 'Gasolina' },
          }}
        />
        <FilaCategoria
          hrefDetalle="/d/3"
          periodoCerrado
          fila={{
            ...categoria(null, { cubiertoBp: 10000, excedenteBp: 0, tipoExcedente: null }),
            categoria: { id: 'c3', nombre: 'Luz' },
            disponible: c(660),
          }}
        />
      </>,
    );
    const [deb, tar, cer] = [...raiz.querySelectorAll('[data-fila-categoria]')];
    const seg = [...(deb?.querySelectorAll('[data-segmento]') ?? [])].map((s) => [
      s.getAttribute('data-segmento'),
      (s as HTMLElement).style.width,
    ]);
    expect(seg).toEqual([
      ['cubierto', '82%'],
      ['excedente', '18%'],
    ]);
    expect(deb?.querySelector('[data-estado="problema"]')?.textContent).toBe(
      'Sobregiro con débito o efectivo',
    );
    expect(textoAccesible(deb)).toContain('Asignado $120.00 · Gastado $146.30');
    expect(deb?.querySelector('a[aria-label="Asignar a Restaurantes"]')).not.toBeNull();
    expect(tar?.querySelector('[data-estado="deuda-sin-respaldo"]')?.textContent).toBe(
      'Deuda sin reservar',
    );
    expect(tar?.querySelector('[data-segmento="excedente"]')?.className).toContain(
      'patron-sin-reservar',
    );
    expect(cer?.querySelector('[data-estado]')).toBeNull();
    expect(textoAccesible(cer)).toContain('Período cerrado');
    expect(cer?.querySelector('a[aria-label^="Asignar"]')).toBeNull();
  });

  it('PRU-CMP-PRES-101 fila de pago de tarjeta: falta reservar, reserva excedente, pago excedente y al día', () => {
    const raiz = montar(
      <>
        <FilaPagoTarjeta hrefDetalle="/t" fila={pago({ faltaReservar: c(1875) })} />
        <FilaPagoTarjeta hrefDetalle="/t" fila={pago({ reservaExcedente: c(2000) })} />
        <FilaPagoTarjeta hrefDetalle="/t" fila={pago({ pagoExcedente: { total: c(1500) } })} />
        <FilaPagoTarjeta hrefDetalle="/t" fila={pago({ disponible: c(0) })} />
      </>,
    );
    const etiquetas = [...raiz.querySelectorAll('[data-estado]')].map((e) => [
      e.getAttribute('data-estado'),
      e.textContent,
    ]);
    expect(etiquetas).toEqual([
      ['deuda-sin-respaldo', 'Te falta reservar'],
      ['informacion', 'Reservado de más'],
      ['problema', 'Pago excedente'],
      ['deuda', 'Al día'],
    ]);
    const montos = [...raiz.querySelectorAll('[data-centavos]')].map((m) =>
      m.getAttribute('data-centavos'),
    );
    expect(montos.filter((_, i) => i % 2 === 0)).toEqual(['1875', '2000', '1500', '0']);
    expect(textoAccesible(raiz)).toContain('Disponible para pagar $623.43');
  });

  it('PRU-CMP-PRES-101 fila de transacción: monto presentado y cada marca con nombre accesible', () => {
    const raiz = montar(
      <>
        <FilaTransaccion
          hrefDetalle="/a/x1?volver=%2Factividad"
          fila={transaccion({
            marcas: {
              porCobrar: true,
              conDevoluciones: false,
              conciliada: false,
              programada: true,
              periodoCerrado: false,
            },
          })}
        />
        <FilaTransaccion
          hrefDetalle="/a/x2"
          fila={transaccion({ id: 'x2', comercio: null, montoPresentado: c(150000) })}
        />
      </>,
    );
    const [a, b] = [...raiz.querySelectorAll('[data-fila-transaccion]')];
    expect(a?.getAttribute('href')).toBe('/a/x1?volver=%2Factividad');
    expect(textoAccesible(a)).toContain('menos $24.50');
    expect(
      [...(a?.querySelectorAll('svg[role="img"]') ?? [])].map((s) => s.getAttribute('aria-label')),
    ).toEqual(['Por cobrar', 'Programada']);
    expect(textoAccesible(b)).toContain('Sin comercio');
    expect(b?.querySelector('[data-centavos]')?.className).toContain('text-positivo-texto');
  });

  it('PRU-CMP-PRES-101 selector de período: actual, cerrado, futuro y de transición con enlaces [FE-31]', () => {
    const activo = periodo({});
    const raiz = montar(
      <>
        <SelectorPeriodo
          periodo={activo}
          periodoActivo={activo}
          anterior="2026-08-21"
          siguiente="2026-10-21"
          ruta="/presupuesto"
          parametros={{ periodo: '2026-09-21', filtro: 'x' }}
        />
        <SelectorPeriodo
          periodo={periodo({ inicio: '2026-08-21', fin: '2026-09-20', estado: 'cerrado' })}
          periodoActivo={activo}
          siguiente="2026-09-21"
          ruta="/presupuesto"
          parametros={{}}
        />
        <SelectorPeriodo
          periodo={periodo({ inicio: '2026-10-21', fin: '2026-11-20', estado: 'futuro' })}
          periodoActivo={activo}
          anterior="2026-09-21"
          siguiente="2026-11-21"
          ruta="/presupuesto"
          parametros={{}}
        />
        <SelectorPeriodo
          periodo={periodo({ transicion: true })}
          periodoActivo={activo}
          siguiente="2026-10-21"
          ruta="/presupuesto"
          parametros={{}}
        />
      </>,
    );
    const [act_, cer, fut, tra] = [...raiz.querySelectorAll('nav')];
    expect(act_?.getAttribute('data-estado-periodo')).toBe('activo');
    expect(textoAccesible(act_)).toContain('Actual · 25 días transcurridos · quedan 5');
    expect(act_?.querySelector('a[aria-label="Período anterior"]')?.getAttribute('href')).toBe(
      '/presupuesto?filtro=x&periodo=2026-08-21',
    );
    expect(act_?.textContent).not.toContain('Ir al período actual');
    expect(cer?.getAttribute('data-estado-periodo')).toBe('cerrado');
    expect(cer?.querySelector('a[aria-label="Período anterior"]')).toBeNull();
    const ir = [...(cer?.querySelectorAll('a') ?? [])].find(
      (a) => a.textContent === 'Ir al período actual',
    );
    expect(ir?.getAttribute('href')).toBe('/presupuesto');
    expect(fut?.getAttribute('data-estado-periodo')).toBe('futuro');
    expect(tra?.getAttribute('data-estado-periodo')).toBe('transicion');
    expect(textoAccesible(tra)).toContain('De transición');
  });

  it.each(temas)('PRU-CMP-PRES-101 axe sin violaciones en el tema %s', async (tema) => {
    document.documentElement.dataset['theme'] = tema;
    const activo = periodo({});
    const raiz = montar(
      <>
        <Billete
          lpa={c(31240)}
          enCamino={c(4000)}
          lpaNegativo={false}
          variante="billete"
          accion={{ href: '/a', texto: 'Asignar $312.40' }}
        />
        <Billete lpa={c(-8615)} enCamino={c(0)} lpaNegativo variante="franja" />
        <FilaCategoria
          hrefDetalle="/d/1"
          hrefAsignar="/a/1"
          fila={categoria(
            { tipo: 'mixto' },
            { cubiertoBp: 8200, excedenteBp: 1800, tipoExcedente: 'mixto' },
          )}
        />
        <FilaPagoTarjeta hrefDetalle="/t" fila={pago({ faltaReservar: c(1875) })} />
        <FilaTransaccion
          hrefDetalle="/a/x1"
          fila={transaccion({
            marcas: {
              porCobrar: true,
              conDevoluciones: true,
              conciliada: true,
              programada: true,
              periodoCerrado: true,
            },
          })}
        />
        <SelectorPeriodo
          periodo={periodo({ estado: 'cerrado' })}
          periodoActivo={activo}
          anterior="2026-08-21"
          siguiente="2026-09-21"
          ruta="/presupuesto"
          parametros={{}}
        />
      </>,
    );
    const { violations } = await axe.run(raiz, {
      runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
    });
    expect(
      violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
    ).toEqual([]);
  });
});
