// FT-17 Metas (07 §17: un texto, un estado o el foco de un componente es una CMP). La pantalla solo dibuja lo que trae el DTO de
// `metas()` (04 §6.10): los números de cada caso salen del motor y los prueban el dominio y las E2E (PF-3).
import axe from 'axe-core';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { DetalleCategoriaDto } from '@finn/aplicacion/consultas/detalle-categoria';
import type { MetasDto } from '@finn/aplicacion/consultas/metas';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../globals.css';
import { PantallaDetalleCategoria } from '../presupuesto/categorias/[categoriaId]/pantalla';
import { PantallaMetas } from './pantalla';

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

const ACTIVO = {
  inicio: '2027-02-21',
  fin: '2027-03-20',
  dias: 28,
  estado: 'activo',
  transicion: false,
  diasTranscurridos: 10,
  diasRestantes: 18,
};
const GRUPO = { id: 'g', nombre: 'Casa' };
const meta = (parcial: Record<string, unknown> = {}) => ({
  id: 'm1',
  categoria: { id: 'c1', nombre: 'Gas' },
  grupo: GRUPO,
  tipo: 'mensual',
  modoMeta: 'rellenar_hasta',
  monto: 20000,
  fechaCreacion: '2027-02-10',
  pedido: 12000,
  falta: 12000,
  disponible: 8000,
  estado: 'con_faltante',
  vencida: false,
  esperado: {},
  ...parcial,
});
const dto = (metas: Record<string, unknown>[], sinMeta: { id: string; nombre: string }[] = []) =>
  ({
    revision: 'r1',
    hoy: '2027-02-21',
    periodoActivo: ACTIVO,
    notificacionesNoLeidas: 0,
    bandejaPorRevisar: 0,
    metas,
    categoriasSinMeta: sinMeta,
  }) as unknown as MetasDto;

const mostrar = (arbol: ReactNode): HTMLElement => {
  document.body.style.cssText = 'background: var(--fondo); color: var(--texto)';
  const nodo = document.createElement('div');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(arbol);
  });
  montados.push({ raiz, nodo });
  return nodo;
};
const enlaces = (raiz: HTMLElement) => [...raiz.querySelectorAll('a')].map((a) => a.textContent);

describe('PRU-CMP-META-101 metas', () => {
  it('PRU-CMP-META-101 [CA-17.1] cada meta dibuja lo que pide y lo que falta del DTO, con su modo y su monto del período', () => {
    const raiz = mostrar(
      <PantallaMetas
        dto={dto([
          meta(),
          meta({
            id: 'm2',
            categoria: { id: 'c2', nombre: 'Fondo' },
            modoMeta: 'acumular',
            pedido: 20000,
            falta: 20000,
            montoPeriodo: 20000,
          }),
        ])}
      />,
    );
    const filas = raiz.querySelectorAll('[data-meta]');
    expect(filas).toHaveLength(2);
    expect(
      filas[0]?.querySelector('[data-pedido] [data-centavos]')?.getAttribute('data-centavos'),
    ).toBe('12000');
    expect(filas[0]?.textContent).toContain('Rellenar hasta');
    expect(
      filas[1]
        ?.querySelector('[data-monto-periodo] [data-centavos]')
        ?.getAttribute('data-centavos'),
    ).toBe('20000');
    expect(filas[1]?.textContent).toContain('Acumular');
  });

  it('PRU-CMP-META-101 [AV-17] una meta vencida muestra el aviso con «Extender la fecha» y «Ajustar el monto»; una que no, no', () => {
    const raiz = mostrar(
      <PantallaMetas
        dto={dto([
          meta({
            id: 'm3',
            categoria: { id: 'c3', nombre: 'Laptop' },
            tipo: 'para_fecha',
            modoMeta: undefined,
            fechaObjetivoVigente: '2027-05-15',
            estado: 'vencida',
            vencida: true,
          }),
          meta(),
        ])}
      />,
    );
    const filas = raiz.querySelectorAll('[data-meta]');
    expect(filas[0]?.getAttribute('data-vencida')).toBe('si');
    expect(filas[0]?.textContent).toContain('Meta vencida');
    expect(filas[0]?.textContent).toContain('15/05/2027');
    expect(enlaces(filas[0] as HTMLElement)).toEqual(
      expect.arrayContaining(['Extender la fecha', 'Ajustar el monto']),
    );
    expect(filas[1]?.getAttribute('data-vencida')).toBe('no');
    expect(filas[1]?.textContent).not.toContain('Extender la fecha');
  });

  it('PRU-CMP-META-101 sin metas lo dice y ofrece crear una con la primera categoría sin meta', () => {
    const raiz = mostrar(<PantallaMetas dto={dto([], [{ id: 'c9', nombre: 'Gas' }])} />);
    expect(raiz.textContent).toContain('Todavía no tenés metas');
    const crear = [...raiz.querySelectorAll('a')].find((a) => a.textContent === 'Crear una meta');
    expect(crear?.getAttribute('href')).toBe('/metas/nueva?categoria=c9');
  });

  it('PRU-CMP-META-101 [CA-17.6] el detalle de una categoría de pago no ofrece crear una meta', () => {
    const detalle = {
      revision: 'r1',
      hoy: '2027-02-21',
      periodoActivo: ACTIVO,
      notificacionesNoLeidas: 0,
      bandejaPorRevisar: 0,
      categoria: { id: 'p1', nombre: 'Pago Visa' },
      grupo: { id: 'g', nombre: 'Pagos de tarjeta' },
      clase: 'pago',
      periodo: ACTIVO,
      navegacion: {},
    } as unknown as DetalleCategoriaDto;
    const raiz = mostrar(
      <PantallaDetalleCategoria
        dto={detalle}
        desarchivar={() => Promise.reject(new Error('no'))}
      />,
    );
    expect(raiz.textContent).not.toContain('Crear una meta');
    expect(
      [...raiz.querySelectorAll('a')].some((a) => a.getAttribute('href')?.startsWith('/metas')),
    ).toBe(false);
  });

  it('PRU-CMP-META-101 la pantalla con una meta de ahorro y una vencida no tiene violaciones de accesibilidad', async () => {
    const raiz = mostrar(
      <PantallaMetas
        dto={dto([
          meta({
            id: 'm4',
            categoria: { id: 'c4', nombre: 'Viaje' },
            tipo: 'para_fecha',
            modoMeta: undefined,
            monto: 300000,
            disponible: 135000,
            progreso: 4500,
            fechaObjetivoVigente: '2027-05-15',
            estado: 'vencida',
            vencida: true,
          }),
          meta(),
        ])}
      />,
    );
    const resultado = await axe.run(raiz, { rules: { 'color-contrast': { enabled: false } } });
    expect(
      resultado.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.html).join(' | ')}`),
    ).toEqual([]);
  });
});
