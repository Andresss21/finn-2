import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { page } from 'vitest/browser';
import type { PresupuestoDto } from '@finn/aplicacion/consultas/presupuesto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../../../app/globals.css';
import { PantallaPresupuesto, type FiltroDeUrl } from './pantalla';

// C-47 (entrega «Estructura: colapsar y ordenar arrastrando · Presupuesto: colapsar», docs/anexos/finn-estructura/
// ESTRUCTURA-Y-COLAPSO.md §2): los grupos de usuario de `/presupuesto` se colapsan. Los montos del resumen salen de
// `grupos[].totales`: en estos DTO los totales NO son la suma de las filas, para que una suma en la interfaz se note (PF-3).
vi.mock('next/link', async () => {
  const { createElement } = await import('react');
  const Enlace = ({ href, children, ...resto }: { href: string; children?: ReactNode }) =>
    createElement('a', { href, ...resto }, children);
  return Object.assign(Enlace, { default: Enlace, useLinkStatus: () => ({ pending: false }) });
});

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const CLAVE = 'finn.colapsados.presupuesto';
const montados: { raiz: Root; nodo: HTMLElement }[] = [];
beforeEach(() => {
  localStorage.clear();
});
afterEach(async () => {
  await page.viewport(414, 896);
  for (const { raiz, nodo } of montados.splice(0)) {
    act(() => {
      raiz.unmount();
    });
    nodo.remove();
  }
  localStorage.clear();
});

const ACTIVO = {
  inicio: '2026-09-21',
  fin: '2026-10-20',
  dias: 30,
  estado: 'activo',
  transicion: false,
  diasTranscurridos: 25,
  diasRestantes: 5,
};
const fila = (id: string, nombre: string, extra: Record<string, unknown> = {}) => ({
  categoria: { id, nombre },
  orden: 1,
  asignado: 0,
  gastado: 0,
  arrastre: 0,
  disponible: 0,
  sobregiro: null,
  meta: null,
  clasificacion: 'cubierta',
  asignadoEsperado: 0,
  barra: null,
  ...extra,
});
const meta = (falta: number) => ({ tipo: 'monto', pedido: 10000, falta, estado: 'en_curso' });

/** Los grupos de A.7 que toca C-47, con los totales que trae el DTO. */
const A7 = {
  revision: 'r1',
  hoy: '2026-10-15',
  periodoActivo: ACTIVO,
  notificacionesNoLeidas: 0,
  bandejaPorRevisar: 0,
  periodo: ACTIVO,
  navegacion: { anterior: '2026-08-21', siguiente: '2026-10-21' },
  lpa: 31240,
  enCamino: 4000,
  lpaNegativo: false,
  grupos: [
    {
      grupo: { id: 'casa', nombre: 'Casa' },
      orden: 1,
      categorias: [
        fila('super', 'Supermercado', { disponible: 6285, meta: meta(0) }),
        fila('luz', 'Luz y agua', { disponible: 660 }),
      ],
      totales: { asignado: 47235, gastado: 40290, disponible: 6945 },
    },
    {
      grupo: { id: 'comida', nombre: 'Comida fuera' },
      orden: 2,
      categorias: [
        fila('resta', 'Restaurantes', {
          disponible: -1,
          sobregiro: { tipo: 'debito', monto: 1 },
          clasificacion: 'sobregirada',
        }),
      ],
      totales: { asignado: 12000, gastado: 14630, disponible: -2630 },
    },
    {
      grupo: { id: 'transporte', nombre: 'Transporte' },
      orden: 3,
      categorias: [
        fila('gasolina', 'Gasolina', {
          disponible: -1,
          sobregiro: { tipo: 'tarjeta', monto: 1 },
          clasificacion: 'sobregirada',
        }),
      ],
      totales: { asignado: 8000, gastado: 9875, disponible: -1875 },
    },
    {
      grupo: { id: 'ahorro', nombre: 'Ahorro' },
      orden: 4,
      categorias: [
        fila('emergencia', 'Fondo de emergencia', { disponible: 1, meta: meta(5000) }),
        fila('viaje', 'Viaje', { disponible: 1, meta: meta(2000) }),
      ],
      totales: { asignado: 10000, gastado: 0, disponible: 153462 },
    },
  ],
  pagosTarjeta: [
    {
      tarjeta: { id: 'visa', nombre: 'Visa Oro' },
      categoria: { id: 'pago-visa', nombre: 'Visa Oro' },
      asignado: 0,
      actividad: 0,
      arrastre: 0,
      disponible: 1875,
      faltaReservar: 1875,
      reservaExcedente: 0,
      pagoExcedente: null,
    },
  ],
  archivadasConDinero: [],
  totales: { asignado: 99784, gastado: 64795, disponible: 178451 },
} as unknown as PresupuestoDto;

function montar(filtro?: FiltroDeUrl): HTMLElement {
  const nodo = document.createElement('div');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(<PantallaPresupuesto dto={A7} {...(filtro === undefined ? {} : { filtro })} />);
  });
  montados.push({ raiz, nodo });
  return nodo;
}

const seccion = (n: HTMLElement, id: string) => n.querySelector(`[data-seccion="${id}"]`);
/** El botón del encabezado del grupo: su nombre accesible es el nombre del grupo. */
const flecha = (n: HTMLElement, id: string) =>
  seccion(n, id)?.querySelector<HTMLButtonElement>('h2 button[aria-expanded]') ?? null;
const resumen = (n: HTMLElement, id: string) =>
  seccion(n, id)?.querySelector<HTMLElement>('[data-resumen-grupo]') ?? null;
const visible = (e: Element | null | undefined) =>
  e !== null && e !== undefined && e.getBoundingClientRect().height > 0;
const anuncio = (n: HTMLElement) =>
  n.querySelector('[role="status"][data-anuncio="presupuesto"]')?.textContent;
const tocar = (b: HTMLElement | null) => {
  act(() => {
    b?.click();
  });
};
const token = (nombre: string): string => {
  const sonda = document.createElement('i');
  sonda.style.color = `var(${nombre})`;
  document.body.append(sonda);
  const color = getComputedStyle(sonda).color;
  sonda.remove();
  return color;
};
const color = (e: Element | null | undefined) => getComputedStyle(e as Element).color;
/** El texto que se ve, sin lo que es solo para el lector (`.sr-only`). */
const loVisible = (e: Element | null | undefined): string => {
  const copia = e?.cloneNode(true) as Element | undefined;
  for (const s of copia?.querySelectorAll('.sr-only') ?? []) s.remove();
  return (copia?.textContent ?? '').replace(/\s+/g, ' ').trim();
};
const guardado = (): unknown => JSON.parse(localStorage.getItem(CLAVE) ?? 'null');

describe('PRU-CMP-PRES colapsar grupos (C-47)', () => {
  it('PRU-CMP-PRES-343 [C-47] CA-P-1: en el teléfono, colapsar Comida fuera deja «1 categoría», −$26.30 en --problema-texto, «Asignado $120.00 · Gastado $146.30» y su aviso, con los montos de grupos[].totales', () => {
    const n = montar();
    const boton = flecha(n, 'comida');
    expect(boton?.textContent).toBe('Comida fuera');
    expect(boton?.getAttribute('aria-expanded')).toBe('true');
    expect(Math.round(boton?.getBoundingClientRect().height ?? 0)).toBeGreaterThanOrEqual(44);
    expect(resumen(n, 'comida')).toBeNull();

    tocar(boton);
    expect(boton?.getAttribute('aria-expanded')).toBe('false');
    expect(anuncio(n)).toBe('Colapsaste Comida fuera.');
    expect(guardado()).toEqual(['comida']);
    expect(n.querySelector('[data-fila-categoria="resta"]')).toBeNull();
    const r = resumen(n, 'comida');
    expect(visible(r)).toBe(true);
    expect(r?.tagName).toBe('BUTTON');
    expect(r?.getAttribute('aria-expanded')).toBe('false');
    expect(r?.querySelector('[data-resumen-cantidad]')?.textContent).toBe('1 categoría');
    const disponible = r?.querySelector('[data-resumen-disponible] [data-centavos]');
    expect(disponible?.getAttribute('data-centavos')).toBe('-2630');
    expect(disponible?.textContent).toContain('−$26.30');
    expect(color(disponible)).toBe(token('--problema-texto'));
    const montos = r?.querySelector<HTMLElement>('[data-resumen-montos]');
    expect(loVisible(montos)).toBe(
      'Asignado $120.00 · Gastado $146.30',
    );
    expect(
      [...(montos?.querySelectorAll('[data-centavos]') ?? [])].map((e) =>
        e.getAttribute('data-centavos'),
      ),
    ).toEqual(['12000', '14630']);
    expect(r?.querySelector('[data-resumen-avisos]')?.textContent).toBe(
      'Sobregiro con débito o efectivo',
    );

    // Tocar el resumen lo expande otra vez.
    tocar(r);
    expect(boton?.getAttribute('aria-expanded')).toBe('true');
    expect(anuncio(n)).toBe('Expandiste Comida fuera.');
    expect(n.querySelector('[data-fila-categoria="resta"]')).not.toBeNull();
    expect(guardado()).toEqual([]);
  });

  it('PRU-CMP-PRES-344 [C-47] CA-P-2: Ahorro colapsado muestra $1,534.62 y «Falta para la meta · 2 categorías»; Transporte, −$18.75 en --deuda-sin-respaldo-texto; «Meta cubierta» no se repite', () => {
    localStorage.setItem(CLAVE, JSON.stringify(['ahorro', 'transporte', 'casa', 'ya-no-existe']));
    const n = montar();
    const ahorro = resumen(n, 'ahorro');
    expect(ahorro?.querySelector('[data-resumen-cantidad]')?.textContent).toBe('2 categorías');
    expect(
      ahorro?.querySelector('[data-resumen-disponible] [data-centavos]')?.getAttribute('data-centavos'),
    ).toBe('153462');
    expect(ahorro?.querySelector('[data-resumen-disponible]')?.textContent).toContain('$1,534.62');
    expect(
      color(ahorro?.querySelector('[data-resumen-disponible] [data-centavos]')),
    ).toBe(token('--positivo-texto'));
    expect(ahorro?.querySelector('[data-resumen-avisos]')?.textContent).toBe(
      'Falta para la meta · 2 categorías',
    );
    const transporte = resumen(n, 'transporte')?.querySelector('[data-resumen-disponible] [data-centavos]');
    expect(color(transporte)).toBe(token('--deuda-sin-respaldo-texto'));
    expect(resumen(n, 'transporte')?.textContent).toContain('Deuda sin reservar');
    const casa = resumen(n, 'casa');
    expect(casa?.querySelector('[data-resumen-cantidad]')?.textContent).toBe('2 categorías');
    expect(casa?.textContent).not.toContain('Meta cubierta');
    expect(casa?.querySelector('[data-resumen-avisos]')).toBeNull();
  });

  it('PRU-CMP-PRES-345 [C-47] CA-P-3: en computadora, Comida fuera colapsado lleva $120.00, $146.30 y −$26.30 en las columnas Asignado, Gastado y Disponible, con «· 1 categoría» y su aviso', async () => {
    await page.viewport(1100, 800);
    localStorage.setItem(CLAVE, JSON.stringify(['comida']));
    const n = montar();
    expect(visible(resumen(n, 'comida'))).toBe(false);
    const cabecera = seccion(n, 'casa')?.parentElement?.querySelector('[aria-hidden="true"]');
    const rotulos = [...(cabecera?.children ?? [])];
    expect(rotulos.map((r) => r.textContent)).toEqual([
      'Categoría',
      'Asignado',
      'Gastado',
      'Disponible',
    ]);
    const columnas = seccion(n, 'comida')?.querySelector('[data-columnas-grupo]');
    const celda = (c: string) => columnas?.querySelector(`[data-columna="${c}"]`);
    const derecha = (e: Element | null | undefined) =>
      Math.round(e?.getBoundingClientRect().right ?? -1);
    for (const [i, c, centavos] of [
      [1, 'asignado', '12000'],
      [2, 'gastado', '14630'],
      [3, 'disponible', '-2630'],
    ] as const) {
      expect(celda(c)?.querySelector('[data-centavos]')?.getAttribute('data-centavos')).toBe(
        centavos,
      );
      expect(visible(celda(c))).toBe(true);
      expect(derecha(celda(c))).toBe(derecha(rotulos[i]));
    }
    expect(color(celda('disponible')?.querySelector('[data-centavos]'))).toBe(
      token('--problema-texto'),
    );
    expect(seccion(n, 'comida')?.querySelector('[data-cantidad-grupo]')?.textContent).toBe(
      '· 1 categoría',
    );
    expect(visible(seccion(n, 'comida')?.querySelector('[data-avisos-grupo]'))).toBe(true);
    // Abierto, la fila del grupo lleva solo la flecha, el nombre y «· {n} categorías».
    expect(seccion(n, 'casa')?.querySelector('[data-columnas-grupo]')).toBeNull();
    expect(visible(seccion(n, 'casa')?.querySelector('[data-cantidad-grupo]'))).toBe(true);
  });

  it('PRU-CMP-PRES-346 [C-47] CA-P-4: con el filtro «Sobregiradas» los grupos se ven abiertos y sin flecha, sin «Colapsar todos»; al volver a «Todas» regresa lo guardado', () => {
    localStorage.setItem(CLAVE, JSON.stringify(['comida']));
    const filtrada = montar('sobregiradas');
    expect(filtrada.querySelector('button[aria-expanded]')).toBeNull();
    expect(resumen(filtrada, 'comida')).toBeNull();
    expect(filtrada.querySelector('[data-fila-categoria="resta"]')).not.toBeNull();
    expect(filtrada.textContent).not.toContain('Colapsar todos');
    expect(guardado()).toEqual(['comida']);

    const todas = montar();
    expect(flecha(todas, 'comida')?.getAttribute('aria-expanded')).toBe('false');
    expect(todas.querySelector('[data-fila-categoria="resta"]')).toBeNull();
  });

  it('PRU-CMP-PRES-347 [C-47] «Colapsar todos» y «Expandir todos» con su anuncio; Pagos de tarjeta no se colapsa; CA-P-5: la clave es propia y no toca la de Estructura', () => {
    localStorage.setItem('finn.colapsados.estructura', JSON.stringify(['casa']));
    const n = montar();
    const todos = () =>
      [...n.querySelectorAll('button')].find((b) => /^(Colapsar|Expandir) todos$/.test(b.textContent));
    expect(todos()?.textContent).toBe('Colapsar todos');
    expect(Math.round(todos()?.getBoundingClientRect().height ?? 0)).toBeGreaterThanOrEqual(44);
    tocar(todos() ?? null);
    for (const id of ['casa', 'comida', 'transporte', 'ahorro']) {
      expect(flecha(n, id)?.getAttribute('aria-expanded')).toBe('false');
    }
    expect(anuncio(n)).toBe('Colapsaste todos los grupos.');
    expect(todos()?.textContent).toBe('Expandir todos');
    expect(guardado()).toEqual(['casa', 'comida', 'transporte', 'ahorro']);
    expect(seccion(n, 'pagos-tarjeta')?.querySelector('button[aria-expanded]')).toBeNull();
    expect(n.querySelector('[data-fila-pago="visa"]')).not.toBeNull();

    // Con un grupo abierto vuelve a decir «Colapsar todos».
    tocar(flecha(n, 'ahorro'));
    expect(todos()?.textContent).toBe('Colapsar todos');
    tocar(flecha(n, 'ahorro'));
    tocar(todos() ?? null);
    expect(anuncio(n)).toBe('Expandiste todos los grupos.');
    expect(guardado()).toEqual([]);
    expect(localStorage.getItem('finn.colapsados.estructura')).toBe(JSON.stringify(['casa']));
  });
});
