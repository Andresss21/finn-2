// FT-14 Detalle de categoría (07 §17: un texto, un estado o el foco de un componente es una CMP). La pantalla solo dibuja lo
// que trae el DTO de 04 §6.3: los números de cada caso salen del motor y los prueban el dominio y las E2E (PF-3).
import axe from 'axe-core';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { DetalleCategoriaDto } from '@finn/aplicacion/consultas/detalle-categoria';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../../../globals.css';
import { PantallaDetalleCategoria } from './pantalla';

// `next/link` necesita `process` y el enrutador de Next, que el navegador de prueba no tiene: se simula `next/link`, nunca
// `enlace-finn`, que otras suites importan de verdad (`vitest list` no limpia los mocks de cada sesión del navegador).
vi.mock('next/link', async () => {
  const { createElement } = await import('react');
  const Enlace = ({ href, children, ...resto }: { href: string; children?: ReactNode }) =>
    createElement('a', { href, ...resto }, children);
  // `next/link` es CommonJS: el módulo es la propia función, con `useLinkStatus` como propiedad.
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
const CERRADO = {
  inicio: '2027-01-21',
  fin: '2027-02-20',
  dias: 31,
  estado: 'cerrado',
  transicion: false,
};
const ID = '11111111-1111-4111-8111-111111111111';
const ceros = { asignado: 0, gastado: 0, arrastre: 0, disponible: 0, fondo: 0, entradas: 0 };
const acciones = {
  puedeAsignar: true,
  puedeArchivar: true,
  bloqueosArchivo: [],
  puedeEliminar: true,
  asignadoEsperado: 0,
};

/** Un DTO de `detalleCategoria()` armado a mano. */
const dto = (parcial: Record<string, unknown> = {}): DetalleCategoriaDto =>
  ({
    revision: 'r1',
    hoy: '2027-03-02',
    periodoActivo: ACTIVO,
    notificacionesNoLeidas: 0,
    bandejaPorRevisar: 0,
    categoria: { id: ID, nombre: 'Super' },
    grupo: { id: 'g', nombre: 'Casa' },
    clase: 'normal',
    periodo: ACTIVO,
    navegacion: { anterior: '2027-01-21' },
    numeros: ceros,
    sobregiro: null,
    consumos: [],
    entradasDelPeriodo: [],
    meta: null,
    calendario: [],
    historialResumen: { promedioGastado: 0, periodosExcedidos: 0 },
    historial: [],
    programadas: [],
    reglas: [],
    acciones,
    ...parcial,
  }) as unknown as DetalleCategoriaDto;

const desarchivar = vi.fn(() =>
  Promise.resolve({ ok: true as const, valor: {}, yaAplicada: false, avisos: [] }),
);
const mostrar = (d: DetalleCategoriaDto): HTMLElement => {
  document.body.style.cssText = 'background: var(--fondo); color: var(--texto)';
  const nodo = document.createElement('div');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(<PantallaDetalleCategoria dto={d} desarchivar={desarchivar} />);
  });
  montados.push({ raiz, nodo });
  return nodo;
};

const consumo = (fecha: string, medio: 'debito' | 'tarjeta', neto: number, cubierto: number) => ({
  origen: { transaccionId: `t-${fecha}-${medio}` },
  fecha,
  comercio: `Comercio ${fecha}`,
  cuenta: { id: 'c', nombre: medio === 'debito' ? 'Ahorro' : 'Visa' },
  medio,
  montoNeto: neto,
  cubierto,
  noCubierto: neto - cubierto,
});
const enlace = (raiz: HTMLElement, texto: string) =>
  [...raiz.querySelectorAll('a')].find((a) => a.textContent.includes(texto));
const boton = (raiz: HTMLElement, texto: string) =>
  [...raiz.querySelectorAll('button')].find((b) => b.textContent.includes(texto));
/** Lo que se ve: sin el texto accesible de los montos (`sr-only`), que repite la cifra, y con los espacios normalizados. */
const sinEspacios = (el: Element | null | undefined): string => {
  if (el === null || el === undefined) return '';
  const copia = el.cloneNode(true) as Element;
  copia.querySelectorAll('.sr-only').forEach((x) => {
    x.remove();
  });
  return copia.textContent.replace(/\s+/g, ' ').trim();
};

describe('PRU-CMP-PRES-105 detalle de categoría', () => {
  it('PRU-CMP-PRES-105 [CA-14.1] los consumos salen en el orden del DTO con su medio, lo cubierto y lo no cubierto', () => {
    const consumos = [
      consumo('2027-02-10', 'debito', 6000, 6000),
      consumo('2027-02-10', 'tarjeta', 7000, 4000),
    ];
    const raiz = mostrar(dto({ consumos }));
    const filas = [...raiz.querySelectorAll('[data-consumo]')].map((f) => sinEspacios(f));
    expect(filas).toEqual([
      expect.stringMatching(/Débito · Ahorro.*cubierto \$60\.00.*\$60\.00$/),
      expect.stringMatching(/Tarjeta · Visa.*cubierto \$40\.00 · no cubierto \$30\.00.*\$70\.00$/),
    ]);
  });

  it('PRU-CMP-PRES-105 [CA-14.6] con sobregiro mixto el encabezado nombra los dos indicadores sin montos y el desglose trae los montos de cada parte', () => {
    const raiz = mostrar(
      dto({
        numeros: { ...ceros, disponible: -5000 },
        sobregiro: { tipo: 'mixto', total: 5000, parteTarjeta: 3000, parteDebito: 2000 },
        consumos: [consumo('2027-02-10', 'tarjeta', 7000, 4000)],
      }),
    );
    const indicadores = [...raiz.querySelectorAll('header [data-estado]')];
    expect(indicadores.map((i) => [i.getAttribute('data-estado'), sinEspacios(i)])).toEqual([
      ['problema', 'Sobregiro con débito o efectivo'],
      ['deuda-sin-respaldo', 'Deuda sin reservar'],
    ]);
    // Sin tocar nada, ningún indicador trae un monto; al llegar al desglose aparecen los de cada parte (PF-2)
    expect(indicadores.every((i) => !i.textContent.includes('$'))).toBe(true);
    const desglose = sinEspacios(raiz.querySelector('[data-sobregiro="mixto"]'));
    expect(desglose).toContain('Con débito $20.00');
    expect(desglose).toContain('Con tarjeta $30.00');
    expect(desglose).toContain('Deuda sin reservar en Super: $30.00');
    expect(desglose).toContain('Esta deuda suma a lo que te falta reservar para Visa');
  });

  it('PRU-CMP-PRES-105 [CA-14.7] «Cubrir $26.30» abre asignar de la categoría sin armar ningún monto nuevo', () => {
    const raiz = mostrar(
      dto({
        numeros: { ...ceros, asignado: 12000, disponible: -2630 },
        sobregiro: { tipo: 'debito', total: 2630, parteTarjeta: 0, parteDebito: 2630 },
      }),
    );
    const cubrir = enlace(raiz, 'Cubrir');
    expect(sinEspacios(cubrir)).toBe('Cubrir $26.30');
    expect(cubrir?.getAttribute('href')).toBe(`/presupuesto/asignar/${ID}`);
    // En un período cerrado ya no hay con qué cubrir
    const cerrado = mostrar(
      dto({
        periodo: CERRADO,
        sobregiro: { tipo: 'debito', total: 2630, parteTarjeta: 0, parteDebito: 2630 },
      }),
    );
    expect(enlace(cerrado, 'Cubrir')).toBeUndefined();
  });

  it('PRU-CMP-PRES-105 sin consumos en el período dice «Sin gastos en este período»', () => {
    const raiz = mostrar(dto());
    expect(raiz.querySelector('[data-seccion="consumos"]')?.textContent).toContain(
      'Sin gastos en este período',
    );
  });

  it('PRU-CMP-PRES-105 un período cerrado no ofrece asignar ni mover y lo dice; el selector lleva al período activo', () => {
    const raiz = mostrar(
      dto({ periodo: CERRADO, navegacion: { anterior: '2026-12-21', siguiente: '2027-02-21' } }),
    );
    expect(raiz.textContent).toContain('Este período está cerrado');
    expect(enlace(raiz, 'Asignar')).toBeUndefined();
    expect(enlace(raiz, 'Mover dinero')).toBeUndefined();
    expect(raiz.querySelector('[data-selector-periodo="cerrado"]')).not.toBeNull();
    expect(enlace(raiz, 'Volver a Presupuesto')?.getAttribute('href')).toBe(
      '/presupuesto?periodo=2027-01-21',
    );
  });

  it('PRU-CMP-PRES-105 una categoría archivada con Disponible ofrece «Sacar el dinero» y «Desarchivar» y no asignar ni mover', async () => {
    const raiz = mostrar(
      dto({
        categoria: { id: ID, nombre: 'Gimnasio', archivada: true },
        numeros: { ...ceros, disponible: 2500 },
        acciones: { ...acciones, puedeAsignar: false, puedeArchivar: false },
      }),
    );
    expect(raiz.textContent).toContain('Categoría archivada');
    expect(enlace(raiz, 'Sacar el dinero')?.getAttribute('href')).toBe(
      `/presupuesto/categorias/${ID}/sacar`,
    );
    expect(enlace(raiz, 'Asignar')).toBeUndefined();
    expect(enlace(raiz, 'Mover dinero')).toBeUndefined();
    await act(async () => {
      boton(raiz, 'Desarchivar')?.click();
      await Promise.resolve();
    });
    expect(desarchivar).toHaveBeenCalledWith(
      expect.objectContaining({ categoriaId: ID, modo: 'confirmar' }),
    );
  });

  it('PRU-CMP-PRES-105 con Disponible distinto de cero «Archivar» queda deshabilitado con su motivo', () => {
    const raiz = mostrar(
      dto({
        numeros: { ...ceros, disponible: 5000 },
        acciones: { ...acciones, puedeArchivar: false, bloqueosArchivo: ['disponible'] },
      }),
    );
    const archivar = boton(raiz, 'Archivar') as HTMLButtonElement;
    expect(archivar.disabled).toBe(true);
    expect(raiz.textContent).toContain('No se puede archivar: tiene Disponible distinto de cero.');
    expect(enlace(raiz, 'Fusionar')?.getAttribute('href')).toBe(
      `/presupuesto/categorias/${ID}/fusionar`,
    );
  });

  it('PRU-CMP-PRES-105 la pantalla completa no tiene violaciones de accesibilidad', async () => {
    const raiz = mostrar(
      dto({
        numeros: { ...ceros, asignado: 12000, disponible: -2630, gastado: 14630 },
        sobregiro: { tipo: 'debito', total: 2630, parteTarjeta: 0, parteDebito: 2630 },
        consumos: [consumo('2027-02-23', 'debito', 14630, 12000)],
        reglas: [{ id: 'r1', patron: 'PIZZA HUT' }],
        programadas: [
          { programada: { id: 'p1', nombre: 'Netflix' }, monto: 1500, proxima: '2027-03-05' },
        ],
      }),
    );
    const resultado = await axe.run(raiz, { rules: { 'color-contrast': { enabled: false } } });
    expect(
      resultado.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.html).join(' | ')}`),
    ).toEqual([]);
  });
});
