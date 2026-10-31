import axe from 'axe-core';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { Centavos } from '@finn/dominio/valores';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../app/globals.css';
import { GraficoBarras, type PuntoBarra } from '../graficos/grafico-barras';
import { TablaEquivalente } from '../graficos/tabla-equivalente';
import { VistaGrafico } from '../graficos/vista-grafico';
import { BilleteraTarjetas, type TarjetaDto } from './billetera';
import { IdentidadCuenta } from './identidad-cuenta';
import { MovimientoBandeja, vistaDe, type MovimientoDto } from './movimiento-bandeja';
import { PosicionNeta, type PosicionNetaDto } from './posicion-neta';

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
  delete document.documentElement.dataset['theme'];
  document.body.removeAttribute('style');
});

function montar(ui: ReactNode): HTMLElement {
  document.body.style.cssText =
    'background: var(--fondo); color: var(--texto); font-family: var(--fuente-cuerpo); width: 390px';
  const nodo = document.createElement('main');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(ui);
  });
  montados.push({ raiz, nodo });
  return nodo;
}

function textoAccesible(n: Node): string {
  if (n.nodeType === Node.TEXT_NODE) return n.textContent ?? '';
  if (!(n instanceof Element) || n.getAttribute('aria-hidden') === 'true') return '';
  return [...n.childNodes].map(textoAccesible).join('');
}

const c = (n: number): Centavos => n as Centavos;
const temas = ['claro', 'oscuro'] as const;

const visa: TarjetaDto = {
  cuenta: { id: 'visa', nombre: 'Visa Oro' },
  institucion: 'BAC',
  ultimos4: '4821',
  red: 'Visa',
  color: 'oro',
  deuda: c(60718),
  saldoAFavor: c(0),
  limite: c(250000),
  usoLimite: 2569,
  faltaReservar: c(1875),
  reservaExcedente: c(0),
  proximoCorte: '2026-10-25',
  proximoPago: '2026-11-15',
  paraNoGenerarIntereses: c(37063),
  usoSinReservarBp: 300,
};
const master: TarjetaDto = {
  ...visa,
  cuenta: { id: 'master', nombre: 'Mastercard Clásica' },
  institucion: 'Davivienda',
  ultimos4: '1102',
  red: 'Mastercard',
  color: 'plata',
  deuda: c(0),
  faltaReservar: c(0),
  limite: c(100000),
  usoLimite: 0,
  usoSinReservarBp: null,
  paraNoGenerarIntereses: c(0),
};

const posicion: PosicionNetaDto = {
  activos: {
    efectivo: c(150000),
    saldosAFavor: c(2500),
    inversiones: c(80000),
    porCobrar: c(5000),
    total: c(237500),
  },
  deudas: { tarjetas: c(60718), prestamos: c(110000), total: c(170718) },
  neto: c(66782),
  barras: { activosBp: 10000, deudasBp: 7188 },
};

const base: MovimientoDto = {
  id: 'm1',
  estado: 'pendiente',
  sms: { texto: 'BAC: compra por $45.00 en SUPER SELECTOS' },
  cuenta: { nombre: 'Cuenta corriente' },
  fecha: '2026-10-28',
  monto: c(-4500),
  comercio: 'SUPER SELECTOS',
  categoriaSugerida: { nombre: 'Supermercado', porRegla: true },
  aprobacion: { posible: true, faltantes: [] },
};
const SIETE: readonly (readonly [string, MovimientoDto, string, string])[] = [
  ['listo', base, 'Listo para aprobar', 'positivo'],
  [
    'falta',
    { ...base, categoriaSugerida: null, aprobacion: { posible: false, faltantes: ['destino'] } },
    'Falta la categoría',
    'advertencia',
  ],
  ['coincidencia', { ...base, estado: 'con_coincidencia' }, 'Con coincidencia', 'informacion'],
  ['duplicado', { ...base, estado: 'posible_duplicado' }, 'Posible duplicado', 'advertencia'],
  [
    'noReconocido',
    { ...base, estado: 'no_reconocido', comercio: null, monto: null },
    'No reconocido',
    'cero',
  ],
  ['error', { ...base, estado: 'error' }, 'Con error', 'problema'],
  ['descartado', { ...base, estado: 'descartado' }, 'Descartado', 'cero'],
];

const semanas: PuntoBarra[] = [
  { clave: 's1', etiqueta: 'S1', valor: c(8000), referencia: c(10000) },
  { clave: 's2', etiqueta: 'S2', valor: c(12500), referencia: c(10000), excedido: true },
  { clave: 's3', etiqueta: 'S3', valor: c(5000), referencia: c(10000), actual: true },
  {
    clave: 's4',
    etiqueta: 'S4',
    valor: c(0),
    referencia: c(10000),
    futura: true,
    nota: 'faltan 2 días',
  },
];

describe('PRU-CMP-CTA-101 cuentas, bandeja y gráficos', () => {
  it('PRU-CMP-CTA-101 billetera: la cara de atrás es un botón de 44 px que la trae al frente, sin arrastrar [FE-44]', () => {
    const raiz = montar(<BilleteraTarjetas tarjetas={[visa, master]} />);
    expect(raiz.querySelector('[data-detalle-tarjeta]')?.textContent).toContain(
      'Te falta reservar',
    );
    expect(textoAccesible(raiz)).toContain('$18.75');
    const traer = raiz.querySelector<HTMLButtonElement>('[data-billetera] button');
    expect(traer).not.toBeNull();
    expect(traer?.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    expect(traer?.textContent).toContain('Traer al frente. Mastercard Clásica');
    expect(raiz.querySelectorAll('[data-billetera] button').length).toBe(1);
    act(() => {
      traer?.click();
    });
    expect(raiz.querySelector('[data-detalle-tarjeta]')?.textContent).toContain('Sin deuda');
    expect(raiz.querySelector('[data-billetera] button')?.textContent).toContain('Visa Oro');
  });

  it('PRU-CMP-CTA-101 tarjeta: uso del límite con la parte sin reservar rayada y fechas del DTO [FE-44]', () => {
    const raiz = montar(<BilleteraTarjetas tarjetas={[visa]} />);
    const barra = raiz.querySelector('[role="progressbar"]');
    expect(barra?.getAttribute('aria-valuenow')).toBe('25.69');
    expect(barra?.getAttribute('aria-valuetext')).toBe('25.69%');
    expect(raiz.querySelector('[data-segmento="sin-reservar"]')).not.toBeNull();
    const texto = textoAccesible(raiz);
    expect(texto).toContain('Uso del límite de $2,500.00');
    expect(texto).toContain('25/10/2026');
    expect(texto).toContain('15/11/2026');
    expect(texto).toContain('$370.63');
    expect(raiz.textContent).not.toContain('Tocá la tarjeta');
  });

  it('PRU-CMP-CTA-101 tarjeta: saldo a favor, deuda reservada y sin límite [FE-44]', () => {
    const aFavor = montar(
      <BilleteraTarjetas tarjetas={[{ ...master, saldoAFavor: c(2500), limite: c(0) }]} />,
    );
    expect(aFavor.textContent).toContain('Saldo a favor');
    expect(aFavor.querySelector('[role="progressbar"]')).toBeNull();
    const reservada = montar(
      <BilleteraTarjetas tarjetas={[{ ...visa, faltaReservar: c(0), usoSinReservarBp: null }]} />,
    );
    expect(reservada.querySelector('[data-detalle-tarjeta]')?.textContent).toContain(
      'Deuda de tarjeta',
    );
    expect(reservada.querySelector('[data-segmento="sin-reservar"]')).toBeNull();
  });

  it('PRU-CMP-CTA-101 identidad de cuenta: efectivo con diferencia, préstamo con talón, inversión y archivada [FE-44]', () => {
    const raiz = montar(
      <>
        <IdentidadCuenta
          tipo="efectivo"
          fila={{
            cuenta: { id: 'a', nombre: 'Cuenta corriente' },
            institucion: 'BAC',
            ultimos4: '0042',
            saldo: c(150000),
            saldoConfirmado: c(148000),
            ultimaConciliacion: { diferenciaActual: c(500) },
          }}
        />
        <IdentidadCuenta
          tipo="prestamo"
          fila={{
            cuenta: { id: 'p', nombre: 'Préstamo auto' },
            contraparte: 'Banco',
            capitalPendiente: c(900000),
            proximaCuota: { fecha: '2026-10-20', monto: c(21000), numero: 7 },
          }}
        />
        <IdentidadCuenta
          tipo="prestamo"
          fila={{
            cuenta: { id: 'q', nombre: 'Préstamo amigo' },
            contraparte: 'Ana',
            capitalPendiente: c(10000),
          }}
        />
        <IdentidadCuenta
          tipo="inversion"
          fila={{ cuenta: { id: 'i', nombre: 'Fondo' }, valor: c(80000) }}
        />
        <IdentidadCuenta tipo="archivada" fila={{ id: 'z', nombre: 'Vieja' }} />
      </>,
    );
    const [efectivo, prestamo, sinModelo, inversion, archivada] = [
      ...raiz.querySelectorAll('[data-identidad]'),
    ].map(textoAccesible);
    expect(efectivo).toContain('Saldo$1,500.00');
    expect(efectivo).toContain('Confirmado$1,480.00');
    expect(efectivo).toContain('Diferencia con el estado de cuenta');
    expect(prestamo).toContain('Cuota7');
    expect(prestamo).toContain('20/10/2026');
    expect(sinModelo).toContain('Sin modelo');
    expect(inversion).toContain('Valor$800.00');
    expect(archivada).toContain('Archivada');
    expect(
      [...raiz.querySelectorAll('[data-identidad]')].map((e) => e.getAttribute('data-identidad')),
    ).toEqual(['efectivo', 'prestamo', 'prestamo', 'inversion', 'archivada']);
  });

  it('PRU-CMP-CTA-101 posición neta: la mayor al 100 %, deudas rayadas y desglose del DTO [FE-44]', () => {
    const raiz = montar(<PosicionNeta posicion={posicion} />);
    const [a, d] = [...raiz.querySelectorAll('[data-barra-bp]')];
    expect(a?.getAttribute('data-barra-bp')).toBe('10000');
    expect((a as HTMLElement).style.width).toBe('100%');
    expect((d as HTMLElement).style.width).toBe('71.88%');
    expect(d?.className).toContain('repeating-linear-gradient');
    expect(textoAccesible(raiz)).toContain('Posición neta$667.82');
    expect(textoAccesible(raiz)).toContain('Tarjetas $607.18');
  });

  it.each(SIETE)(
    'PRU-CMP-CTA-101 fila de la bandeja en estado %s [FE-44]',
    (vista, mov, etiqueta, estado) => {
      expect(vistaDe(mov)).toBe(vista);
      const raiz = montar(<MovimientoBandeja movimiento={mov} hrefRevisar="/bandeja/m1" />);
      const fila = raiz.querySelector('[data-movimiento]');
      expect(fila?.getAttribute('data-vista')).toBe(vista);
      expect(textoAccesible(fila as Element)).toContain(etiqueta);
      expect(fila?.querySelector('svg[aria-hidden="true"]')?.parentElement?.className).toContain(
        `${estado}-fondo`,
      );
      for (const el of raiz.querySelectorAll('[data-movimiento] button, [data-movimiento] a')) {
        expect(el.getBoundingClientRect().height, el.textContent).toBeGreaterThanOrEqual(44);
      }
    },
  );

  it('PRU-CMP-CTA-101 fila de la bandeja: acciones de un toque con el comercio en su nombre y pista por regla [FE-44]', () => {
    const llamadas: string[] = [];
    const raiz = montar(
      <>
        <MovimientoBandeja
          movimiento={base}
          hrefRevisar="/b/1"
          alAccionar={(a, id) => llamadas.push(`${a}:${id}`)}
        />
        <MovimientoBandeja
          movimiento={{ ...base, id: 'm2', estado: 'posible_duplicado' }}
          hrefRevisar="/b/2"
        />
        <MovimientoBandeja
          movimiento={{ ...base, id: 'm3', estado: 'no_reconocido' }}
          hrefRevisar="/b/3"
        />
        <MovimientoBandeja movimiento={{ ...base, id: 'm4', estado: 'error' }} hrefRevisar="/b/4" />
      </>,
    );
    expect(textoAccesible(raiz)).toContain('→ Supermercado (por regla)');
    const aprobar = raiz.querySelector<HTMLButtonElement>(
      'button[aria-label="Aprobar SUPER SELECTOS"]',
    );
    act(() => {
      aprobar?.click();
    });
    expect(llamadas).toEqual(['aprobar:m1']);
    const nombres = [...raiz.querySelectorAll('button')].map((b) => b.getAttribute('aria-label'));
    expect(nombres).toEqual([
      'Aprobar SUPER SELECTOS',
      'Es otro gasto SUPER SELECTOS',
      'Descartar SUPER SELECTOS',
      'Intentar de nuevo SUPER SELECTOS',
      'Copiar referencia SUPER SELECTOS',
    ]);
    expect(raiz.querySelector('blockquote')?.textContent).toContain('compra por $45.00');
    expect(raiz.querySelector('a[href="/b/3"]')?.textContent).toBe('Registrar a mano');
  });

  it('PRU-CMP-CTA-101 gráfico de barras: role="img" con nombre, tope de referencia, semana futura y tabla equivalente [FE-44]', () => {
    const raiz = montar(
      <>
        <GraficoBarras titulo="Gasto semanal" resumen="$50.00 en la semana 3" puntos={semanas} />
        <TablaEquivalente titulo="Gasto semanal" puntos={semanas} />
      </>,
    );
    const svg = raiz.querySelector('svg[role="img"]');
    expect(svg?.getAttribute('aria-label')).toBe('Gasto semanal: $50.00 en la semana 3');
    expect(svg?.querySelectorAll('[data-punto]').length).toBe(4);
    expect(svg?.querySelectorAll('path[stroke-width="2"]').length).toBe(4);
    expect(svg?.querySelector('[data-punto="s4"] rect')?.getAttribute('stroke-dasharray')).toBe(
      '3 3',
    );
    const tabla = raiz.querySelector('table');
    expect(tabla?.querySelector('caption')?.textContent).toBe('Gasto semanal');
    expect(tabla?.querySelectorAll('tbody th[scope="row"]').length).toBe(4);
    const filas = [...(tabla?.querySelectorAll('tbody tr') ?? [])].map(textoAccesible);
    expect(filas[1]).toContain('$125.00');
    expect(filas[1]).toContain('Se pasó');
    expect(filas[3]).toContain('faltan 2 días');
  });

  it('PRU-CMP-CTA-101 gráfico de barras sin datos y con un solo punto [FE-44]', () => {
    const vacio = montar(<GraficoBarras titulo="Historial" resumen="" puntos={[]} />);
    expect(vacio.querySelector('[data-grafico-vacio]')?.textContent).toContain(
      'Todavía no hay datos',
    );
    const uno = montar(
      <GraficoBarras titulo="Historial" resumen="$10.00" puntos={[semanas[0] as PuntoBarra]} />,
    );
    expect(uno.querySelectorAll('[data-punto]').length).toBe(1);
  });

  it('PRU-CMP-CTA-101 selector Gráfico / Tabla: radiogroup que alterna la vista sin sacar la tabla del árbol [FE-44]', () => {
    const raiz = montar(
      <VistaGrafico
        grafico={<GraficoBarras titulo="Historial" resumen="$50.00" puntos={semanas} />}
        tabla={<TablaEquivalente titulo="Historial" puntos={semanas} />}
      />,
    );
    const grupo = raiz.querySelector('[role="radiogroup"]');
    expect(grupo?.getAttribute('aria-label')).toBe('Vista');
    const opciones = [...raiz.querySelectorAll<HTMLElement>('[role="radio"]')];
    expect(opciones.map((o) => o.textContent)).toEqual(['Gráfico', 'Tabla']);
    for (const o of opciones) expect(o.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    const tabla = raiz.querySelector('table') as HTMLElement;
    expect(tabla.parentElement?.className).toContain('sr-only');
    expect(tabla.closest('[aria-hidden="true"]')).toBeNull();
    act(() => {
      opciones[1]?.click();
    });
    expect(raiz.querySelector('[data-vista-grafico]')?.getAttribute('data-vista-grafico')).toBe(
      'tabla',
    );
    expect(tabla.parentElement?.className).not.toContain('sr-only');
    expect((raiz.querySelector('svg[role="img"]') as Element).parentElement?.className).toContain(
      'sr-only',
    );
  });

  it.each(temas)('PRU-CMP-CTA-101 axe sin violaciones en el tema %s [FE-44]', async (tema) => {
    document.documentElement.dataset['theme'] = tema;
    const raiz = montar(
      <>
        <BilleteraTarjetas tarjetas={[visa, master]} />
        <IdentidadCuenta
          tipo="efectivo"
          fila={{
            cuenta: { id: 'a', nombre: 'Cuenta corriente' },
            saldo: c(150000),
            saldoConfirmado: c(148000),
            ultimaConciliacion: { diferenciaActual: c(500) },
          }}
        />
        <IdentidadCuenta
          tipo="prestamo"
          fila={{
            cuenta: { id: 'p', nombre: 'Préstamo auto' },
            contraparte: 'Banco',
            capitalPendiente: c(900000),
            proximaCuota: { fecha: '2026-10-20', monto: c(21000), numero: 7 },
          }}
        />
        <IdentidadCuenta
          tipo="inversion"
          fila={{ cuenta: { id: 'i', nombre: 'Fondo' }, valor: c(80000) }}
        />
        <IdentidadCuenta tipo="archivada" fila={{ id: 'z', nombre: 'Vieja' }} />
        <PosicionNeta posicion={posicion} />
        {SIETE.map(([v, m]) => (
          <MovimientoBandeja key={v} movimiento={{ ...m, id: v }} hrefRevisar={`/bandeja/${v}`} />
        ))}
        <VistaGrafico
          grafico={<GraficoBarras titulo="Gasto semanal" resumen="$50.00" puntos={semanas} />}
          tabla={<TablaEquivalente titulo="Gasto semanal" puntos={semanas} />}
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
