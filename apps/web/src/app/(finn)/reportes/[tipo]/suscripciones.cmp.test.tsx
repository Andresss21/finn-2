// FT-65 Suscripciones detectadas (06 FT-65; 07 §17: un texto o un estado es una CMP). La pantalla dibuja lo que trae el DTO de
// `reporte({ tipo: 'suscripciones' })`; los montos y la detección salen del motor (PF-3). Acá se prueba lo que la pantalla dice y
// qué entrada arma cada toque; el efecto real de «Programarla» y «Reactivarla» se prueba de punta a punta en la E2E.
import axe from 'axe-core';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { ReporteDto } from '@finn/aplicacion/consultas/reporte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../../globals.css';
import { PantallaReporte, type Nombres } from './pantalla';

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
  document.documentElement.removeAttribute('data-theme');
  window.sessionStorage.clear();
});

const ref = (id: string, nombre: string) => ({ id, nombre });
const valores = (categoriaId: string | null) => ({
  cuentaId: 'c-visa',
  comercio: 'NETFLIX',
  monto: 1549,
  tolerancia: 0,
  frecuencia: 'mensual',
  primeraFecha: '2027-06-17',
  categoriaId,
  registroAutomatico: false,
});
const hallazgo = (desactivada: boolean, accion: unknown) => ({
  tipo: 'suscripcion',
  clave: 'comercio:netflix',
  impacto: 1549,
  estado: 'advertencia',
  comercio: 'NETFLIX',
  mensual: 1549,
  anual: 18588,
  desactivada,
  accion,
});
const dto = (suficiente: boolean, hallazgos: unknown[], programadas: unknown[] = []) =>
  ({
    revision: 'r1',
    hoy: '2027-05-25',
    periodoActivo: {
      inicio: '2027-05-21',
      fin: '2027-06-20',
      dias: 31,
      estado: 'activo',
      transicion: false,
      diasTranscurridos: 4,
      diasRestantes: 26,
    },
    notificacionesNoLeidas: 0,
    bandejaPorRevisar: 0,
    suficiente,
    detectadas: [],
    programadas,
    hallazgos,
  }) as unknown as ReporteDto;
const YA = {
  programada: ref('p1', 'SPOTIFY'),
  comercio: 'SPOTIFY',
  mensual: 999,
  anual: 11988,
  frecuencia: 'mensual',
};
const NOMBRES = { cuentas: [], grupos: [], categorias: [] } as unknown as Nombres;

type Acciones = NonNullable<Parameters<typeof PantallaReporte>[0]['suscripciones']>;
const mostrar = (datos: ReporteDto, acciones?: Acciones): HTMLElement => {
  document.body.style.cssText = 'background: var(--fondo); color: var(--texto)';
  const nodo = document.createElement('div');
  // Ancho de teléfono: las tablas se desplazan, y la CI corre en otro tamaño que el local.
  nodo.style.width = '320px';
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(
      <PantallaReporte
        url="suscripciones"
        dto={datos}
        nombres={NOMBRES}
        parametros={{}}
        {...(acciones === undefined ? {} : { suscripciones: acciones })}
      />,
    );
  });
  montados.push({ raiz, nodo });
  return nodo;
};
const boton = (raiz: HTMLElement, nombre: string): HTMLButtonElement => {
  const b = [...raiz.querySelectorAll('button')].find((x) => x.textContent === nombre);
  if (b === undefined) throw new Error(`Sin botón ${nombre}`);
  return b;
};
const tocar = async (b: HTMLElement): Promise<void> => {
  await act(async () => {
    b.click();
    await Promise.resolve();
  });
};

describe('PRU-CMP-REP suscripciones detectadas', () => {
  it('PRU-CMP-REP-210 [FT-65, CA-65.1] dice cuánto cobra al mes y al año y que no está programada, ofrece «Programarla» y lista «Ya programadas» con su costo anual y «Revisar»; sin violaciones de axe en claro ni en oscuro', async () => {
    const datos = dto(
      true,
      [hallazgo(false, { tipo: 'programar', valores: valores('cat1') })],
      [YA],
    );
    for (const tema of ['claro', 'oscuro']) {
      document.documentElement.setAttribute('data-theme', tema);
      const raiz = mostrar(datos, { gestionar: vi.fn(), eliminar: vi.fn() });
      expect(
        raiz.querySelector('nav[aria-label="Reportes"] a[aria-current="page"]')?.textContent,
      ).toBe('Suscripciones');
      const h = raiz.querySelector('[data-hallazgo-suscripcion="comercio:netflix"]');
      expect(h?.textContent).toContain(
        'NETFLIX te cobra $15.49 cada mes ($185.88 al año) y no la tenés programada.',
      );
      expect(h?.querySelector('button')?.textContent).toBe('Programarla');
      const fila = raiz.querySelector('[data-ya-programadas] [data-fila="p1"]');
      expect(fila?.querySelector('[data-col="mensual"]')?.textContent).toContain('9.99');
      expect(fila?.querySelector('[data-col="anual"]')?.textContent).toContain('119.88');
      expect(fila?.querySelector('[data-col="frecuencia"]')?.textContent).toBe('Mensual');
      expect(fila?.querySelector('a')?.getAttribute('href')).toBe('/programadas/p1');
      const resultado = await axe.run(raiz);
      expect(
        resultado.violations.map((v) => `${tema}: ${v.id} ${v.nodes[0]?.html.slice(0, 120)}`),
      ).toEqual([]);
      act(() => {
        montados[0]?.raiz.unmount();
      });
      montados.shift()?.nodo.remove();
    }
  });

  it('PRU-CMP-REP-211 [FT-65, CA-65.3] con una programada desactivada dice «pero su programada está desactivada» y la acción es «Reactivarla», no «Programarla»', () => {
    const raiz = mostrar(dto(true, [hallazgo(true, { tipo: 'reactivar', programadaId: 'p9' })]), {
      gestionar: vi.fn(),
      eliminar: vi.fn(),
    });
    const h = raiz.querySelector('[data-hallazgo-suscripcion]');
    expect(h?.textContent).toContain(
      'NETFLIX te sigue cobrando $15.49 cada mes, pero su programada está desactivada.',
    );
    expect(h?.querySelector('button')?.textContent).toBe('Reactivarla');
    expect(raiz.textContent).not.toContain('Programarla');
  });

  it('PRU-CMP-REP-212 [FT-65, CA-65.4] con menos de 4 períodos cerrados dice «Necesitamos 4 períodos cerrados para detectar suscripciones.» y no ofrece ninguna acción', () => {
    const raiz = mostrar(dto(false, []));
    expect(raiz.textContent).toContain(
      'Necesitamos 4 períodos cerrados para detectar suscripciones.',
    );
    expect(raiz.textContent).not.toContain('No hay movimientos');
    expect(raiz.querySelector('[data-hallazgo-suscripcion]')).toBeNull();
    expect(raiz.querySelector('main button')).toBeNull();
  });

  it('PRU-CMP-REP-213 [FT-65, CA-65.2, CA-65.3] «Programarla» arma OP-42 crear (mensual, sin registro automático, una línea) y su «Deshacer» es OP-51 con el id creado; «Reactivarla» es OP-42 activar y su «Deshacer» activa: false', async () => {
    const gestionar = vi.fn((entrada: unknown) =>
      Promise.resolve({
        ok: true as const,
        valor: { id: (entrada as { id?: string }).id ?? 'p9' },
      }),
    );
    const eliminar = vi.fn(() => Promise.resolve({ ok: true as const, valor: {} }));
    const acciones = { gestionar, eliminar } as unknown as Acciones;

    const raiz = mostrar(
      dto(true, [hallazgo(false, { tipo: 'programar', valores: valores('cat1') })]),
      acciones,
    );
    await tocar(boton(raiz, 'Programarla'));
    const [entrada] = gestionar.mock.calls[0] ?? [];
    expect(entrada).toMatchObject({
      accion: 'crear',
      tipo: 'gasto',
      cuentaId: 'c-visa',
      comercio: 'NETFLIX',
      monto: '15.49',
      frecuencia: 'mensual',
      primeraFecha: '2027-06-17',
      registroAutomatico: false,
      lineas: [{ monto: '15.49', categoriaId: 'cat1' }],
    });
    const creada = (entrada as { id: string }).id;
    expect(raiz.querySelector('[data-suscripciones-hecho]')?.textContent).toContain(
      'Programaste NETFLIX: $15.49 cada mes.',
    );
    await tocar(boton(raiz, 'Deshacer'));
    expect(eliminar).toHaveBeenCalledWith(expect.objectContaining({ programadaId: creada }));
    expect(raiz.querySelector('[data-suscripciones-hecho]')).toBeNull();

    const otra = mostrar(
      dto(true, [hallazgo(true, { tipo: 'reactivar', programadaId: 'p7' })]),
      acciones,
    );
    await tocar(boton(otra, 'Reactivarla'));
    expect(gestionar).toHaveBeenLastCalledWith(
      expect.objectContaining({ accion: 'activar', programadaId: 'p7', activa: true }),
    );
    await tocar(boton(otra, 'Deshacer'));
    expect(gestionar).toHaveBeenLastCalledWith(
      expect.objectContaining({ accion: 'activar', programadaId: 'p7', activa: false }),
    );
  });

  it('PRU-CMP-REP-214 [FT-65] con la categoría de la última compra inactiva, la propuesta abre /programadas/nueva y deja los valores como borrador de ese flujo', async () => {
    const raiz = mostrar(
      dto(true, [hallazgo(false, { tipo: 'abrir_flujo', valores: valores('vieja') })]),
      { gestionar: vi.fn(), eliminar: vi.fn() },
    );
    const enlace = raiz.querySelector('[data-hallazgo-suscripcion] a');
    expect(enlace?.getAttribute('href')).toBe('/programadas/nueva');
    expect(enlace?.textContent).toBe('Programarla');
    // El navegador de la prueba no debe salir de la página: el borrador se escribe antes de navegar.
    enlace?.addEventListener('click', (e) => {
      e.preventDefault();
    });
    await tocar(enlace as HTMLElement);
    const guardado = JSON.parse(
      window.sessionStorage.getItem('finn:borrador:v1:/programadas/nueva:') ?? 'null',
    ) as { campos: Record<string, unknown> } | null;
    expect(guardado?.campos).toMatchObject({
      tipo: 'gasto',
      cuentaId: 'c-visa',
      comercio: 'NETFLIX',
      monto: '15.49',
      frecuencia: 'mensual',
      primeraFecha: '2027-06-17',
      lineas: [{ monto: '15.49', categoriaId: 'vieja' }],
    });
  });
});
