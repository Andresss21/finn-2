// FT-67 Hallazgos accionables (06 FT-67; 07 §17: un texto o un estado es una CMP). La pantalla dibuja los hallazgos que trae el DTO de
// `reporte({ tipo: 'hallazgos' })`, en su orden, cada uno con la acción de su reporte de origen; los montos salen del motor (PF-3).
// La ejecución de un toque y «Deshacer» se prueban de punta a punta en la E2E.
import axe from 'axe-core';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { ReporteDto } from '@finn/aplicacion/consultas/reporte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../../globals.css';
import { PantallaReporte, type Nombres } from './pantalla';
import type { AccionesSuscripciones } from './suscripciones-hallazgos';

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
});

const ref = (id: string, nombre: string) => ({ id, nombre });
const dto = (hallazgos: unknown[]) =>
  ({
    revision: 'r1',
    hoy: '2027-03-10',
    periodoActivo: {
      inicio: '2027-02-21',
      fin: '2027-03-20',
      dias: 28,
      estado: 'activo',
      transicion: false,
      diasTranscurridos: 17,
      diasRestantes: 11,
    },
    notificacionesNoLeidas: 0,
    bandejaPorRevisar: 0,
    periodo: { inicio: '2027-02-21', fin: '2027-03-20' },
    hallazgos,
  }) as unknown as ReporteDto;
const NOMBRES = { cuentas: [], grupos: [], categorias: [] } as unknown as Nombres;

const ritmo = {
  tipo: 'ritmo',
  clave: 'categoria:rest',
  impacto: 5556,
  estado: 'problema',
  categoria: ref('rest', 'Restaurantes'),
  exceso: 5556,
  sobregiroActual: 2630,
  fin: '2027-03-20',
  accion: { tipo: 'asignar', montoNuevo: 17556, esperado: 12000 },
};
const tarjeta = {
  tipo: 'tarjeta',
  clave: 'tarjeta:t1',
  impacto: 15000,
  estado: 'advertencia',
  tarjeta: ref('t1', 'Visa'),
  arrastre: 15000,
  corte: '2027-02-15',
  sinRespaldo: 0,
  accion: { tipo: 'pagar', tarjetaId: 't1' },
};
const promedio = {
  tipo: 'promedio',
  clave: 'categoria:gas',
  impacto: 3000,
  estado: 'informacion',
  categoria: ref('gas', 'Gasolina'),
  gasto: 13000,
  promedio: 10000,
  variacion: 3000,
  accion: { tipo: 'revisar', categoriaId: 'gas' },
};
const suscripcion = {
  tipo: 'suscripcion',
  clave: 'comercio:netflix',
  impacto: 1549,
  estado: 'advertencia',
  comercio: 'NETFLIX',
  mensual: 1549,
  anual: 18588,
  desactivada: false,
  accion: {
    tipo: 'programar',
    valores: {
      cuentaId: 'c-visa',
      comercio: 'NETFLIX',
      monto: 1549,
      tolerancia: 0,
      frecuencia: 'mensual',
      primeraFecha: '2027-03-17',
      categoriaId: 'cat1',
      registroAutomatico: false,
    },
  },
};
const gestionar = vi.fn((entrada: unknown) =>
  Promise.resolve({ ok: true as const, valor: { id: (entrada as { id?: string }).id ?? 'p9' } }),
);
const eliminar = vi.fn(() => Promise.resolve({ ok: true as const, valor: {} }));
const acciones = { gestionar, eliminar } as unknown as AccionesSuscripciones;

const mostrar = (datos: ReporteDto): HTMLElement => {
  document.body.style.cssText = 'background: var(--fondo); color: var(--texto)';
  const nodo = document.createElement('div');
  nodo.style.width = '320px';
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(
      <PantallaReporte
        url="hallazgos"
        dto={datos}
        nombres={NOMBRES}
        parametros={{}}
        asignar={() => Promise.reject(new Error('Sin servidor en la CMP'))}
        suscripciones={acciones}
      />,
    );
  });
  montados.push({ raiz, nodo });
  return nodo;
};

describe('PRU-CMP-REP hallazgos accionables', () => {
  it('PRU-CMP-REP-250 [FT-67, CA-67.1] dibuja los hallazgos del DTO en su orden, uno por clave, cada uno con la acción de su reporte; sin violaciones de axe en claro ni en oscuro', async () => {
    const datos = dto([tarjeta, ritmo, promedio, suscripcion]);
    for (const tema of ['claro', 'oscuro']) {
      document.documentElement.setAttribute('data-theme', tema);
      const raiz = mostrar(datos);
      expect(
        raiz.querySelector('nav[aria-label="Reportes"] a[aria-current="page"]')?.textContent,
      ).toBe('Hallazgos');
      expect(raiz.textContent).not.toContain('Todo en orden');
      const filas = [...raiz.querySelectorAll('[data-hallazgo-fila]')];
      expect(filas.map((x) => x.getAttribute('data-hallazgo-fila'))).toEqual([
        'tarjeta:t1',
        'categoria:rest',
        'categoria:gas',
        'comercio:netflix',
      ]);
      expect(filas[0]?.querySelector('a')?.getAttribute('href')).toBe('/cuentas/t1/pagar');
      expect(filas[1]?.textContent).toContain('Restaurantes');
      expect(filas[1]?.querySelector('button')?.textContent).toBe('Asignar $55.56');
      expect(filas[2]?.querySelector('a')?.getAttribute('href')).toBe(
        '/presupuesto/categorias/gas',
      );
      expect(filas[3]?.textContent).toContain(
        'NETFLIX te cobra $15.49 cada mes ($185.88 al año) y no la tenés programada.',
      );
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

  it('PRU-CMP-REP-251 [FT-67] sin hallazgos dice «Todo en orden: no encontramos nada que ajustar este período.»', () => {
    const raiz = mostrar(dto([]));
    expect(raiz.querySelector('[data-sin-hallazgos]')?.textContent).toBe(
      'Todo en orden: no encontramos nada que ajustar este período.',
    );
    expect(raiz.querySelector('[data-hallazgo-fila]')).toBeNull();
  });

  it('PRU-CMP-REP-252 [FT-67] el hallazgo de suscripción lleva «Programarla» de un toque (OP-42 crear) y «Deshacer» (OP-51); con una programada desactivada, «Reactivarla» y su inversa «Desactivarla»', async () => {
    const tocar = async (el: Element | null | undefined): Promise<void> => {
      await act(async () => {
        (el as HTMLElement).click();
        await Promise.resolve();
      });
    };
    const boton = (raiz: HTMLElement, texto: string) =>
      [...raiz.querySelectorAll('button')].find((b) => b.textContent === texto);
    const raiz = mostrar(dto([suscripcion]));
    const fila = raiz.querySelector('[data-hallazgo-fila="comercio:netflix"]');
    expect(fila?.querySelector('a')).toBeNull();
    await tocar(boton(raiz, 'Programarla'));
    expect(gestionar).toHaveBeenCalledWith(
      expect.objectContaining({
        accion: 'crear',
        comercio: 'NETFLIX',
        monto: '15.49',
        frecuencia: 'mensual',
        lineas: [{ monto: '15.49', categoriaId: 'cat1' }],
      }),
    );
    expect(fila?.querySelector('[data-suscripciones-hecho]')?.textContent).toContain(
      'Programaste NETFLIX: $15.49 cada mes.',
    );
    await tocar(boton(raiz, 'Deshacer'));
    expect(eliminar).toHaveBeenCalledTimes(1);
    expect(fila?.querySelector('[data-suscripciones-hecho]')).toBeNull();

    const otra = mostrar(
      dto([
        { ...suscripcion, desactivada: true, accion: { tipo: 'reactivar', programadaId: 'p7' } },
      ]),
    );
    await tocar(boton(otra, 'Reactivarla'));
    expect(gestionar).toHaveBeenLastCalledWith(
      expect.objectContaining({ accion: 'activar', programadaId: 'p7', activa: true }),
    );
    await tocar(boton(otra, 'Desactivarla'));
    expect(gestionar).toHaveBeenLastCalledWith(
      expect.objectContaining({ accion: 'activar', programadaId: 'p7', activa: false }),
    );
  });
});
