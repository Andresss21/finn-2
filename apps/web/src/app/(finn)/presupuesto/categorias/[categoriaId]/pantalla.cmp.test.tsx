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
/** La × de la píldora del día elegido (C-52 §4). */
const quitarDia = (raiz: HTMLElement) =>
  raiz.querySelector<HTMLButtonElement>('button[aria-label="Quitar el filtro del día"]') ??
  undefined;
/** Dentro del marco, que dibuja la barra superior, la navegación y «Más acciones». */
const enMarco = (d: DetalleCategoriaDto): HTMLElement => {
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
  return nodo;
};
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
    // C-52 §7: todos los días son botones; los que no tienen gasto, deshabilitados.
    const botones = [
      ...raiz.querySelectorAll('[data-calendario] button[data-dia]:not([disabled])'),
    ];
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
    expect(botones[1]?.getAttribute('aria-label')).toBe('jueves 25 de feb, gastaste $40.00');
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

  it('PRU-CMP-PRES-105 [CA-14.4] tocar un día deja solo sus consumos y la × de la píldora los devuelve', () => {
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
      quitarDia(raiz)?.click();
    });
    expect(raiz.querySelectorAll('[data-consumo]')).toHaveLength(2);
  });

  it('PRU-CMP-PRES-105 [CA-14.1] los consumos salen en el orden del DTO dado vuelta, del más nuevo al más viejo, con su medio, lo cubierto y lo no cubierto', () => {
    const consumos = [
      consumo('2027-02-10', 'debito', 6000, 6000),
      consumo('2027-02-10', 'tarjeta', 7000, 4000, 5714),
    ];
    const raiz = mostrar(dto({ consumos }));
    const filas = [...raiz.querySelectorAll('[data-consumo]')].map((f) => sinEspacios(f));
    expect(filas).toEqual([
      expect.stringMatching(/Visa · tarjeta.*cubierto \$40\.00 · no cubierto \$30\.00.*\$70\.00$/),
      expect.stringMatching(/Ahorro · débito.*cubierto \$60\.00.*\$60\.00$/),
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
    expect(raiz.querySelector('[data-seccion="historial"] h3')?.textContent).toBe(
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

  it('PRU-CMP-PRES-105 [CA-14.6] con sobregiro mixto el encabezado nombra los dos indicadores sin montos y el aviso trae los montos de cada parte', () => {
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
    // C-52 §6: mixto es un solo aviso de problema, con las dos partes y sin botón.
    const desglose = sinEspacios(raiz.querySelector('[data-sobregiro="mixto"]'));
    expect(desglose).toContain('Sobregiro con débito o efectivo · $50.00');
    expect(desglose).toContain(
      'Con débito $20.00 · con tarjeta $30.00. Al cerrar el período, Listo para asignar bajará $20.00.',
    );
    expect(raiz.querySelectorAll('[data-sobregiro="mixto"] :is(a, button)')).toHaveLength(0);
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
    expect(cubrir?.getAttribute('href')).toBe(
      `/presupuesto/asignar/${ID}?volver=${encodeURIComponent(`/presupuesto/categorias/${ID}`)}`,
    );
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
    expect(insignias).toEqual(['mar01', 'feb05']);
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

  it('PRU-CMP-PRES-243 [CA-14.1] en el orden de C-52: cifras, sobregiro, acciones, «¿En qué se fue?» con el historial y después los consumos', () => {
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
      'nav[aria-label="Acciones de la categoría"]',
      '[data-seccion="historial"]',
      '[data-seccion="consumos"]',
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
    // C-52: en el teléfono el historial es la segunda vista de «¿En qué se fue?».
    act(() => {
      vacia.querySelector<HTMLButtonElement>('[role="radio"][value="historial"]')?.click();
    });
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
    expect(principal?.getAttribute('href')).toBe(
      `/presupuesto/asignar/${ID}?volver=${encodeURIComponent(`/presupuesto/categorias/${ID}`)}`,
    );
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
    const [entero, parcial] = [...raiz.querySelectorAll<HTMLElement>('[data-consumo]')];
    const barrita = (fila: HTMLElement | undefined) =>
      fila?.querySelector('[data-barrita-cobertura]') as HTMLElement;

    expect(sinEspacios(parcial?.querySelector('[data-nota-cobertura]'))).toBe(
      'cubierto $20.50 · no cubierto $7.80',
    );
    // C-52 §4: lo no cubierto de una tarjeta va en `--deuda-sin-respaldo-texto` (con débito, `--problema-texto`).
    expect(parcial?.querySelector('[data-nota-cobertura]')?.className).toContain(
      'text-deuda-sin-respaldo-texto',
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

  it('PRU-CMP-CATEG-733 [CA-E4-15] en un período cerrado «Más acciones» no ofrece «Mover dinero» ni «Archivar» y conserva Editar, Fusionar con otra y Eliminar', async () => {
    const menu = await abrirMenu(
      dto({ periodo: CERRADO, navegacion: {}, acciones: { ...acciones, puedeAsignar: false } }),
    );
    expect(accion(menu, 'Mover dinero')).toBeUndefined();
    expect(accion(menu, 'Archivar')).toBeUndefined();
    for (const x of ['Editar', 'Fusionar', 'Eliminar']) expect(accion(menu, x), x).toBeDefined();
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
    // Sin el marco no hay contenedor de computadora: la vista «Últimos 3» muestra el historial.
    act(() => {
      raiz.querySelector<HTMLButtonElement>('[role="radio"][value="historial"]')?.click();
    });
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

describe('PRU-CMP-PRES-806 encabezado del detalle sin encimar', () => {
  const seEncimanVerticalmente = (a: DOMRect, b: DOMRect): boolean =>
    a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5;

  it.each([
    [390, 'Compras a plazo'],
    [390, 'Compras a plazo con la tarjeta de crédito del banco'],
    [1280, 'Compras a plazo'],
    [1280, 'Compras a plazo con la tarjeta de crédito del banco'],
  ])(
    'PRU-CMP-PRES-806 [FT-14] en %i px con «%s», el grupo, el título y el rótulo «Disponible» no se pisan, mientras los bloques entran y después: el título va en el encabezado de la página, entre el grupo y «Disponible»',
    async (ancho, nombre) => {
      await page.viewport(ancho, 844);
      const nodo = enMarco(
        dto({ categoria: { id: ID, nombre }, grupo: { id: 'g', nombre: 'Deudas' } }),
      );
      const encabezado = nodo.querySelector('main header') as HTMLElement;
      const grupo = encabezado.querySelector('p') as HTMLElement;
      const h1 = encabezado.querySelector('h1') as HTMLElement;
      const disponible = [...encabezado.querySelectorAll('p')].find(
        (p) => p.textContent === 'Disponible',
      ) as HTMLElement;
      const revisar = (): void => {
        const g = grupo.getBoundingClientRect();
        const titulo = h1.getBoundingClientRect();
        const d = disponible.getBoundingClientRect();
        // C-52 §2.2: en el teléfono el nombre ya no va en la barra fija, sino debajo del grupo (título de 1.75 rem).
        expect(titulo.top).toBeGreaterThanOrEqual(g.bottom - 0.5);
        expect(d.top).toBeGreaterThanOrEqual(titulo.bottom - 0.5);
        expect(getComputedStyle(h1).fontSize).toBe('28px');
        expect(seEncimanVerticalmente(titulo, d)).toBe(false);
        expect(seEncimanVerticalmente(titulo, g)).toBe(false);
      };
      // Recién montada, los bloques de C5 están entrando; después, con las animaciones terminadas.
      revisar();
      for (const animacion of document.getAnimations()) animacion.finish();
      revisar();
    },
  );
});

describe('PRU-CMP-PRES detalle de categoría «Un recorrido» (C-52)', () => {
  /** 15 días seguidos del período activo, del 22/02 al 08/03, en tres semanas. */
  const QUINCE = [
    ...['22', '23', '24', '25', '26', '27', '28'].map((d) => `2027-02-${d}`),
    ...['01', '02', '03', '04', '05', '06', '07', '08'].map((d) => `2027-03-${d}`),
  ];
  /** Salidas con 45 consumos (3 por día, dos con débito y uno con tarjeta), en el orden del DTO. */
  const salidas = () =>
    dto({
      hoy: '2027-03-16',
      categoria: { id: ID, nombre: 'Salidas' },
      consumos: QUINCE.flatMap((f) => [
        consumo(f, 'debito', 100, 100),
        consumo(f, 'tarjeta', 200, 200),
        consumo(f, 'debito', 300, 300),
      ]),
      calendario: QUINCE.map((f) => ({ fecha: f, gastado: 600, intensidadBp: 5000 })),
    });
  const semanas = (raiz: HTMLElement) => [...raiz.querySelectorAll<HTMLElement>('[data-semana]')];
  const botonSemana = (s: HTMLElement) => s.querySelector('button[aria-expanded]') as HTMLElement;
  const expandidas = (raiz: HTMLElement) =>
    semanas(raiz).map((s) => botonSemana(s).getAttribute('aria-expanded'));
  const ficha = (raiz: HTMLElement, texto: string) =>
    [...raiz.querySelectorAll<HTMLElement>('[aria-label="Filtrar consumos"] [role="radio"]')].find(
      (x) => x.textContent === texto,
    );
  const anuncio = (raiz: HTMLElement) =>
    raiz.querySelector('[data-anuncio-detalle]')?.textContent ?? '';
  const restaurantes = () =>
    dto({
      categoria: { id: ID, nombre: 'Restaurantes' },
      numeros: { ...ceros, asignado: 12000, gastado: 14630, fondo: 12000, disponible: -2630 },
      sobregiro: { tipo: 'debito', total: 2630, parteTarjeta: 0, parteDebito: 2630 },
      consumos: [
        consumo('2027-02-23', 'debito', 4210, 4210),
        consumo('2027-02-24', 'tarjeta', 2560, 2560),
        consumo('2027-02-26', 'debito', 875, 875),
        consumo('2027-02-27', 'debito', 2305, 2305),
        consumo('2027-02-28', 'debito', 2830, 2050, 7244),
        consumo('2027-03-01', 'debito', 1850, 0, 0),
      ],
    });

  it('PRU-CMP-PRES-812 [FT-14] CA-D-1: en el teléfono, ← y ⋯ en la barra; grupo, nombre y selector; Disponible; cifras; meta; «¿En qué se fue?»; consumos; programadas y reglas; y la barra de acciones fija al pie, sobre la navegación, con su alto reservado', async () => {
    await page.viewport(390, 844);
    const nodo = enMarco(
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
        consumos: [consumo('2027-02-23', 'debito', 1000, 1000)],
        calendario: [{ fecha: '2027-02-23', gastado: 1000, intensidadBp: 10000 }],
        historial: [hist('2027-01-21', 10000, 9000)],
        historialResumen: { promedioGastado: 9000, periodosExcedidos: 0 },
        reglas: [{ id: 'r1', patron: 'PIZZA HUT' }],
        programadas: [
          { programada: { id: 'p1', nombre: 'Netflix' }, monto: 1500, proxima: '2027-03-05' },
        ],
      }),
    );
    await vi.waitFor(() => {
      expect(
        nodo.querySelector('header[data-marco-barra] [aria-label="Más acciones"]'),
      ).not.toBeNull();
    });
    const barra = nodo.querySelector('header[data-marco-barra]') as HTMLElement;
    expect(barra.querySelector('a[aria-label="Volver a Presupuesto"]')).not.toBeNull();
    expect(barra.querySelector('h1')).toBeNull();
    for (const animacion of document.getAnimations()) animacion.finish();
    const visible = (q: string) =>
      [...nodo.querySelectorAll<HTMLElement>(q)].find((x) => x.getBoundingClientRect().height > 0);
    const orden = [
      'main header p',
      'main header h1',
      '[data-selector-periodo]',
      '[data-disponible]',
      '[data-numeros]',
      '[data-seccion="meta"]',
      '[data-seccion="en-que-se-fue"]',
      '[data-seccion="consumos"]',
      '[data-programadas-y-reglas]',
    ].map((q) => visible(q)?.getBoundingClientRect().top ?? -1);
    expect(orden.every((y) => y >= 0)).toBe(true);
    expect([...orden].sort((a, b) => a - b)).toEqual(orden);
    const dia = nodo.querySelector('[data-dia="2027-02-23"]') as HTMLElement;
    expect(dia.getBoundingClientRect().width).toBeGreaterThanOrEqual(44);
    expect(sinEspacios(visible('[data-programadas-y-reglas]'))).toContain('Próxima: 05/03');

    const acciones = nodo.querySelector(
      'nav[aria-label="Acciones de la categoría"]',
    ) as HTMLElement;
    const navegacion = nodo.querySelector('nav[data-marco-barra]') as HTMLElement;
    expect(getComputedStyle(acciones).position).toBe('fixed');
    expect(acciones.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      navegacion.getBoundingClientRect().top + 0.5,
    );
    expect(getComputedStyle(nodo.querySelector('main') as HTMLElement).paddingBottom).toBe('88px');
    expect([...acciones.querySelectorAll('a')].map((a) => sinEspacios(a))).toEqual([
      'Asignar $75.00',
      'Mover dinero',
    ]);
  });

  it('PRU-CMP-PRES-813 [FT-14] CA-D-2: con 45 consumos van del más reciente al más antiguo por semana, solo la más reciente abierta, y cada semana dice «{n} consumos» sin ningún monto', () => {
    const raiz = mostrar(salidas());
    expect(semanas(raiz).map((s) => s.getAttribute('data-semana'))).toEqual([
      '2027-03-08',
      '2027-03-01',
      '2027-02-22',
    ]);
    const textos = (s: HTMLElement) =>
      [...botonSemana(s).querySelectorAll('span:not([aria-hidden])')]
        .map((x) => x.textContent)
        .join(' ');
    expect(semanas(raiz).map(textos)).toEqual([
      '8–14 mar 3 consumos',
      '1–7 mar 21 consumos',
      '22–28 feb 21 consumos',
    ]);
    expect(semanas(raiz).every((s) => !botonSemana(s).textContent.includes('$'))).toBe(true);
    expect(expandidas(raiz)).toEqual(['true', 'false', 'false']);
    // Dentro de cada semana, del más reciente al más antiguo; lo cerrado no se alcanza con el teclado.
    const segunda = semanas(raiz)[1] as HTMLElement;
    expect(segunda.querySelector('[data-consumo]')?.getAttribute('data-consumo')).toBe(
      '2027-03-07',
    );
    expect(segunda.querySelector('[data-plegable]')?.hasAttribute('inert')).toBe(true);
    expect(raiz.querySelector('[data-seccion="consumos"] [data-cuantos]')?.textContent).toBe('45');
  });

  it('PRU-CMP-PRES-814 [FT-14] CA-D-3: abrir otra semana la abre con la transición de alto y gira su flecha; cambiar de filtro y volver a «Todos» la deja abierta', () => {
    const raiz = mostrar(salidas());
    const segunda = semanas(raiz)[1] as HTMLElement;
    act(() => {
      botonSemana(segunda).click();
    });
    expect(expandidas(raiz)).toEqual(['true', 'true', 'false']);
    const plegable = segunda.querySelector('[data-plegable]') as HTMLElement;
    expect(plegable.hasAttribute('inert')).toBe(false);
    expect(getComputedStyle(plegable).transitionProperty).toContain('grid-template-rows');
    expect(getComputedStyle(plegable).transitionDuration).toBe('0.22s');
    expect(segunda.querySelector('button [aria-hidden="true"]')?.className).toContain('rotate-180');
    act(() => {
      ficha(raiz, 'Débito')?.click();
    });
    expect(expandidas(raiz)).toEqual(['true', 'true', 'true']);
    act(() => {
      ficha(raiz, 'Todos · 45')?.click();
    });
    expect(expandidas(raiz)).toEqual(['true', 'true', 'false']);
  });

  it('PRU-CMP-PRES-815 [FT-14] CA-D-4: con 10 consumos o menos todas las semanas abiertas; con un día elegido, también', () => {
    const pocos = mostrar(
      dto({
        consumos: QUINCE.slice(0, 10).map((f) => consumo(f, 'debito', 100, 100)),
        calendario: QUINCE.slice(0, 10).map((f) => ({
          fecha: f,
          gastado: 100,
          intensidadBp: 10000,
        })),
      }),
    );
    expect(expandidas(pocos)).toEqual(['true', 'true']);
    const muchos = mostrar(salidas());
    act(() => {
      muchos.querySelector<HTMLButtonElement>('[data-dia="2027-02-24"]')?.click();
    });
    expect(expandidas(muchos)).toEqual(['true']);
  });

  it('PRU-CMP-PRES-816 [FT-14] CA-D-5: tocar el 5 de marzo lo invierte y agranda su punto, muestra la píldora «Viernes 5 de mar» con ×, deja solo ese día, baja suave hasta la lista y anuncia «Consumos del 5 de mar»; la × o el mismo día los devuelven', () => {
    const baja = vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => undefined);
    const raiz = mostrar(salidas());
    const dia = raiz.querySelector('[data-dia="2027-03-05"]') as HTMLButtonElement;
    act(() => {
      dia.click();
    });
    expect(dia.getAttribute('aria-pressed')).toBe('true');
    expect(dia.className).toContain('bg-texto');
    expect(dia.querySelector('span[style]')?.className).toContain('scale-[1.15]');
    const pildora = raiz.querySelector('[data-dia-elegido]') as HTMLElement;
    expect(sinEspacios(pildora)).toBe('Viernes 5 de mar');
    expect(pildora.className).toContain('bg-texto');
    expect(quitarDia(raiz)).toBeDefined();
    expect(
      [...raiz.querySelectorAll('[data-consumo]')].map((x) => x.getAttribute('data-consumo')),
    ).toEqual(['2027-03-05', '2027-03-05', '2027-03-05']);
    expect(baja).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    expect(baja.mock.contexts[0]).toBe(raiz.querySelector('[data-seccion="consumos"]'));
    expect(anuncio(raiz)).toBe('Consumos del 5 de mar');

    act(() => {
      quitarDia(raiz)?.click();
    });
    expect(raiz.querySelector('[data-dia-elegido]')).toBeNull();
    expect(raiz.querySelectorAll('[data-consumo]')).toHaveLength(45);
    expect(anuncio(raiz)).toBe('Todos los consumos del período');
    act(() => {
      dia.click();
    });
    act(() => {
      dia.click();
    });
    expect(dia.getAttribute('aria-pressed')).toBe('false');
    expect(raiz.querySelectorAll('[data-consumo]')).toHaveLength(45);
    baja.mockRestore();
  });

  it('PRU-CMP-PRES-817 [FT-14] CA-D-6: un día sin gasto es un botón deshabilitado que dice «…, sin gasto»', () => {
    const raiz = mostrar(salidas());
    const domingo = raiz.querySelector('[data-dia="2027-02-21"]') as HTMLButtonElement;
    expect(domingo.tagName).toBe('BUTTON');
    expect(domingo.disabled).toBe(true);
    expect(domingo.getAttribute('aria-label')).toBe('domingo 21 de feb, sin gasto');
    expect(domingo.querySelector('span[style]')).toBeNull();
  });

  it('PRU-CMP-PRES-818 [FT-14] CA-D-7: con sobregiro con débito el aviso de problema va sin botón, el principal es «Cubrir $26.30» a Asignar, hay «No cubiertos · 2» y la línea del orden de cobertura va encima de la lista', () => {
    const raiz = mostrar(restaurantes());
    const aviso = raiz.querySelector(
      '[data-sobregiro="debito"] [data-aviso-en-linea]',
    ) as HTMLElement;
    expect(aviso.getAttribute('data-estado')).toBe('problema');
    expect(sinEspacios(aviso)).toContain('Sobregiro con débito o efectivo · $26.30');
    expect(aviso.querySelectorAll('a, button')).toHaveLength(0);
    const acciones = raiz.querySelector(
      'nav[aria-label="Acciones de la categoría"]',
    ) as HTMLElement;
    const principal = acciones.querySelector('a') as HTMLElement;
    expect(sinEspacios(principal)).toBe('Cubrir $26.30');
    expect(principal.getAttribute('href')).toBe(
      `/presupuesto/asignar/${ID}?volver=${encodeURIComponent(`/presupuesto/categorias/${ID}`)}`,
    );
    expect(ficha(raiz, 'No cubiertos · 2')).toBeDefined();
    const linea = raiz.querySelector('[data-orden-cobertura]') as HTMLElement;
    expect(linea.textContent).toBe(
      'Lo asignado cubre los consumos del más antiguo al más reciente: los últimos son los que quedaron sin cubrir.',
    );
    const primera = semanas(raiz)[0] as HTMLElement;
    expect(linea.compareDocumentPosition(primera) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0);
    act(() => {
      ficha(raiz, 'No cubiertos · 2')?.click();
    });
    expect(raiz.querySelectorAll('[data-consumo]')).toHaveLength(2);
    expect(anuncio(raiz)).toBe('No cubiertos · 2');
  });

  it('PRU-CMP-PRES-819 [FT-14] CA-D-8: con sobregiro con tarjeta el aviso es «Deuda sin reservar en Ropa · $45.00» con `card` en `--deuda-sin-respaldo-texto`, y el principal es «Cubrir $45.00»', () => {
    const raiz = mostrar(
      dto({
        categoria: { id: ID, nombre: 'Ropa' },
        numeros: { ...ceros, disponible: -4500 },
        sobregiro: { tipo: 'tarjeta', total: 4500, parteTarjeta: 4500, parteDebito: 0 },
        consumos: [consumo('2027-02-24', 'tarjeta', 9000, 4500, 5000)],
      }),
    );
    const aviso = raiz.querySelector(
      '[data-sobregiro="tarjeta"] [data-aviso-en-linea]',
    ) as HTMLElement;
    expect(sinEspacios(aviso.querySelector('.fz-aviso-titulo'))).toBe(
      'Deuda sin reservar en Ropa · $45.00',
    );
    expect(sinEspacios(aviso)).toContain('Esta deuda suma a lo que te falta reservar para Visa.');
    const glifo = aviso.querySelector('.fz-aviso-glifo') as HTMLElement;
    expect(glifo.className).toContain('text-deuda-sin-respaldo-texto');
    expect(glifo.querySelector('[data-icono="card"]')).not.toBeNull();
    expect(aviso.querySelectorAll('a, button')).toHaveLength(0);
    const acciones = raiz.querySelector(
      'nav[aria-label="Acciones de la categoría"]',
    ) as HTMLElement;
    expect(sinEspacios(acciones.querySelector('a'))).toBe('Cubrir $45.00');
  });

  it('PRU-CMP-PRES-820 [FT-14] CA-D-9: en el período cerrado, el aviso «Período cerrado · fechas» con «Ir al período actual», sin barra de acciones, el calendario sin hoy ni días futuros y › al período actual', () => {
    const raiz = mostrar(
      dto({
        periodo: CERRADO,
        navegacion: { anterior: '2026-12-21', siguiente: '2027-02-21' },
        consumos: [consumo('2027-01-25', 'debito', 1000, 1000)],
        calendario: [{ fecha: '2027-01-25', gastado: 1000, intensidadBp: 10000 }],
      }),
    );
    const aviso = [...raiz.querySelectorAll<HTMLElement>('[data-aviso-en-linea]')].find((x) =>
      x.textContent.includes('Período cerrado'),
    ) as HTMLElement;
    expect(aviso.getAttribute('data-estado')).toBe('informacion');
    expect(sinEspacios(aviso.querySelector('.fz-aviso-titulo'))).toBe(
      'Período cerrado · 21/01 – 20/02/2027',
    );
    expect(enlace(aviso, 'Ir al período actual')?.getAttribute('href')).toBe(
      `/presupuesto/categorias/${ID}`,
    );
    expect(
      [...raiz.querySelectorAll('a')].filter((a) => a.textContent === 'Ir al período actual'),
    ).toHaveLength(1);
    expect(raiz.querySelector('nav[aria-label="Acciones de la categoría"]')).toBeNull();
    const dias = [...raiz.querySelectorAll<HTMLElement>('[data-calendario] [data-dia]')];
    expect(dias).toHaveLength(31);
    expect(dias.some((d) => d.className.includes('ring-enlace'))).toBe(false);
    expect(dias.some((d) => d.className.includes('text-texto-terciario'))).toBe(false);
    expect(raiz.querySelector('a[aria-label="Período siguiente"]')?.getAttribute('href')).toBe(
      `/presupuesto/categorias/${ID}`,
    );
  });

  it('PRU-CMP-PRES-821 [FT-14] CA-D-10: «Archivar» está en Más acciones y no al pie; con Disponible distinto de cero, deshabilitado con su motivo', async () => {
    const menu = await abrirMenu(
      dto({
        numeros: { ...ceros, disponible: 5000 },
        acciones: { ...acciones, puedeArchivar: false, bloqueosArchivo: ['disponible'] },
      }),
    );
    const archivar = accion(menu, 'Archivar') as HTMLElement;
    expect(archivar.getAttribute('aria-disabled')).toBe('true');
    expect(archivar.textContent).toContain(
      'No se puede archivar: tiene Disponible distinto de cero.',
    );
    const main = document.querySelector('main[data-detalle-categoria]') as HTMLElement;
    expect(main.textContent).not.toContain('Archivar');
  });

  it('PRU-CMP-PRES-822 [FT-14] CA-D-11: a 1440 px la columna izquierda de 380 px queda fija con las acciones; a la derecha calendario e historial lado a lado, sin el control, y abajo los consumos; «Más acciones» con texto', async () => {
    await page.viewport(1440, 900);
    const nodo = enMarco(
      dto({
        consumos: [consumo('2027-02-23', 'debito', 1000, 1000)],
        calendario: [{ fecha: '2027-02-23', gastado: 1000, intensidadBp: 10000 }],
        historial: [hist('2027-01-21', 10000, 9000), hist('2026-12-21', 10000, 12000)],
        historialResumen: { promedioGastado: 10500, periodosExcedidos: 1 },
        reglas: [{ id: 'r1', patron: 'PIZZA HUT' }],
      }),
    );
    await vi.waitFor(() => {
      expect(
        nodo.querySelector('header[data-marco-barra] [aria-label="Más acciones"]'),
      ).not.toBeNull();
    });
    for (const animacion of document.getAnimations()) animacion.finish();
    const izquierda = nodo.querySelector('[data-columna="izquierda"]') as HTMLElement;
    expect(getComputedStyle(izquierda).position).toBe('sticky');
    expect(izquierda.getBoundingClientRect().width).toBe(380);
    const acciones = izquierda.querySelector(
      'nav[aria-label="Acciones de la categoría"]',
    ) as HTMLElement;
    expect(getComputedStyle(acciones).position).toBe('static');
    expect(
      izquierda.querySelector('[data-programadas-y-reglas]')?.getBoundingClientRect().height,
    ).toBeGreaterThan(0);
    const calendario = (
      nodo.querySelector('[data-seccion="calendario"]') as HTMLElement
    ).getBoundingClientRect();
    const historial = (
      nodo.querySelector('[data-seccion="historial"]') as HTMLElement
    ).getBoundingClientRect();
    const consumos = (
      nodo.querySelector('[data-seccion="consumos"]') as HTMLElement
    ).getBoundingClientRect();
    expect(calendario.left).toBeGreaterThanOrEqual(izquierda.getBoundingClientRect().right + 39);
    expect(Math.abs(calendario.top - historial.top)).toBeLessThan(1);
    // Lado a lado, cada día sigue siendo un tocable de 44 × 44.
    const dia = nodo.querySelector('[data-dia="2027-02-23"]') as HTMLElement;
    expect(dia.getBoundingClientRect().width).toBeGreaterThanOrEqual(44);
    expect(dia.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    expect(historial.left).toBeGreaterThanOrEqual(calendario.right);
    expect(consumos.top).toBeGreaterThanOrEqual(Math.max(calendario.bottom, historial.bottom));
    expect(
      (
        nodo.querySelector('[role="radiogroup"][aria-label="Ver"]') as HTMLElement
      ).getBoundingClientRect().height,
    ).toBe(0);
    expect(
      nodo.querySelector('header[data-marco-barra] [aria-label="Más acciones"]')?.textContent,
    ).toContain('Más acciones');
  });

  it('PRU-CMP-PRES-823 [FT-14] CA-D-13: «Últimos 6» muestra el historial con el promedio y «Se pasó 2 de 6» con `dang`, y las barras en que se pasó van en `--problema-texto`', () => {
    const seis = Array.from({ length: 6 }, (_, k) =>
      hist(`2026-0${String(k + 3)}-21`, 10000, k === 1 || k === 3 ? 11000 : 9000),
    );
    const raiz = mostrar(
      dto({ historial: seis, historialResumen: { promedioGastado: 9667, periodosExcedidos: 2 } }),
    );
    const vista = raiz.querySelector('[role="radiogroup"][aria-label="Ver"]') as HTMLElement;
    expect([...vista.querySelectorAll('[role="radio"]')].map((x) => x.textContent)).toEqual([
      'Este período',
      'Últimos 6',
    ]);
    const panel = raiz.querySelector('[data-seccion="historial"]') as HTMLElement;
    expect(getComputedStyle(panel).display).toBe('none');
    act(() => {
      vista.querySelector<HTMLButtonElement>('[value="historial"]')?.click();
    });
    expect(getComputedStyle(panel).display).toBe('flex');
    expect(
      getComputedStyle(raiz.querySelector('[data-seccion="calendario"]') as HTMLElement).display,
    ).toBe('none');
    const sePaso = panel.querySelector('[data-se-paso]') as HTMLElement;
    expect(sePaso.textContent).toBe('Se pasó 2 de 6');
    expect(sePaso.parentElement?.querySelector('[data-icono="dang"]')).not.toBeNull();
    expect(panel.querySelector('[data-centavos="9667"]')).not.toBeNull();
    expect(panel.querySelectorAll('svg .fill-problema-texto')).toHaveLength(2);
  });

  it('PRU-CMP-PRES-824 [FT-14] CA-D-15: el calendario es un grupo con nombre, los filtros y la vista son radios, las semanas llevan `aria-expanded`, y se anuncian la entrada, el filtro y el cambio de período', () => {
    const nodo = document.createElement('div');
    document.body.append(nodo);
    const raiz = createRoot(nodo);
    act(() => {
      raiz.render(<PantallaDetalleCategoria dto={salidas()} desarchivar={desarchivar} />);
    });
    montados.push({ raiz, nodo });
    expect(anuncio(nodo)).toBe('Detalle de Salidas');
    expect(nodo.querySelectorAll('[role="status"]')).toHaveLength(1);
    expect(nodo.querySelector('[data-calendario]')?.getAttribute('role')).toBe('group');
    expect(nodo.querySelector('[data-calendario]')?.getAttribute('aria-label')).toBe(
      'Días del período',
    );
    const filtros = nodo.querySelector(
      '[role="radiogroup"][aria-label="Filtrar consumos"]',
    ) as HTMLElement;
    expect([...filtros.querySelectorAll('[role="radio"]')].map((x) => x.textContent)).toEqual([
      'Todos · 45',
      'Débito',
      'Tarjeta',
    ]);
    expect(nodo.querySelectorAll('[data-semana] > button[aria-expanded]')).toHaveLength(3);
    act(() => {
      ficha(nodo, 'Tarjeta')?.click();
    });
    expect(anuncio(nodo)).toBe('Tarjeta');
    expect(ficha(nodo, 'Tarjeta')?.getAttribute('aria-checked')).toBe('true');
    act(() => {
      raiz.render(
        <PantallaDetalleCategoria
          dto={dto({ categoria: { id: ID, nombre: 'Salidas' }, periodo: CERRADO })}
          desarchivar={desarchivar}
        />,
      );
    });
    expect(anuncio(nodo)).toBe('Período 21/01 – 20/02/2027, cerrado');
    act(() => {
      raiz.render(
        <PantallaDetalleCategoria
          dto={dto({ categoria: { id: ID, nombre: 'Salidas' } })}
          desarchivar={desarchivar}
        />,
      );
    });
    expect(anuncio(nodo)).toBe('Período actual: 21/02 – 20/03/2027');
  });

  it('PRU-CMP-PRES-825 [FT-14] CA-D-16: sin consumos, «Sin gastos en este período» en lugar de la lista y sin filtros, el calendario sin puntos y el historial con sus 3 períodos', () => {
    const raiz = mostrar(
      dto({
        categoria: { id: ID, nombre: 'Regalos' },
        historial: [
          hist('2026-11-21', 5000, 0),
          hist('2026-12-21', 5000, 4000),
          hist('2027-01-21', 5000, 0),
        ],
        historialResumen: { promedioGastado: 1333, periodosExcedidos: 0 },
      }),
    );
    const seccion = raiz.querySelector('[data-seccion="consumos"]') as HTMLElement;
    expect(seccion.textContent).toContain('Sin gastos en este período');
    expect(seccion.querySelector('[data-semana]')).toBeNull();
    expect(raiz.querySelector('[aria-label="Filtrar consumos"]')).toBeNull();
    expect(raiz.querySelector('[data-orden-cobertura]')).toBeNull();
    expect(raiz.querySelectorAll('[data-calendario] [data-dia] span[style]')).toHaveLength(0);
    expect(
      raiz.querySelectorAll('[data-calendario] button[data-dia]:not([disabled])'),
    ).toHaveLength(0);
    expect(
      raiz.querySelectorAll('[data-seccion="historial"] [data-historial] tbody tr'),
    ).toHaveLength(3);
  });

  it('PRU-CMP-PRES-826 [FT-14] CA-D-15: con sobregiro, filtros, la línea del orden y una semana plegada, la pantalla no tiene violaciones de accesibilidad', async () => {
    const raiz = mostrar(restaurantes());
    act(() => {
      raiz.querySelector<HTMLButtonElement>('[data-semana] button')?.click();
    });
    const resultado = await axe.run(raiz, { rules: { 'color-contrast': { enabled: false } } });
    expect(
      resultado.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.html).join(' | ')}`),
    ).toEqual([]);
  });
});

describe('PRU-CMP-PRES movimiento del detalle de categoría (C-52 §8)', () => {
  const ms = (valor: string): number => Math.round(Number(valor.replace('s', '')) * 1000);
  const estilo = (el: Element | null | undefined) => getComputedStyle(el as Element);
  /** Las reglas de estilo de la página, también las que van dentro de `@media`. */
  const reglasCss = (): CSSStyleRule[] => {
    const recorrer = (lista: CSSRuleList): CSSStyleRule[] =>
      [...lista].flatMap((r) =>
        r instanceof CSSStyleRule ? [r] : r instanceof CSSGroupingRule ? recorrer(r.cssRules) : [],
      );
    return [...document.styleSheets].flatMap((h) => {
      try {
        return recorrer(h.cssRules);
      } catch {
        return [];
      }
    });
  };
  const completo = (parcial: Record<string, unknown> = {}) =>
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
      consumos: [consumo('2027-02-23', 'debito', 1000, 1000)],
      calendario: [{ fecha: '2027-02-23', gastado: 1000, intensidadBp: 10000 }],
      historial: Array.from({ length: 6 }, (_, k) =>
        hist(`2026-0${String(k + 3)}-21`, 10000, k === 1 ? 11000 : 9000),
      ),
      historialResumen: { promedioGastado: 9167, periodosExcedidos: 1 },
      reglas: [{ id: 'r1', patron: 'PIZZA HUT' }],
      ...parcial,
    });

  it('PRU-CMP-PRES-831 [FT-14] CA-D-12: el nombre y el Disponible del encabezado llevan `cat-nombre-{id}` y `cat-disp-{id}`, la pantalla declara el viaje y no se desliza entera; cada sección sube y aparece 40 ms después de la anterior y la barra de acciones 120 ms después del encabezado', async () => {
    await page.viewport(390, 844);
    const nodo = enMarco(completo());
    const nombre = nodo.querySelector('main header h1 [data-viaje]') as HTMLElement;
    expect(nombre.textContent).toBe('Super');
    expect(nombre.style.viewTransitionName).toBe(`cat-nombre-${ID}`);
    const disponible = nodo.querySelector('[data-disponible] [data-viaje]') as HTMLElement;
    expect(disponible.style.viewTransitionName).toBe(`cat-disp-${ID}`);
    expect(disponible.querySelector('[data-centavos="135000"]')).not.toBeNull();
    expect(nodo.querySelector('main style[data-permitir-viaje]')).not.toBeNull();
    expect(estilo(nodo.querySelector('main')).animationName).toBe('none');
    const visible = (q: string) =>
      [...nodo.querySelectorAll<HTMLElement>(q)].find((x) => x.getBoundingClientRect().height > 0);
    const secciones = [
      nodo.querySelector('main header > div'),
      nodo.querySelector('[data-selector-periodo]')?.parentElement,
      nodo.querySelector('[data-disponible]'),
      nodo.querySelector('[data-numeros]'),
      nodo.querySelector('[data-seccion="meta"]'),
      nodo.querySelector('[data-seccion="en-que-se-fue"]'),
      nodo.querySelector('[data-seccion="consumos"]'),
      visible('[data-programadas-y-reglas]'),
    ];
    expect(secciones.map((s) => estilo(s).animationName)).toEqual(Array(8).fill('fz-item'));
    expect(secciones.map((s) => ms(estilo(s).animationDelay))).toEqual([
      0, 40, 80, 120, 160, 200, 240, 280,
    ]);
    expect(secciones.every((s) => ms(estilo(s).animationDuration) === 220)).toBe(true);
    expect(estilo(secciones[0]).animationTimingFunction).toBe('cubic-bezier(0.2, 0.9, 0.25, 1)');
    const barra = nodo.querySelector('nav[aria-label="Acciones de la categoría"]');
    expect(estilo(barra).animationName).toBe('fz-item');
    expect(ms(estilo(barra).animationDelay)).toBe(120);
    // «Más acciones» del detalle sube 8 px y aparece, en `--duracion-rapida`.
    const menu = reglasCss().find(
      (r) =>
        r.selectorText.includes('main[data-detalle-categoria]') &&
        r.selectorText.includes('.fz-menu'),
    );
    expect(menu?.style.getPropertyValue('animation-name')).toBe('fz-item');
    // Terminada la entrada, nada queda corrido: la barra fija sigue en su lugar.
    for (const animacion of document.getAnimations()) animacion.finish();
    expect(estilo(barra).transform).toBe('none');
  });

  it('PRU-CMP-PRES-832 [FT-14] cambiar de período con ‹ › vuelve a hacer la entrada (las secciones se montan de nuevo) y la región de estado se queda para anunciar el período', () => {
    const nodo = document.createElement('div');
    document.body.append(nodo);
    const raiz = createRoot(nodo);
    act(() => {
      raiz.render(<PantallaDetalleCategoria dto={completo()} desarchivar={desarchivar} />);
    });
    montados.push({ raiz, nodo });
    const antes = nodo.querySelector('[data-numeros]');
    const anuncio = nodo.querySelector('[data-anuncio-detalle]');
    for (const animacion of document.getAnimations()) animacion.finish();
    act(() => {
      raiz.render(
        <PantallaDetalleCategoria
          dto={completo({ periodo: CERRADO, navegacion: { siguiente: '2027-02-21' } })}
          desarchivar={desarchivar}
        />,
      );
    });
    const despues = nodo.querySelector('[data-numeros]') as HTMLElement;
    expect(despues).not.toBe(antes);
    expect(despues.getAnimations().map((a) => (a as CSSAnimation).animationName)).toContain(
      'fz-item',
    );
    expect(nodo.querySelector('[data-anuncio-detalle]')).toBe(anuncio);
    expect(anuncio?.textContent).toBe('Período 21/01 – 20/02/2027, cerrado');
  });

  it('PRU-CMP-PRES-833 [FT-14] CA-D-13: las barras del historial crecen desde la base en 400 ms, 30 ms entre barras, la primera vez que se ven; al volver a «Últimos 6» ya están dibujadas', () => {
    const raiz = mostrar(completo());
    const panel = raiz.querySelector('[data-seccion="historial"]') as HTMLElement;
    const vista = raiz.querySelector('[role="radiogroup"][aria-label="Ver"]') as HTMLElement;
    const elegir = (valor: string) => {
      act(() => {
        vista.querySelector<HTMLButtonElement>(`[value="${valor}"]`)?.click();
      });
    };
    elegir('historial');
    expect(panel.getAttribute('data-barras')).toBe('crecen');
    const barras = [...panel.querySelectorAll('.fz-barra-sube')];
    expect(barras).toHaveLength(6);
    expect(estilo(barras[0]).animationName).toBe('fz-barup');
    expect(ms(estilo(barras[0]).animationDuration)).toBe(400);
    expect(barras.map((b) => ms(estilo(b).animationDelay))).toEqual([0, 30, 60, 90, 120, 150]);
    elegir('periodo');
    elegir('historial');
    expect(panel.getAttribute('data-barras')).toBe('quietas');
    expect(estilo(panel.querySelector('.fz-barra-sube')).animationName).toBe('none');
  });

  it('PRU-CMP-PRES-834 [FT-14] CA-D-14: con movimiento reducido no hay entrada, viaje ni crecimiento (la regla global los anula y el viaje no se declara) y elegir un día baja de una vez', () => {
    const anula = reglasCss().find(
      (r) =>
        r.parentRule instanceof CSSMediaRule &&
        r.parentRule.conditionText.includes('prefers-reduced-motion: reduce') &&
        r.selectorText.includes('*'),
    );
    expect(anula?.style.getPropertyValue('animation-name')).toBe('none');
    expect(anula?.style.getPropertyPriority('animation-name')).toBe('important');
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (consulta: string) =>
        ({
          matches: consulta.includes('reduce'),
          media: consulta,
          addEventListener: () => undefined,
          removeEventListener: () => undefined,
        }) as unknown as MediaQueryList,
    );
    const baja = vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => undefined);
    const raiz = mostrar(completo());
    expect(raiz.querySelector('style[data-permitir-viaje]')?.textContent).toContain(
      'prefers-reduced-motion: no-preference',
    );
    act(() => {
      raiz.querySelector<HTMLButtonElement>('[data-dia="2027-02-23"]')?.click();
    });
    expect(baja).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' });
    baja.mockRestore();
    vi.restoreAllMocks();
  });
});
