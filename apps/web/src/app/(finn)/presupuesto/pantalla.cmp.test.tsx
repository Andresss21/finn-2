import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { PresupuestoDto } from '@finn/aplicacion/consultas/presupuesto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../../app/globals.css';
import { PantallaPresupuesto } from './pantalla';

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

function montar(ui: ReactNode): HTMLElement {
  const nodo = document.createElement('div');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(ui);
  });
  montados.push({ raiz, nodo });
  return nodo;
}

const ACTIVO = {
  inicio: '2027-02-21',
  fin: '2027-03-20',
  dias: 28,
  estado: 'activo',
  transicion: false,
  diasTranscurridos: 1,
  diasRestantes: 27,
};
const fila = (id: string, nombre: string, extra: Record<string, unknown> = {}) => ({
  categoria: { id, nombre },
  orden: 1,
  asignado: 10000,
  gastado: 0,
  arrastre: 0,
  disponible: 10000,
  sobregiro: null,
  meta: null,
  clasificacion: 'cubierta',
  asignadoEsperado: 10000,
  barra: null,
  ...extra,
});
const pago = {
  tarjeta: { id: 'visa', nombre: 'Visa Oro' },
  categoria: { id: 'pago-visa', nombre: 'Visa Oro' },
  asignado: 0,
  actividad: 0,
  arrastre: 0,
  disponible: 0,
  faltaReservar: 1875,
  reservaExcedente: 0,
  pagoExcedente: null,
};

/** Un DTO de `presupuesto()` armado a mano: la pantalla solo dibuja lo que trae. */
const dto = (parcial: Record<string, unknown> = {}): PresupuestoDto =>
  ({
    revision: 'r1',
    hoy: '2027-02-21',
    periodoActivo: ACTIVO,
    notificacionesNoLeidas: 0,
    bandejaPorRevisar: 0,
    periodo: ACTIVO,
    navegacion: { anterior: '2027-01-21', siguiente: '2027-03-21' },
    lpa: 50000,
    enCamino: 0,
    lpaNegativo: false,
    grupos: [
      {
        grupo: { id: 'g1', nombre: 'Casa' },
        orden: 1,
        categorias: [fila('super', 'Super')],
        totales: { asignado: 10000, gastado: 0, disponible: 10000 },
      },
    ],
    pagosTarjeta: [pago],
    archivadasConDinero: [],
    totales: { asignado: 10000, gastado: 0, disponible: 10000 },
    ...parcial,
  }) as unknown as PresupuestoDto;

const hrefs = (nodo: HTMLElement): (string | null)[] =>
  [...nodo.querySelectorAll('a')].map((a) => a.getAttribute('href'));

describe('PRU-CMP-PRES', () => {
  it('PRU-CMP-PRES-103 [CA-09.2] un período cerrado es de solo lectura: sin asignar, mover ni auto-asignar, sin la franja de Listo para asignar y con el candado', () => {
    const cerrado = { ...ACTIVO, inicio: '2027-01-21', fin: '2027-02-20', estado: 'cerrado' };
    const n = montar(
      <PantallaPresupuesto
        dto={dto({
          periodo: cerrado,
          navegacion: { siguiente: '2027-02-21' },
          grupos: [
            {
              grupo: { id: 'g1', nombre: 'Casa' },
              orden: 1,
              categorias: [fila('super', 'Super', { disponible: -10000 })],
              totales: { asignado: 0, gastado: 0, disponible: -10000 },
            },
          ],
        })}
      />,
    );
    expect(n.querySelector('a[aria-label^="Asignar"]')).toBeNull();
    expect(hrefs(n).filter((h) => /asignar|mover/.test(h ?? ''))).toEqual([]);
    expect(n.querySelector('[data-resumen-lpa]')).toBeNull();
    expect(n.querySelector('[data-fila-categoria]')?.textContent).toContain('Período cerrado');
    expect(hrefs(n)).toContain('/presupuesto/categorias/super?periodo=2027-01-21');
  });

  it('PRU-CMP-PRES-103 el período activo enlaza a asignar, a mover y a auto-asignar; un futuro asigna y mueve, sin auto-asignar ni pagos de tarjeta', () => {
    const activo = montar(<PantallaPresupuesto dto={dto()} />);
    expect(hrefs(activo)).toEqual(
      expect.arrayContaining([
        '/presupuesto/asignar/super',
        '/presupuesto/mover',
        '/presupuesto/auto-asignar',
        '/presupuesto/listo-para-asignar',
        '/presupuesto/categorias/pago-visa',
      ]),
    );
    expect(activo.querySelector('[data-seccion="pagos-tarjeta"]')).not.toBeNull();

    const futuro = { ...ACTIVO, inicio: '2027-03-21', fin: '2027-04-20', estado: 'futuro' };
    const f = montar(
      <PantallaPresupuesto
        dto={dto({
          periodo: futuro,
          navegacion: { anterior: '2027-02-21', siguiente: '2027-04-21' },
        })}
      />,
    );
    expect(hrefs(f)).toEqual(
      expect.arrayContaining([
        '/presupuesto/asignar/super?periodo=2027-03-21',
        '/presupuesto/mover?periodo=2027-03-21',
      ]),
    );
    expect(hrefs(f)).not.toContain('/presupuesto/auto-asignar?periodo=2027-03-21');
    expect(f.querySelector('[data-seccion="pagos-tarjeta"]')).toBeNull();
  });

  it('PRU-CMP-PRES-103 [CA-09.6] una archivada con dinero aparece aparte con el enlace a sacar', () => {
    const n = montar(
      <PantallaPresupuesto
        dto={dto({ archivadasConDinero: [fila('gim', 'Gimnasio', { disponible: 2500 })] })}
      />,
    );
    const seccion = n.querySelector('[data-seccion="archivadas-con-dinero"]');
    expect(seccion?.textContent).toContain('Gimnasio');
    expect(seccion?.querySelector('a')?.getAttribute('href')).toBe(
      '/presupuesto/categorias/gim/sacar',
    );
    expect(n.querySelector('[data-fila-categoria="gim"]')).toBeNull();
  });

  it('PRU-CMP-PRES-103 sin categorías enlaza a la estructura; con un filtro sin filas dice "Ninguna categoría cumple este filtro" y ofrece quitar filtros', () => {
    const vacio = montar(<PantallaPresupuesto dto={dto({ grupos: [], pagosTarjeta: [] })} />);
    expect(vacio.querySelector('h2')?.textContent).toBe('Todavía no hay categorías');
    expect(hrefs(vacio)).toContain('/presupuesto/estructura');

    const filtrado = montar(
      <PantallaPresupuesto dto={dto({ grupos: [] })} filtro="sobregiradas" />,
    );
    expect(filtrado.textContent).toContain('Ninguna categoría cumple este filtro');
    const quitar = [...filtrado.querySelectorAll('a')].find(
      (a) => a.textContent === 'Quitar filtros',
    );
    expect(quitar?.getAttribute('href')).toBe('/presupuesto');
    expect(filtrado.querySelector('a[aria-current="true"]')?.textContent).toBe('Sobregiradas');
  });

  it('PRU-CMP-PRES-104 [CA-09.8, CA-09.9, CA-09.10] la pantalla dibuja la barra con los puntos básicos del DTO, sin recalcular, y el indicador de su sobregiro', () => {
    const sobregirada = (
      id: string,
      barra: Record<string, unknown>,
      tipo: 'debito' | 'mixto',
    ): ReturnType<typeof fila> =>
      fila(id, id, { disponible: -2630, clasificacion: 'sobregirada', sobregiro: { tipo }, barra });
    const n = montar(
      <PantallaPresupuesto
        dto={dto({
          grupos: [
            {
              grupo: { id: 'g1', nombre: 'Casa' },
              orden: 1,
              categorias: [
                sobregirada(
                  'ca-09-8',
                  { cubiertoBp: 8202, excedenteBp: 1798, tipoExcedente: 'debito' },
                  'debito',
                ),
                sobregirada(
                  'ca-09-9',
                  { cubiertoBp: 6667, excedenteBp: 3333, tipoExcedente: 'mixto' },
                  'mixto',
                ),
                sobregirada(
                  'ca-09-10',
                  { cubiertoBp: 0, excedenteBp: 10_000, tipoExcedente: 'debito' },
                  'debito',
                ),
              ],
              totales: { asignado: 0, gastado: 0, disponible: 0 },
            },
          ],
        })}
      />,
    );
    const segmentos = (id: string) =>
      [
        ...(n.querySelector(`[data-fila-categoria="${id}"]`)?.querySelectorAll('[data-segmento]') ??
          []),
      ].map((s) => [s.getAttribute('data-segmento'), (s as HTMLElement).style.width]);
    expect(segmentos('ca-09-8')).toEqual([
      ['cubierto', '82.02%'],
      ['excedente', '17.98%'],
    ]);
    expect(segmentos('ca-09-9')).toEqual([
      ['cubierto', '66.67%'],
      ['excedente', '33.33%'],
    ]);
    // Cubierto 0: no se dibuja un segmento vacío ni uno negativo.
    expect(segmentos('ca-09-10')).toEqual([['excedente', '100%']]);
    const estados = (id: string) =>
      [
        ...(n.querySelector(`[data-fila-categoria="${id}"]`)?.querySelectorAll('[data-estado]') ??
          []),
      ].map((e) => e.getAttribute('data-estado'));
    expect(
      n.querySelector('[data-fila-categoria="ca-09-8"] [data-barra]')?.getAttribute('data-barra'),
    ).toBe('debito');
    expect(
      n.querySelector('[data-fila-categoria="ca-09-9"] [data-barra]')?.getAttribute('data-barra'),
    ).toBe('mixto');
    expect(estados('ca-09-10')).toContain('problema');
    expect(estados('ca-09-9')).toEqual(expect.arrayContaining(['problema', 'deuda-sin-respaldo']));
  });

  it('PRU-CMP-PRES-104 [CA-09.11, CA-09.12] sin sobregiro la barra no trae excedente ni indicador, y con barra nula la fila no la dibuja', () => {
    const n = montar(
      <PantallaPresupuesto
        dto={dto({
          grupos: [
            {
              grupo: { id: 'g1', nombre: 'Casa' },
              orden: 1,
              categorias: [
                fila('ca-09-11', 'Devuelta', {
                  disponible: 0,
                  barra: { cubiertoBp: 10_000, excedenteBp: 0, tipoExcedente: null },
                }),
                fila('ca-09-12', 'Sin asignar', { asignado: 0, disponible: 0, barra: null }),
              ],
              totales: { asignado: 0, gastado: 0, disponible: 0 },
            },
          ],
        })}
      />,
    );
    const devuelta = n.querySelector('[data-fila-categoria="ca-09-11"]');
    expect(devuelta?.querySelector('[data-segmento="cubierto"]')).not.toBeNull();
    expect(devuelta?.querySelector('[data-segmento="excedente"]')).toBeNull();
    expect(devuelta?.querySelector('[data-estado="problema"]')).toBeNull();
    expect(devuelta?.querySelector('[data-barra]')?.getAttribute('data-barra')).toBe('dentro');
    const vacia = n.querySelector('[data-fila-categoria="ca-09-12"]');
    expect(vacia).not.toBeNull();
    expect(vacia?.querySelector('[data-barra]')).toBeNull();
  });

  it('PRU-CMP-PRES-103 el selector dice el período de transición con sus días', () => {
    const transicion = { ...ACTIVO, dias: 11, transicion: true };
    const n = montar(<PantallaPresupuesto dto={dto({ periodo: transicion })} />);
    expect(n.querySelector('[data-selector-periodo="transicion"]')?.textContent).toContain(
      'Período de transición, 11 días',
    );
  });
});
