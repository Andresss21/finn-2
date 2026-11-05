import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { DetalleLpaDto } from '@finn/aplicacion/consultas/detalle-lpa';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../../../app/globals.css';
import { PantallaListoParaAsignar } from './pantalla';

// `next/link` necesita `process` y el enrutador de Next, que el navegador de prueba no tiene: se simula `next/link`, nunca
// `enlace-finn`, que otras suites importan de verdad (`vitest list` no limpia los mocks de cada sesión del navegador).
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

const periodo = (inicio: string, fin: string) => ({
  inicio,
  fin,
  dias: 28,
  estado: 'cerrado',
  transicion: false,
});
const BASE = {
  lpa: 67000,
  lpaNegativo: false,
  descomposicion: {
    entradas: { ingresos: 100000, otrasEntradas: 500000, restituciones: 0, saldosIniciales: 0 },
    asignadoPeriodosCerrados: 19000,
    asignadoPeriodoActivo: 31000,
    asignadoPeriodosFuturos: 0,
    reduccionesSobregiroDebito: 2000,
    reduccionesPagoExcedente: 0,
    enCamino: 0,
  },
  reduccionProyectadaAlCierre: { total: 0, categorias: [], tarjetas: [] },
  historial: [
    { periodo: periodo('2027-01-21', '2027-02-20'), lpaAlCierre: 50000 },
    { periodo: periodo('2027-02-21', '2027-03-20'), lpaAlCierre: -1500 },
  ],
  notaHistorial: 'sin_adelantos',
} as const;
const dto = (extra: Record<string, unknown> = {}) =>
  ({ ...BASE, ...extra }) as unknown as DetalleLpaDto;
const monto = (nodo: HTMLElement, etiqueta: string) =>
  [...nodo.querySelectorAll('dl > div')]
    .find((f) => f.querySelector('dt')?.textContent === etiqueta)
    ?.querySelector('[data-centavos]')
    ?.getAttribute('data-centavos');

describe('PRU-CMP-PRES', () => {
  it('PRU-CMP-PRES-106 la descomposición dibuja cada línea del DTO con su etiqueta, sin recalcular, y enlaza de vuelta al presupuesto', () => {
    const nodo = montar(<PantallaListoParaAsignar dto={dto()} />);
    expect(nodo.querySelector('h1')?.textContent).toBe('Listo para asignar');
    expect(monto(nodo, 'Ingresos')).toBe('100000');
    expect(monto(nodo, 'Otras entradas')).toBe('500000');
    expect(monto(nodo, 'Asignado en el período actual')).toBe('31000');
    expect(monto(nodo, 'Reducciones por sobregiro con débito')).toBe('2000');
    expect(nodo.querySelector('a[href="/presupuesto"]')).not.toBeNull();
    expect(nodo.querySelector('[data-estado="problema"]')).toBeNull();
    expect(nodo.querySelector('[data-en-camino]')).toBeNull();
  });

  it('PRU-CMP-PRES-106 con LPA negativo avisa AV-20 y con dinero en camino AV-09', () => {
    const nodo = montar(
      <PantallaListoParaAsignar
        dto={dto({
          lpa: -2000,
          lpaNegativo: true,
          descomposicion: { ...BASE.descomposicion, enCamino: 4500 },
        })}
      />,
    );
    expect(nodo.querySelector('[data-estado="problema"]')?.textContent).toContain(
      'Asignaste más de lo que tenés',
    );
    expect(nodo.querySelector('[data-en-camino]')?.textContent).toContain('En camino');
  });

  it('PRU-CMP-PRES-106 la reducción proyectada lista sus categorías y tarjetas; sin reducción lo dice', () => {
    const con = montar(
      <PantallaListoParaAsignar
        dto={dto({
          reduccionProyectadaAlCierre: {
            total: 7000,
            categorias: [{ categoria: { id: 'c1', nombre: 'Salidas' }, monto: 5000 }],
            tarjetas: [{ tarjeta: { id: 't1', nombre: 'Visa Oro' }, monto: 2000 }],
          },
        })}
      />,
    );
    const seccion = con.querySelector('[data-seccion="reduccion"]');
    expect(seccion?.textContent).toContain('Salidas');
    expect(seccion?.textContent).toContain('Visa Oro');
    expect(
      seccion
        ?.querySelector('[data-reduccion-total] [data-centavos]')
        ?.getAttribute('data-centavos'),
    ).toBe('7000');
    const sin = montar(<PantallaListoParaAsignar dto={dto()} />);
    expect(sin.querySelector('[data-seccion="reduccion"]')?.textContent).toContain(
      'Nada va a reducir Listo para asignar',
    );
  });

  it('PRU-CMP-PRES-106 el historial trae el gráfico, su tabla equivalente con los mismos valores y la nota de B-4', () => {
    const nodo = montar(<PantallaListoParaAsignar dto={dto()} />);
    expect(nodo.querySelector('svg[role="img"][data-grafico="lineas"]')).not.toBeNull();
    const filas = [...nodo.querySelectorAll('[data-tabla-equivalente] tbody tr')];
    expect(
      filas.map((f) => f.querySelector('[data-centavos]')?.getAttribute('data-centavos')),
    ).toEqual(['50000', '-1500']);
    expect(nodo.querySelector('[data-nota-historial="sin_adelantos"]')?.textContent).toContain(
      'sin contar lo asignado por adelantado',
    );
  });

  it('PRU-CMP-PRES-106 el selector Gráfico / Tabla del historial cambia a la tabla sin sacar el gráfico del árbol [FE-44]', () => {
    const nodo = montar(<PantallaListoParaAsignar dto={dto()} />);
    const historial = nodo.querySelector('[data-seccion="historial"]') as HTMLElement;
    const opciones = [
      ...historial.querySelectorAll<HTMLElement>('[role="radiogroup"] [role="radio"]'),
    ];
    expect(opciones.map((o) => o.textContent)).toEqual(['Gráfico', 'Tabla']);
    expect(
      historial.querySelector('[data-vista-grafico]')?.getAttribute('data-vista-grafico'),
    ).toBe('grafico');
    act(() => {
      opciones[1]?.click();
    });
    expect(
      historial.querySelector('[data-vista-grafico]')?.getAttribute('data-vista-grafico'),
    ).toBe('tabla');
    expect(
      historial.querySelector('[data-tabla-equivalente]')?.parentElement?.className,
    ).not.toContain('sr-only');
    expect(historial.querySelector('svg[role="img"]')?.parentElement?.className).toContain(
      'sr-only',
    );
  });

  it('PRU-CMP-PRES-106 sin períodos cerrados el historial dice que no hay ninguno y conserva la nota', () => {
    const nodo = montar(<PantallaListoParaAsignar dto={dto({ historial: [] })} />);
    expect(nodo.querySelector('[data-seccion="historial"]')?.textContent).toContain(
      'Todavía no hay períodos cerrados',
    );
    expect(nodo.querySelector('[data-grafico]')).toBeNull();
    expect(nodo.querySelector('[data-nota-historial]')).not.toBeNull();
  });

  it('PRU-CMP-PRES-260 el billete lleva la acción de Inicio: «Asignar» con LPA positivo, «Quitar … de una categoría» con negativo y ninguna con cero', () => {
    const accion = (n: HTMLElement) =>
      n.querySelector('[data-resumen-lpa="billete"] a')?.textContent ?? null;
    expect(accion(montar(<PantallaListoParaAsignar dto={dto()} />))).toBe('Asignar $670.00');
    expect(
      accion(montar(<PantallaListoParaAsignar dto={dto({ lpa: -8615, lpaNegativo: true })} />)),
    ).toBe('Quitar $86.15 de una categoría');
    expect(accion(montar(<PantallaListoParaAsignar dto={dto({ lpa: 0 })} />))).toBeNull();
  });

  it('PRU-CMP-PRES-261 la descomposición y la reducción van cada una en su tarjeta con el título como rótulo', () => {
    const nodo = montar(<PantallaListoParaAsignar dto={dto()} />);
    for (const seccion of ['descomposicion', 'reduccion']) {
      const s = nodo.querySelector(`[data-seccion="${seccion}"]`) as HTMLElement;
      expect(s.className).toContain('bg-superficie');
      expect(s.querySelector('h2')?.className).toContain('text-rotulo');
    }
  });
});
