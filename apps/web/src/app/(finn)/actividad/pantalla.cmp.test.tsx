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
  return Object.assign(Enlace, {
    default: Enlace,
    useLinkStatus: () => ({ pending: false }),
  });
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
    const mas = raiz.querySelector<HTMLAnchorElement>('[data-cargar-mas]');
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
  it('PRU-CMP-TX-460 los días se rotulan «Hoy · …», «Ayer · …» y «Domingo …», cada uno con su lista', () => {
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

  it('PRU-CMP-TX-460 la fila dice la cuenta y la categoría, «n partes» o origen → destino, y cada marca con su texto', () => {
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

  it('PRU-CMP-TX-460 los filtros activos son fichas con su «x» que quitan solo ese filtro y conservan el texto', () => {
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
    expect(raiz.querySelector('[data-boton-filtros]')?.getAttribute('aria-label')).toBe(
      'Filtros, 4 activos',
    );
  });

  it('PRU-CMP-TX-460 cada filtro de lista es un select nativo con su etiqueta, su nombre y la opción de la URL elegida', () => {
    const raiz = mostrar(dto([]), { categoria: 'c1', cuenta: 'k1' });
    // Estado y origen son selectores segmentados con su valor en un campo oculto (ACT-06)
    for (const nombre of ['estado', 'origen'])
      expect(raiz.querySelector(`input[type="hidden"][name="${nombre}"]`)).not.toBeNull();
    const lista = (etiqueta: string) => {
      const id = [...raiz.querySelectorAll('label')].find(
        (l) => l.textContent === etiqueta,
      )?.htmlFor;
      return raiz.querySelector<HTMLSelectElement>(`select[id="${id ?? ''}"]`);
    };
    expect(['Cuenta', 'Categoría', 'Tipo'].map((e) => lista(e)?.name)).toEqual([
      'cuenta',
      'categoria',
      'tipo',
    ]);
    expect(lista('Categoría')?.value).toBe('c1');
    expect(lista('Cuenta')?.value).toBe('k1');
    expect(lista('Tipo')?.value).toBe('');
  });

  it('PRU-CMP-TX-422 [CA-24.4] cada fila lleva título y «cuenta · categoría» en una línea y la línea de metadatos con glifo de 12; «Cargar más» es tonal, centrado y lleva el cursor', () => {
    const conMarcas = {
      ...fila('t1', 'gasto', 'RESTAURANTE EL ZOCALO MUY LARGO', -2830),
      cuentas: [{ cuenta: { id: 'k1', nombre: 'Ahorro' }, monto: -2830 }],
      lineas: [{ destino: { tipo: 'categoria', nombre: 'Restaurantes' } }],
      estadoBancario: 'pendiente',
      marcas: {
        ...MARCAS,
        programada: true,
        conciliada: true,
        porCobrar: true,
        conDevoluciones: true,
      },
    };
    const raiz = mostrar(dto([{ fecha: '2027-02-10', transacciones: [conMarcas] }], 'cur-2'));
    const f = raiz.querySelector('[data-fila-transaccion="t1"]') as HTMLElement;
    const [titulo, subtitulo] = [...f.querySelectorAll(':scope > span:nth-child(2) > span')];
    expect(titulo?.className).toContain('truncate');
    expect(subtitulo?.className).toContain('truncate');
    expect(subtitulo?.textContent).toBe('Ahorro · Restaurantes');
    const metadatos = f.querySelector('[data-metadatos]') as HTMLElement;
    expect(metadatos.textContent).toContain('Pendiente');
    for (const marca of ['Programada', 'Conciliada', 'Por cobrar', 'Con devoluciones'])
      expect(metadatos.textContent).toContain(marca);
    expect(
      [...metadatos.querySelectorAll('svg')].every((s) => s.getAttribute('width') === '12'),
    ).toBe(true);
    expect(metadatos.querySelector('.border-dashed')?.textContent).toContain('Pendiente');

    const mas = raiz.querySelector<HTMLAnchorElement>('[data-cargar-mas]');
    expect(mas?.getAttribute('href')).toBe('/actividad?cursor=cur-2');
    expect(mas?.className).toContain('bg-accion-tonal');
    expect(mas?.parentElement?.className).toContain('justify-center');
    // Los filtros van en su propia columna y la búsqueda con la lista
    expect(raiz.querySelector('[data-columna-filtros] section[data-filtros]')).not.toBeNull();
    expect(raiz.querySelector('[data-columna-lista] [role="search"]')).not.toBeNull();
  });

  it('PRU-CMP-TX-460 el estado de carga anuncia «Cargando actividad» una vez y no dibuja números', () => {
    const nodo = document.createElement('div');
    document.body.append(nodo);
    const raiz = createRoot(nodo);
    act(() => {
      raiz.render(<Cargando />);
    });
    montados.push({ raiz, nodo });
    expect(nodo.querySelector('[role="status"]')?.textContent).toBe('Cargando actividad');
    expect(nodo.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(nodo.querySelector('[data-centavos]')).toBeNull();
  });
});

describe('PRU-CMP-TX-721 actividad de la entrega 4', () => {
  it('PRU-CMP-TX-721 la lista no repite «Registrar» (ACT-01) y una fila por cobrar nombra la marca, nunca al deudor con «te debe»', () => {
    const porCobrar = {
      ...conCuentas('cine', [['Visa Oro', -4000]], ['Carlos'], -4000),
      marcas: { ...MARCAS, porCobrar: true },
    };
    const raiz = mostrar(dto([{ fecha: '2027-02-21', transacciones: [porCobrar] }]));
    expect(raiz.querySelectorAll('a[href="/registrar"]')).toHaveLength(0);
    const texto = raiz.querySelector('[data-fila-transaccion="cine"]')?.textContent ?? '';
    expect(texto).toContain('Por cobrar');
    expect(texto).not.toMatch(/te debe/i);
  });

  it('PRU-CMP-TX-722 [CA-E4-8] el buscador y «Filtros · n» comparten fila, estado y origen son selectores segmentados y «Cargar más» dice «Cargando…» mientras navega', () => {
    const raiz = mostrar(dto([], 'cur-2'), { estado: 'pendiente', tipo: 'gasto' });
    const boton = raiz.querySelector<HTMLElement>('[data-boton-filtros]');
    const buscador = raiz.querySelector<HTMLElement>('[role="search"]');
    expect(boton?.textContent).toBe('Filtros · 2');
    expect(boton?.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    expect(
      Math.abs(
        (boton?.getBoundingClientRect().top ?? 0) - (buscador?.getBoundingClientRect().top ?? 99),
      ),
    ).toBeLessThan(8);
    for (const grupo of ['Estado bancario', 'Origen']) {
      const radios = raiz.querySelectorAll(
        `[role="radiogroup"][aria-label="${grupo}"] [role="radio"]`,
      );
      expect(radios.length).toBeGreaterThanOrEqual(4);
    }
    expect(raiz.querySelector('input[name="estado"]')?.getAttribute('value')).toBe('pendiente');
    // Mientras navega, `EnlaceFinn` marca el enlace con `aria-busy` y el texto cambia a «Cargando…»
    const mas = raiz.querySelector<HTMLElement>('[data-cargar-mas]');
    const visible = () =>
      [...(mas?.children ?? [])]
        .filter((x) => getComputedStyle(x).display !== 'none')
        .map((x) => x.textContent);
    expect(visible()).toEqual(['Cargar más']);
    mas?.setAttribute('aria-busy', 'true');
    expect(visible()).toEqual(['Cargando…']);
  });

  it('PRU-CMP-TX-723 [CA-E4-8] en teléfono «Filtros» abre una hoja inferior con el título «Filtros», «Ver resultados» y, con filtros, «Quitar filtros»', async () => {
    vi.useRealTimers();
    const raiz = mostrar(dto([]), { estado: 'pendiente' });
    await act(async () => {
      raiz.querySelector<HTMLElement>('[data-boton-filtros]')?.click();
      await Promise.resolve();
    });
    await vi.waitFor(() => {
      expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    });
    const hoja = document.querySelector('[role="dialog"]') as HTMLElement;
    expect(hoja.textContent).toContain('Filtros');
    const pie = [...hoja.querySelectorAll('a, button')].map((x) => x.textContent);
    expect(pie).toEqual(expect.arrayContaining(['Ver resultados', 'Quitar filtros']));
    expect(
      hoja.querySelector('button[type="submit"][form]')?.getBoundingClientRect().height,
    ).toBeGreaterThanOrEqual(44);
    expect(document.querySelector('[data-testid="velo"]')).not.toBeNull();
  });

  it('PRU-CMP-TX-792 con filtros, «N transacciones · total» y con búsqueda «N resultados para …», con el conteo y el total del DTO; «Quitar filtros» mide 44 px y la hoja dice «Ver N resultados»', async () => {
    vi.useRealTimers();
    const filas = [fila('a', 'gasto', 'PRICESMART', -14860), fila('b', 'gasto', 'PAMPA', -8049)];
    const conResumen = (conteo: number, total: number) =>
      ({ ...dto([{ fecha: '2027-02-10', transacciones: filas }]), conteo, total }) as ActividadDto;
    const filtrada = mostrar(conResumen(5, -22909), { tipo: 'gasto', desde: '2027-01-21' });
    const resumen = filtrada.querySelector('[data-resumen-filtros]');
    expect(resumen?.querySelector('p')?.textContent).toBe('5 transacciones · −$229.09');
    expect(resumen?.querySelector('a')?.textContent).toBe('Quitar filtros');
    expect(resumen?.querySelector('a')?.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);

    const buscada = mostrar(conResumen(1, -8049), { texto: 'pampa' });
    expect(buscada.querySelector('[data-resumen-filtros] p')?.textContent).toBe(
      '1 resultado para “pampa”',
    );

    await act(async () => {
      filtrada.querySelector<HTMLElement>('[data-boton-filtros]')?.click();
      await Promise.resolve();
    });
    await vi.waitFor(() => {
      expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    });
    expect(document.querySelector('[role="dialog"] button[type="submit"][form]')?.textContent).toBe(
      'Ver 5 resultados',
    );
  });

  it('PRU-CMP-TX-793 sin filtros no hay línea de resumen, y una fila con algo en camino dice «En camino $40.00» en lugar de «Por cobrar», sin «te debe»', () => {
    const enCamino = {
      ...fila('cine', 'gasto', 'CINEMARK', -6000),
      marcas: { ...MARCAS, porCobrar: true },
      enCamino: 4000,
    };
    const raiz = mostrar({
      ...dto([{ fecha: '2027-02-10', transacciones: [enCamino] }]),
      conteo: 1,
      total: -6000,
    } as ActividadDto);
    expect(raiz.querySelector('[data-resumen-filtros]')).toBeNull();
    const texto = raiz.querySelector('[data-fila-transaccion="cine"]')?.textContent ?? '';
    expect(texto).toContain('En camino $40.00');
    expect(texto).not.toContain('Por cobrar');
    expect(texto).not.toMatch(/te debe/i);
  });
});
