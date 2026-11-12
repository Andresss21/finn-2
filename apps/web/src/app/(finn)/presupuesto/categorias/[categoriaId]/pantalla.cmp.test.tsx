// FT-14 Detalle de categoría (07 §17: un texto, un estado o el foco de un componente es una CMP). La pantalla solo dibuja lo
// que trae el DTO de 04 §6.3: los números de cada caso salen del motor y los prueban el dominio y las E2E (PF-3).
import axe from 'axe-core';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { DetalleCategoriaDto } from '@finn/aplicacion/consultas/detalle-categoria';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import '../../../../globals.css';
import { Marco } from '../../../../../componentes/marco/marco';
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

// Solo el límite externo: el marco lee la ruta del enrutador de Next, que el navegador de prueba no tiene.
vi.mock('next/navigation', () => ({
  usePathname: () => '/presupuesto/categorias/11111111-1111-4111-8111-111111111111',
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ refresh: () => undefined, replace: () => undefined, back: () => undefined }),
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const montados: { raiz: Root; nodo: HTMLElement }[] = [];
afterEach(async () => {
  await page.viewport(414, 896);
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

/** Dentro del marco, que dibuja «Más acciones» con lo que la pantalla publica (P1-04, CH-115). Devuelve el menú abierto. */
const abrirMenu = async (d: DetalleCategoriaDto): Promise<HTMLElement> => {
  const nodo = document.createElement('div');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(
      <Marco>
        <PantallaDetalleCategoria dto={d} desarchivar={desarchivar} />
      </Marco>,
    );
  });
  montados.push({ raiz, nodo });
  // El menú se descarga diferido: el botón llega con su módulo.
  await vi.waitFor(() => {
    expect(nodo.querySelector('button[aria-label="Más acciones"]')).not.toBeNull();
  });
  act(() => {
    nodo.querySelector<HTMLButtonElement>('button[aria-label="Más acciones"]')?.click();
  });
  return nodo.querySelector<HTMLElement>('[role=menu]') as HTMLElement;
};
const accion = (menu: HTMLElement, texto: string) =>
  [...menu.querySelectorAll<HTMLElement>('[role=menuitem]')].find((a) =>
    a.textContent.includes(texto),
  );

const consumo = (
  fecha: string,
  medio: 'debito' | 'tarjeta',
  neto: number,
  cubierto: number,
  cubiertoBp = 10_000,
) => ({
  origen: { transaccionId: `t-${fecha}-${medio}` },
  fecha,
  comercio: `Comercio ${fecha}`,
  cuenta: { id: 'c', nombre: medio === 'debito' ? 'Ahorro' : 'Visa' },
  medio,
  montoNeto: neto,
  cubierto,
  noCubierto: neto - cubierto,
  cubiertoBp,
});
const periodoCerrado = (inicio: string) => ({
  inicio,
  fin: inicio,
  dias: 28,
  estado: 'cerrado',
  transicion: false,
});
const hist = (inicio: string, asignado: number, gastado: number) => ({
  periodo: periodoCerrado(inicio),
  asignado,
  gastado,
  disponible: asignado - gastado,
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
  it('PRU-CMP-PRES-105 [CA-14.4] con gasto en 3 días el calendario muestra esos 3 días y su tabla equivalente tiene las mismas cifras', () => {
    const calendario = [
      { fecha: '2027-02-23', gastado: 1000, intensidadBp: 2500 },
      { fecha: '2027-02-25', gastado: 4000, intensidadBp: 10000 },
      { fecha: '2027-02-28', gastado: 2000, intensidadBp: 5000 },
    ];
    const raiz = mostrar(dto({ calendario }));
    const botones = [...raiz.querySelectorAll('[data-calendario] button[data-dia]')];
    expect(botones.map((b) => b.getAttribute('data-dia'))).toEqual([
      '2027-02-23',
      '2027-02-25',
      '2027-02-28',
    ]);
    // La tabla es la misma información: una fila por día, con el gastado del DTO
    const filas = [...raiz.querySelectorAll('[data-seccion="calendario"] tbody tr')];
    expect(
      filas.map((f) => [
        f.querySelector('th')?.textContent,
        f.querySelector('[data-centavos]')?.getAttribute('data-centavos'),
      ]),
    ).toEqual([
      ['23/02/2027', '1000'],
      ['25/02/2027', '4000'],
      ['28/02/2027', '2000'],
    ]);
    // Cada día dice su gasto con su nombre accesible
    expect(botones[1]?.getAttribute('aria-label')).toBe('25/02/2027, Gastado $40.00');
  });

  it('PRU-CMP-PRES-105 [CA-14.8] el punto de cada día crece con el `intensidadBp` que trae el DTO y un día en 0 queda en el tamaño mínimo', () => {
    const calendario = [
      { fecha: '2027-02-23', gastado: 1000, intensidadBp: 2500 },
      { fecha: '2027-02-25', gastado: 4000, intensidadBp: 10000 },
      { fecha: '2027-02-26', gastado: -500, intensidadBp: 0 },
      { fecha: '2027-02-28', gastado: 2000, intensidadBp: 5000 },
    ];
    const raiz = mostrar(dto({ calendario }));
    const lado = (dia: string) =>
      (raiz.querySelector(`[data-dia="${dia}"] span[style]`) as HTMLElement).style.width;
    expect(
      ['2027-02-23', '2027-02-25', '2027-02-26', '2027-02-28'].map((d) => [
        raiz.querySelector(`[data-dia="${d}"]`)?.getAttribute('data-intensidad'),
        lado(d),
      ]),
    ).toEqual([
      ['2500', '9px'],
      ['10000', '18px'],
      ['0', '6px'],
      ['5000', '12px'],
    ]);
  });

  it('PRU-CMP-PRES-105 [CA-14.4] tocar un día deja solo sus consumos y «Ver todos los días» los devuelve', () => {
    const consumos = [
      consumo('2027-02-23', 'debito', 1000, 1000),
      consumo('2027-02-25', 'debito', 4000, 4000),
    ];
    const calendario = [
      { fecha: '2027-02-23', gastado: 1000, intensidadBp: 2500 },
      { fecha: '2027-02-25', gastado: 4000, intensidadBp: 10000 },
    ];
    const raiz = mostrar(dto({ consumos, calendario }));
    const dia = raiz.querySelector('[data-dia="2027-02-25"]') as HTMLButtonElement;
    act(() => {
      dia.click();
    });
    expect(
      [...raiz.querySelectorAll('[data-consumo]')].map((x) => x.getAttribute('data-consumo')),
    ).toEqual(['2027-02-25']);
    expect(dia.getAttribute('aria-pressed')).toBe('true');
    act(() => {
      boton(raiz, 'Ver todos los días')?.click();
    });
    expect(raiz.querySelectorAll('[data-consumo]')).toHaveLength(2);
  });

  it('PRU-CMP-PRES-105 [CA-14.1] los consumos salen en el orden del DTO con su medio, lo cubierto y lo no cubierto', () => {
    const consumos = [
      consumo('2027-02-10', 'debito', 6000, 6000),
      consumo('2027-02-10', 'tarjeta', 7000, 4000, 5714),
    ];
    const raiz = mostrar(dto({ consumos }));
    const filas = [...raiz.querySelectorAll('[data-consumo]')].map((f) => sinEspacios(f));
    expect(filas).toEqual([
      expect.stringMatching(/Débito · Ahorro.*cubierto \$60\.00.*\$60\.00$/),
      expect.stringMatching(/Tarjeta · Visa.*cubierto \$40\.00 · no cubierto \$30\.00.*\$70\.00$/),
    ]);
  });

  it('PRU-CMP-PRES-105 [CA-14.5] un historial de 4 períodos muestra esos 4, en tabla y en gráfico, y el título dice cuántos', () => {
    const historial = [
      hist('2026-10-21', 10000, 9000),
      hist('2026-11-21', 10000, 8000),
      hist('2026-12-21', 10000, 7000),
      hist('2027-01-21', 10000, 6000),
    ];
    const raiz = mostrar(
      dto({ historial, historialResumen: { promedioGastado: 7500, periodosExcedidos: 0 } }),
    );
    expect(raiz.querySelector('[data-seccion="historial"] h2')?.textContent).toBe(
      'Últimos 4 períodos',
    );
    expect(raiz.querySelectorAll('[data-historial] tbody tr')).toHaveLength(4);
    expect(raiz.querySelectorAll('[data-historial] svg [data-punto]')).toHaveLength(4);
  });

  it('PRU-CMP-PRES-105 [CA-14.9] «Se pasó 2 de 6» y el promedio vienen del DTO; con 3 períodos dice «Se pasó 1 de 3»', () => {
    const seis = Array.from({ length: 6 }, (_, k) =>
      hist(`2026-0${k + 3}-21`, 10000, k === 1 || k === 3 ? 11000 : 9000),
    );
    const raiz = mostrar(
      dto({ historial: seis, historialResumen: { promedioGastado: 11195, periodosExcedidos: 2 } }),
    );
    expect(raiz.querySelector('[data-se-paso]')?.textContent).toBe('Se pasó 2 de 6');
    expect(raiz.querySelector('[data-historial] [data-centavos="11195"]')).not.toBeNull();
    const tres = mostrar(
      dto({
        historial: seis.slice(0, 3),
        historialResumen: { promedioGastado: 100, periodosExcedidos: 1 },
      }),
    );
    expect(tres.querySelector('[data-se-paso]')?.textContent).toBe('Se pasó 1 de 3');
  });

  it('PRU-CMP-PRES-105 [CA-14.10] la barra de la meta dibuja el `progresoBp` del DTO: 4,500 es 45 % y 10,000 es 100 %', async () => {
    const meta = (progresoBp: number, disponible: number) =>
      dto({
        numeros: { ...ceros, disponible },
        meta: {
          id: 'meta-1',
          tipo: 'ahorro',
          monto: 300000,
          pedido: 17500,
          falta: 7500,
          estado: 'con_faltante',
          progresoBp,
        },
      });
    const parcial = mostrar(meta(4500, 135000));
    const menu = await abrirMenu(meta(4500, 135000));
    const barra = parcial.querySelector('[role="progressbar"]');
    expect(barra?.getAttribute('aria-valuenow')).toBe('45');
    expect(barra?.getAttribute('aria-valuetext')).toBe('45%');
    expect(sinEspacios(parcial.querySelector('[data-resumen-meta]'))).toContain(
      '$1,350.00 de $3,000.00',
    );
    expect(sinEspacios(parcial.querySelector('[data-resumen-meta]'))).toContain(
      'Pide $175.00 este período · falta $75.00',
    );
    // [CH-72] la meta se edita en `/metas/[metaId]` con el `id` que trae el DTO
    expect(accion(menu, 'Editar la meta')?.getAttribute('href')).toBe('/metas/meta-1');
    expect(enlace(parcial, 'Editar la meta')).toBeUndefined();
    const completa = mostrar(meta(10000, 350000));
    expect(completa.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')).toBe(
      '100',
    );
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
    expect(raiz.textContent).toContain('No se puede cambiar lo asignado en un período cerrado.');
    expect(enlace(raiz, 'Asignar')).toBeUndefined();
    expect(enlace(raiz, 'Mover dinero')).toBeUndefined();
    expect(raiz.querySelector('[data-selector-periodo="cerrado"]')).not.toBeNull();
    // A5: la flecha de la fila del título se nombra con `aria-label`
    expect(raiz.querySelector('a[aria-label="Volver a Presupuesto"]')?.getAttribute('href')).toBe(
      '/presupuesto?periodo=2027-01-21',
    );
  });

  it('PRU-CMP-PRES-105 una categoría archivada con Disponible ofrece el aviso AV-14 con «Elegir destino y monto» y «Desarchivar» y no asignar ni mover', async () => {
    const raiz = mostrar(
      dto({
        categoria: { id: ID, nombre: 'Gimnasio', archivada: true },
        numeros: { ...ceros, disponible: 2500 },
        acciones: { ...acciones, puedeAsignar: false, puedeArchivar: false },
      }),
    );
    expect(raiz.textContent).toContain('Categoría archivada');
    expect(enlace(raiz, 'Elegir destino y monto')?.getAttribute('href')).toBe(
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

  it('PRU-CMP-PRES-105 con Disponible distinto de cero «Archivar» queda deshabilitado con su motivo', async () => {
    const menu = await abrirMenu(
      dto({
        numeros: { ...ceros, disponible: 5000 },
        acciones: { ...acciones, puedeArchivar: false, bloqueosArchivo: ['disponible'] },
      }),
    );
    // CH-115: «Archivar» y «Fusionar con otra» viven en «Más acciones», no sueltos en el contenido.
    const archivar = accion(menu, 'Archivar');
    expect(archivar?.getAttribute('aria-disabled')).toBe('true');
    expect(archivar?.hasAttribute('href')).toBe(false);
    expect(archivar?.textContent).toContain(
      'No se puede archivar: tiene Disponible distinto de cero.',
    );
    expect(accion(menu, 'Fusionar')?.getAttribute('href')).toBe(
      `/presupuesto/categorias/${ID}/fusionar`,
    );
    expect(accion(menu, 'Eliminar')?.hasAttribute('href')).toBe(true);
    expect(boton(document.body, 'Archivar')).toBeUndefined();
  });

  it('PRU-CMP-PRES-105 la pantalla completa no tiene violaciones de accesibilidad', async () => {
    const raiz = mostrar(
      dto({
        numeros: { ...ceros, asignado: 12000, disponible: -2630, gastado: 14630 },
        sobregiro: { tipo: 'debito', total: 2630, parteTarjeta: 0, parteDebito: 2630 },
        consumos: [consumo('2027-02-23', 'debito', 14630, 12000)],
        calendario: [{ fecha: '2027-02-23', gastado: 14630, intensidadBp: 10000 }],
        historial: [hist('2027-01-21', 10000, 11000)],
        historialResumen: { promedioGastado: 11000, periodosExcedidos: 1 },
        meta: {
          id: 'meta-1',
          tipo: 'ahorro',
          monto: 300000,
          pedido: 17500,
          falta: 7500,
          estado: 'con_faltante',
          progresoBp: 4500,
        },
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

describe('Detalle de categoría: ajustes del diseño (CH-140)', () => {
  it('PRU-CMP-PRES-240 [CA-14.1] cada consumo lleva la insignia con el mes abreviado y el día de dos cifras', () => {
    const raiz = mostrar(
      dto({
        consumos: [
          consumo('2027-02-05', 'debito', 6000, 6000),
          consumo('2027-03-01', 'tarjeta', 700, 700),
        ],
      }),
    );
    const insignias = [...raiz.querySelectorAll('[data-consumo] [data-insignia-fecha]')].map((x) =>
      x.textContent.replace(/\s+/g, ' ').trim(),
    );
    expect(insignias).toEqual(['feb05', 'mar01']);
  });

  it('PRU-CMP-PRES-241 [CA-14.6] con sobregiro de débito la rejilla suma «Sobregiro» con el total del DTO', () => {
    const raiz = mostrar(
      dto({
        numeros: { ...ceros, asignado: 12000, gastado: 14630, fondo: 12000, disponible: -2630 },
        sobregiro: { tipo: 'debito', total: 2630, parteTarjeta: 0, parteDebito: 2630 },
      }),
    );
    const celdas = [...raiz.querySelectorAll('[data-numeros] > div')].map((x) => sinEspacios(x));
    expect(celdas).toEqual([
      'Asignado$120.00',
      'Gastado$146.30',
      'Arrastrado$0.00',
      'Fondo$120.00',
      'Entradas$0.00',
      'Sobregiro$26.30',
    ]);
  });

  it('PRU-CMP-PRES-242 [CA-14.6] con sobregiro de tarjeta la sexta cifra es «Con tarjeta», y sin sobregiro la rejilla tiene cinco', () => {
    const conTarjeta = mostrar(
      dto({
        numeros: { ...ceros, disponible: -1875 },
        sobregiro: { tipo: 'tarjeta', total: 1875, parteTarjeta: 1875, parteDebito: 0 },
      }),
    );
    const ultima = [...conTarjeta.querySelectorAll('[data-numeros] > div')].at(-1);
    expect(sinEspacios(ultima ?? null)).toBe('Con tarjeta$18.75');
    const sin = mostrar(dto());
    expect(sin.querySelectorAll('[data-numeros] > div')).toHaveLength(5);
  });

  it('PRU-CMP-PRES-243 [CA-14.1] en el orden del diseño: cifras, sobregiro, consumos, historial, y al final las acciones de asignar y mover', () => {
    const raiz = mostrar(
      dto({
        numeros: { ...ceros, disponible: -2630 },
        sobregiro: { tipo: 'debito', total: 2630, parteTarjeta: 0, parteDebito: 2630 },
        consumos: [consumo('2027-02-10', 'debito', 6000, 6000)],
        historial: [hist('2027-01-21', 10000, 9000)],
        historialResumen: { promedioGastado: 9000, periodosExcedidos: 0 },
      }),
    );
    const orden = [
      '[data-numeros]',
      '[data-sobregiro]',
      '[data-seccion="consumos"]',
      '[data-seccion="historial"]',
      'nav[aria-label="Acciones de la categoría"]',
    ].map((q) => raiz.querySelector(q));
    expect(orden.every((x) => x !== null)).toBe(true);
    for (let k = 1; k < orden.length; k++) {
      const anterior = orden[k - 1] as Element;
      const actual = orden[k] as Element;
      expect(anterior.compareDocumentPosition(actual) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(
        0,
      );
    }
  });
});

describe('Detalle de categoría: historial sin datos y meta (D9, A9)', () => {
  const conMeta = (parcial: Record<string, unknown> = {}) =>
    dto({
      numeros: { ...ceros, disponible: 135000 },
      meta: {
        id: 'meta-1',
        tipo: 'para_fecha',
        monto: 300000,
        pedido: 17500,
        falta: 7500,
        estado: 'con_faltante',
        progresoBp: 4500,
      },
      ...parcial,
    });

  it('PRU-CMP-PRES-400 [CA-14.5] sin períodos anteriores, la caja «Gráfico sin datos»; una categoría de ahorro con meta y sin gasto no lleva historial', () => {
    const vacia = mostrar(dto());
    const caja = vacia.querySelector('[data-historial="vacio"]');
    expect(caja?.textContent).toContain('Gráfico sin datos');
    expect(caja?.querySelector('[data-icono="chart"]')).not.toBeNull();
    expect(caja?.className).toContain('bg-superficie-hundida');
    expect(caja?.getBoundingClientRect().height).toBe(180);

    expect(mostrar(conMeta()).querySelector('[data-seccion="historial"]')).toBeNull();
    // Con gasto en algún período anterior, el historial vuelve.
    const conGasto = mostrar(
      conMeta({
        historial: [hist('2027-01-21', 10000, 2000)],
        historialResumen: { promedioGastado: 2000, periodosExcedidos: 0 },
      }),
    );
    expect(conGasto.querySelector('[data-seccion="historial"]')).not.toBeNull();
  });

  it('PRU-CMP-PRES-401 [CA-14.10] con meta, «$1,350.00 de $3,000.00 · 45 %» y el principal «Asignar $75.00» con el `falta` del DTO, a Asignar sin opción elegida', () => {
    const raiz = mostrar(conMeta());
    expect(sinEspacios(raiz.querySelector('[data-resumen-meta]'))).toContain(
      '$1,350.00 de $3,000.00 · 45%',
    );
    const nav = raiz.querySelector('nav[aria-label="Acciones de la categoría"]') as HTMLElement;
    const principal = enlace(nav, 'Asignar');
    expect(sinEspacios(principal)).toBe('Asignar $75.00');
    expect(principal?.getAttribute('href')).toBe(`/presupuesto/asignar/${ID}`);
    // El monto va una sola vez: la sección de la meta ya no repite el botón.
    expect(enlace(raiz.querySelector('[data-seccion="meta"]') as HTMLElement, 'Asignar')).toBe(
      undefined,
    );
    // Sin faltante, el principal vuelve a «Asignar» a secas.
    const cubierta = mostrar(dto());
    expect(sinEspacios(enlace(cubierta, 'Asignar'))).toBe('Asignar');
  });
});

describe('Detalle de categoría: cobertura de cada consumo (A6)', () => {
  it('PRU-CMP-PRES-320 [FT-14] (CH-223) la barrita de cada consumo dibuja el cubiertoBp del DTO y la nota dice los montos del DTO; cubierto entero, sin rayado', () => {
    const raiz = mostrar(
      dto({
        consumos: [
          consumo('2027-02-11', 'tarjeta', 2830, 2050, 7244),
          consumo('2027-02-12', 'tarjeta', 1000, 1000, 10_000),
        ],
      }),
    );
    const [parcial, entero] = [...raiz.querySelectorAll<HTMLElement>('[data-consumo]')];
    const barrita = (fila: HTMLElement | undefined) =>
      fila?.querySelector('[data-barrita-cobertura]') as HTMLElement;

    expect(sinEspacios(parcial?.querySelector('[data-nota-cobertura]'))).toBe(
      'cubierto $20.50 · no cubierto $7.80',
    );
    expect(parcial?.querySelector('[data-nota-cobertura]')?.className).toContain(
      'text-problema-texto',
    );
    expect(getComputedStyle(barrita(parcial)).height).toBe('5px');
    const cubierto = barrita(parcial).querySelector('[data-segmento="cubierto"]') as HTMLElement;
    expect(cubierto.style.width).toBe('72.44%');
    expect(cubierto.className).toContain('bg-texto-secundario');
    const sinCubrir = barrita(parcial).querySelector(
      '[data-segmento="no-cubierto"]',
    ) as HTMLElement;
    expect(getComputedStyle(sinCubrir).backgroundImage).toContain('repeating-linear-gradient');

    // Cubierto entero: la nota dice lo cubierto, como CA-14.1 (ver «Contradicciones» del PR), y la barrita va llena.
    expect(sinEspacios(entero?.querySelector('[data-nota-cobertura]'))).toBe('cubierto $10.00');
    expect(
      (barrita(entero).querySelector('[data-segmento="cubierto"]') as HTMLElement).style.width,
    ).toBe('100%');
    expect(barrita(entero).querySelector('[data-segmento="no-cubierto"]')).toBeNull();
  });
});

describe('PRU-CMP-CATEG entrega 4', () => {
  it('PRU-CMP-CATEG-731 [] el detalle de una archivada con Disponible muestra AV-14 y sus dos acciones, la meta en pausa y ningún «Eliminar»; «Archivar» en una activa con Disponible va deshabilitado con su motivo', async () => {
    const sacar = vi.fn(() =>
      Promise.resolve({ ok: true as const, valor: {}, yaAplicada: false, avisos: [] }),
    );
    const archivada = dto({
      categoria: { id: ID, nombre: 'Gimnasio', archivada: true },
      numeros: { ...ceros, entradas: 2500, disponible: 2500 },
      meta: { id: 'm', tipo: 'mensual', monto: 3000, falta: 0 },
      acciones: { ...acciones, puedeAsignar: false, puedeArchivar: false, puedeEliminar: false },
    });
    const nodo = document.createElement('div');
    document.body.append(nodo);
    const raizReact = createRoot(nodo);
    act(() => {
      raizReact.render(
        <PantallaDetalleCategoria dto={archivada} desarchivar={desarchivar} sacar={sacar} />,
      );
    });
    montados.push({ raiz: raizReact, nodo });
    const aviso = nodo.querySelector('[data-aviso="av-14"]') as HTMLElement;
    expect(sinEspacios(aviso)).toContain('Gimnasio está archivada y tiene $25.00');
    expect(boton(aviso, 'Sacar $25.00 a Listo para asignar')).toBeDefined();
    expect(enlace(aviso, 'Elegir destino y monto')).toBeDefined();
    expect(nodo.querySelector('[data-meta-pausa]')?.textContent).toBe(
      'En pausa: no pide dinero mientras Gimnasio esté archivada.',
    );
    expect(boton(nodo, 'Desarchivar')).toBeDefined();
    expect(nodo.textContent).not.toContain('Eliminar');

    const activa = await abrirMenu(
      dto({
        numeros: { ...ceros, disponible: 1000 },
        acciones: { ...acciones, bloqueosArchivo: ['disponible'], puedeArchivar: false },
      }),
    );
    const archivar = [...activa.querySelectorAll('[role="menuitem"], button, a')].find((x) =>
      x.textContent.includes('Archivar'),
    );
    expect(
      archivar?.getAttribute('aria-disabled') ?? archivar?.hasAttribute('disabled'),
    ).toBeTruthy();
    expect(activa.textContent).toContain(
      'No se puede archivar: tiene Disponible distinto de cero.',
    );
  });

  it('PRU-CMP-CATEG-711 [CA-E4-19] a 1440 px el historial pone el gráfico arriba y la tabla debajo, y la tabla no desborda su tarjeta', async () => {
    await page.viewport(1440, 900);
    const historial = [
      hist('2026-12-21', 12000, 9000),
      hist('2027-01-21', 12000, 14630),
      hist('2027-02-21', 12000, 11000),
    ];
    const raiz = mostrar(
      dto({ historial, historialResumen: { promedioGastado: 11543, periodosExcedidos: 1 } }),
    );
    const tarjeta = raiz.querySelector('[data-historial] [data-vista-grafico]') as HTMLElement;
    const tabla = [...tarjeta.querySelectorAll('[data-tabla-equivalente]')].at(-1) as HTMLElement;
    const grafico = tabla.parentElement?.previousElementSibling as Element;
    const caja = tarjeta.getBoundingClientRect();
    const tablaCaja = tabla.getBoundingClientRect();
    expect(tablaCaja.left).toBeGreaterThanOrEqual(caja.left);
    expect(tablaCaja.right).toBeLessThanOrEqual(caja.right);
    expect(tabla.scrollWidth).toBeLessThanOrEqual(tabla.clientWidth);
    // La tabla va debajo del gráfico, no a su lado.
    expect(tablaCaja.top).toBeGreaterThanOrEqual(grafico.getBoundingClientRect().bottom - 1);
  });

  it('PRU-CMP-CATEG-712 [CA-E4-16] un período cerrado dibuja el aviso «Período cerrado · fechas», sin Asignar, Mover dinero ni «Cubrir», con el cierre en pasado', () => {
    const periodo = { ...CERRADO };
    const raiz = mostrar(
      dto({
        periodo,
        navegacion: {},
        numeros: { ...ceros, asignado: 12000, gastado: 14630, disponible: -2630, fondo: 12000 },
        sobregiro: { tipo: 'debito', total: 2630, parteDebito: 2630, parteTarjeta: 0 },
      }),
    );
    const texto = sinEspacios(raiz);
    expect(texto).toContain('Período cerrado · 21/01 – 20/02/2027');
    expect(texto).toContain('No se puede cambiar lo asignado en un período cerrado.');
    expect(texto).toContain('Listo para asignar bajó');
    expect(enlace(raiz, 'Ir al período actual')?.getAttribute('href')).toBe(
      `/presupuesto/categorias/${ID}`,
    );
    for (const accion of ['Asignar', 'Mover dinero', 'Cubrir']) {
      expect(enlace(raiz, accion), accion).toBeUndefined();
    }
  });
});
