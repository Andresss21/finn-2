// FT-24 Actividad (07 §17: un texto, un estado o el foco de un componente es una CMP). La pantalla solo dibuja lo que trae el DTO de
// `actividad()` (04 §6.7.1): los números salen del motor (PF-3). La búsqueda con espera de 300 ms (CA-24.6) usa los temporizadores
// simulados de Vitest, nunca el reloj de pared (07 §7.1).
import axe from 'axe-core';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { ActividadDto } from '@finn/aplicacion/consultas/actividad';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../../globals.css';
import Cargando from './loading';
import { PantallaActividad, type FiltrosActividad } from './pantalla';

// Solo el límite externo: `next/link` y `next/navigation` necesitan el enrutador de Next, que el navegador de prueba no tiene.
vi.mock('next/link', async () => {
  const { createElement } = await import('react');
  const Enlace = ({ href, children, ...resto }: { href: string; children?: ReactNode }) =>
    createElement('a', { href, ...resto }, children);
  return Object.assign(Enlace, { default: Enlace, useLinkStatus: () => ({ pending: false }) });
});
const reemplazo = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({
  usePathname: () => '/actividad',
  useRouter: () => ({ replace: reemplazo }),
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const montados: { raiz: Root; nodo: HTMLElement }[] = [];
beforeEach(() => {
  vi.useFakeTimers();
  reemplazo.mockClear();
});
afterEach(() => {
  vi.useRealTimers();
  for (const { raiz, nodo } of montados.splice(0)) {
    act(() => {
      raiz.unmount();
    });
    nodo.remove();
  }
});

const MARCAS = {
  porCobrar: false,
  conDevoluciones: false,
  conciliada: false,
  programada: false,
  periodoCerrado: false,
};
const fila = (id: string, tipo: string, comercio: string | null, presentado: number) => ({
  id,
  fecha: '2027-02-10',
  tipo,
  cuentas: [],
  comercio,
  total: Math.abs(presentado),
  montoPresentado: presentado,
  lineas: [],
  estadoBancario: 'confirmada',
  origen: 'manual',
  marcas: MARCAS,
});
const dto = (dias: { fecha: string; transacciones: unknown[] }[], siguienteCursor?: string) =>
  ({
    revision: 'r1',
    hoy: '2027-02-21',
    periodoActivo: {
      inicio: '2027-02-21',
      fin: '2027-03-20',
      dias: 28,
      estado: 'activo',
      transicion: false,
      diasTranscurridos: 0,
      diasRestantes: 28,
    },
    notificacionesNoLeidas: 0,
    bandejaPorRevisar: 0,
    dias,
    ...(siguienteCursor === undefined ? {} : { siguienteCursor }),
  }) as unknown as ActividadDto;

const CUENTAS = [{ id: 'k1', nombre: 'Ahorro' }];
const GRUPOS = [{ nombre: 'Casa', categorias: [{ id: 'c1', nombre: 'Cafés' }] }];
const mostrar = (d: ActividadDto, filtros: FiltrosActividad = {}): HTMLElement => {
  document.body.style.cssText = 'background: var(--fondo); color: var(--texto)';
  const nodo = document.createElement('div');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(<PantallaActividad dto={d} filtros={filtros} cuentas={CUENTAS} grupos={GRUPOS} />);
  });
  montados.push({ raiz, nodo });
  return nodo;
};
const escribir = (campo: HTMLInputElement, texto: string) => {
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(campo, texto);
    campo.dispatchEvent(new Event('input', { bubbles: true }));
  });
};
const pasar = (ms: number) => {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
};

describe('PRU-CMP-TX-400 actividad', () => {
  it('PRU-CMP-TX-400 [CA-24.5] un gasto, un ingreso y una transferencia se ven con monto presentado negativo, positivo y $0.00', () => {
    const raiz = mostrar(
      dto([
        {
          fecha: '2027-02-10',
          transacciones: [
            fila('t1', 'gasto', 'Super', -4500),
            fila('t2', 'ingreso', 'Sueldo', 100000),
            fila('t3', 'transferencia', null, 0),
          ],
        },
      ]),
    );
    const monto = (id: string) =>
      raiz
        .querySelector(`[data-fila-transaccion="${id}"] [data-centavos]`)
        ?.getAttribute('data-centavos');
    expect(monto('t1')).toBe('-4500');
    expect(monto('t2')).toBe('100000');
    expect(monto('t3')).toBe('0');
    expect(raiz.querySelector('[data-fila-transaccion="t1"]')?.textContent).toContain('−$45.00');
    expect(raiz.querySelector('[data-fila-transaccion="t3"]')?.textContent).toContain('$0.00');
  });

  it('PRU-CMP-TX-400 [CA-24.6] escribir «sel» rápido cambia la URL una sola vez, 300 ms después de la última tecla, y conserva los demás filtros', () => {
    const raiz = mostrar(dto([]), { cuenta: 'k1', cursor: 'x|y' });
    const campo = raiz.querySelector<HTMLInputElement>('input[type="search"]');
    if (campo === null) throw new Error('falta el buscador');
    escribir(campo, 's');
    pasar(100);
    escribir(campo, 'se');
    pasar(100);
    escribir(campo, 'sel');
    pasar(299);
    expect(reemplazo).not.toHaveBeenCalled();
    pasar(1);
    expect(reemplazo).toHaveBeenCalledTimes(1);
    expect(reemplazo).toHaveBeenCalledWith('/actividad?cuenta=k1&texto=sel', { scroll: false });
  });

  it('PRU-CMP-TX-400 sin transacciones dice «Todavía no hay transacciones»; con filtros y sin resultados, «Sin resultados con estos filtros» y «Quitar filtros»', () => {
    const vacia = mostrar(dto([]));
    expect(vacia.textContent).toContain('Todavía no hay transacciones');
    expect(vacia.textContent).not.toContain('Sin resultados con estos filtros');
    const filtrada = mostrar(dto([]), { tipo: 'gasto' });
    expect(filtrada.textContent).toContain('Sin resultados con estos filtros');
    expect(
      [...filtrada.querySelectorAll('a')].find((a) => a.textContent === 'Quitar filtros')?.href,
    ).toMatch(/\/actividad$/);
  });

  it('PRU-CMP-TX-400 cada fila lleva «?volver=» a la lista con sus filtros y «Cargar más» sigue el cursor sin perderlos', () => {
    const raiz = mostrar(
      dto([{ fecha: '2027-02-10', transacciones: [fila('t1', 'gasto', 'Super', -4500)] }], 'c|1'),
      { texto: 'sel', cuenta: 'k1' },
    );
    const href = raiz.querySelector('[data-fila-transaccion="t1"]')?.getAttribute('href');
    expect(href).toBe(
      `/actividad/t1?volver=${encodeURIComponent('/actividad?texto=sel&cuenta=k1')}`,
    );
    const mas = [...raiz.querySelectorAll('a')].find((a) => a.textContent === 'Cargar más');
    expect(new URL(mas?.href ?? '').searchParams.get('cursor')).toBe('c|1');
    expect(new URL(mas?.href ?? '').searchParams.get('texto')).toBe('sel');
  });

  it('PRU-CMP-TX-400 la pantalla no tiene violaciones de axe', async () => {
    const raiz = mostrar(
      dto([{ fecha: '2027-02-10', transacciones: [fila('t1', 'gasto', 'Super', -4500)] }]),
      { tipo: 'gasto' },
    );
    vi.useRealTimers();
    const resultado = await axe.run(raiz);
    expect(resultado.violations.map((v) => v.id)).toEqual([]);
  });
});

const conCuentas = (
  id: string,
  cuentas: [string, number][],
  lineas: string[],
  presentado: number,
) => ({
  ...fila(id, 'gasto', 'Super', presentado),
  cuentas: cuentas.map(([nombre, monto]) => ({ cuenta: { id: nombre, nombre }, monto })),
  lineas: lineas.map((nombre) => ({
    destino: { id: nombre, nombre, tipo: 'categoria' },
    monto: 100,
  })),
});

describe('PRU-CMP-TX-460 actividad del diseño', () => {
  it('PRU-CMP-TX-460 [FT-24 Flujo 2] los días se rotulan «Hoy · …», «Ayer · …» y «Domingo …», cada uno con su lista', () => {
    const raiz = mostrar(
      dto([
        { fecha: '2027-02-21', transacciones: [fila('a', 'gasto', 'A', -100)] },
        { fecha: '2027-02-20', transacciones: [fila('b', 'gasto', 'B', -100)] },
        { fecha: '2027-02-14', transacciones: [fila('c', 'gasto', 'C', -100)] },
      ]),
    );
    const rotulos = [...raiz.querySelectorAll('[data-dia] h2')].map((h) => h.textContent);
    expect(rotulos).toEqual(['Hoy · domingo 21/02', 'Ayer · sábado 20/02', 'Domingo 14/02']);
    expect(raiz.querySelectorAll('[data-dia] ul')).toHaveLength(3);
  });

  it('PRU-CMP-TX-460 [FT-24 Flujo 2] la fila dice la cuenta y la categoría, «n partes» o origen → destino, y cada marca con su texto', () => {
    const raiz = mostrar(
      dto([
        {
          fecha: '2027-02-21',
          transacciones: [
            conCuentas('uno', [['Visa Oro', -100]], ['Supermercado'], -100),
            conCuentas('tres', [['Visa Oro', -300]], ['A', 'B', 'C'], -300),
            {
              ...conCuentas(
                'tr',
                [
                  ['Ahorro', 500],
                  ['Corriente', -500],
                ],
                [],
                0,
              ),
              estadoBancario: 'pendiente',
              marcas: { ...MARCAS, programada: true },
            },
          ],
        },
      ]),
    );
    const texto = (id: string) =>
      raiz.querySelector(`[data-fila-transaccion="${id}"]`)?.textContent ?? '';
    expect(texto('uno')).toContain('Visa Oro · Supermercado');
    expect(texto('tres')).toContain('Visa Oro · 3 partes');
    expect(texto('tr')).toContain('Corriente → Ahorro');
    expect(texto('tr')).toContain('Pendiente');
    expect(texto('tr')).toContain('Programada');
  });

  it('PRU-CMP-TX-460 [FT-24 Estados] los filtros activos son fichas con su «x» que quitan solo ese filtro y conservan el texto', () => {
    const raiz = mostrar(dto([]), {
      texto: 'sel',
      cuenta: 'k1',
      tipo: 'gasto',
      desde: '2027-02-21',
      hasta: '2027-03-05',
    });
    const fichas = [...raiz.querySelectorAll<HTMLAnchorElement>('[data-filtros-activos] a')];
    expect(fichas.map((a) => a.getAttribute('aria-label'))).toEqual([
      'Quitar filtro Ahorro',
      'Quitar filtro Gasto',
      'Quitar filtro 21/02 – 05/03',
    ]);
    expect(fichas[1]?.getAttribute('href')).toBe(
      '/actividad?texto=sel&cuenta=k1&desde=2027-02-21&hasta=2027-03-05',
    );
    expect(fichas[2]?.getAttribute('href')).toBe('/actividad?texto=sel&cuenta=k1&tipo=gasto');
    expect(raiz.querySelector('summary')?.getAttribute('aria-label')).toBe('Filtros, 4 activos');
  });

  it('PRU-CMP-TX-460 [FT-24 Flujo 1] cada filtro de lista es un select nativo con su etiqueta, su nombre y la opción de la URL elegida', () => {
    const raiz = mostrar(dto([]), { categoria: 'c1', cuenta: 'k1' });
    const lista = (etiqueta: string) => {
      const id = [...raiz.querySelectorAll('label')].find(
        (l) => l.textContent === etiqueta,
      )?.htmlFor;
      return raiz.querySelector<HTMLSelectElement>(`select[id="${id ?? ''}"]`);
    };
    expect(['Cuenta', 'Categoría', 'Tipo', 'Estado', 'Origen'].map((e) => lista(e)?.name)).toEqual([
      'cuenta',
      'categoria',
      'tipo',
      'estado',
      'origen',
    ]);
    expect(lista('Categoría')?.value).toBe('c1');
    expect(lista('Cuenta')?.value).toBe('k1');
    expect(lista('Tipo')?.value).toBe('');
  });

  it('PRU-CMP-TX-460 [FT-24 Estados] el estado de carga anuncia «Cargando la pantalla» una vez y no dibuja números', () => {
    const nodo = document.createElement('div');
    document.body.append(nodo);
    const raiz = createRoot(nodo);
    act(() => {
      raiz.render(<Cargando />);
    });
    montados.push({ raiz, nodo });
    const region = nodo.querySelector('[role="status"]');
    expect(region?.getAttribute('aria-busy')).toBe('true');
    expect(region?.textContent).toBe('Cargando la pantalla');
    expect(nodo.querySelector('[data-centavos]')).toBeNull();
  });
});
