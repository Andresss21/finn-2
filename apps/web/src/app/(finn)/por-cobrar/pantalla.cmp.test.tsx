// FT-45 Por cobrar (07 §17: un texto, un estado o el foco de un componente es una CMP). La pantalla solo dibuja lo que trae el DTO de
// `porCobrar()` (04 §6.12.3): los números de cada caso salen del motor y los prueban las E2E (PF-3).
import axe from 'axe-core';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { PorCobrarDto } from '@finn/aplicacion/consultas/por-cobrar';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../globals.css';
import { PantallaPorCobrar } from './pantalla';

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
const partida = (parcial: Record<string, unknown> = {}) => ({
  lineaId: 'l1',
  transaccionId: 't1',
  comercio: 'PRICESMART',
  fechaOrigen: '2027-02-10',
  monto: 2500,
  restituido: 1000,
  condonado: 0,
  devuelto: 0,
  abierto: 1500,
  medio: 'debito',
  estado: 'parcial',
  ...parcial,
});
const dto = (deudores: Record<string, unknown>[], enCamino = 1500, totalAbierto = 1500) =>
  ({
    revision: 'r1',
    hoy: '2027-02-21',
    periodoActivo: ACTIVO,
    notificacionesNoLeidas: 0,
    bandejaPorRevisar: 0,
    enCamino,
    totalAbierto,
    deudores,
  }) as unknown as PorCobrarDto;
const ana = (items: Record<string, unknown>[], abierto = 1500) => ({
  deudor: { id: 'd1', nombre: 'Ana' },
  abierto,
  items,
});

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
const centavos = (raiz: ParentNode, selector: string) =>
  raiz.querySelector(`${selector} [data-centavos]`)?.getAttribute('data-centavos');

describe('PRU-CMP-COBRO-101 por cobrar', () => {
  it('PRU-CMP-COBRO-101 [CA-45.3] cada deudor muestra su saldo abierto y cada partida su estado, con cobrar y condonar hacia sus rutas', () => {
    const raiz = mostrar(<PantallaPorCobrar dto={dto([ana([partida()])])} cerrados={false} />);
    expect(centavos(raiz, '[data-deudor] [data-deuda-abierta]')).toBe('1500');
    const fila = raiz.querySelector('[data-partida="l1"]');
    expect(fila?.getAttribute('data-partida-estado')).toBe('parcial');
    expect(centavos(raiz, '[data-partida="l1"] [data-abierto]')).toBe('1500');
    expect(fila?.textContent).toContain('Parcial');
    expect(fila?.textContent).toContain('Débito');
    const hrefs = [...raiz.querySelectorAll('a')].map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/por-cobrar/cobrar?linea=l1');
    expect(hrefs).toContain('/por-cobrar/condonar/l1');
    expect(hrefs).toContain('/por-cobrar/deudores/d1/renombrar');
  });

  it('PRU-CMP-COBRO-101 [CA-45.2] con $0.00 en camino el resumen lo muestra igual y el aviso dice que la tarjeta no baja Listo para asignar', () => {
    const raiz = mostrar(
      <PantallaPorCobrar
        dto={dto(
          [
            ana(
              [
                partida({
                  monto: 4000,
                  restituido: 0,
                  abierto: 4000,
                  medio: 'tarjeta',
                  estado: 'abierto',
                }),
              ],
              4000,
            ),
          ],
          0,
          4000,
        )}
        cerrados={false}
      />,
    );
    expect(centavos(raiz, '[data-en-camino]')).toBe('0');
    expect(centavos(raiz, '[data-total-abierto]')).toBe('4000');
    expect(
      raiz.querySelector('[data-resumen-por-cobrar]')?.nextElementSibling?.textContent,
    ).toContain('con tarjeta no baja');
  });

  it('PRU-CMP-COBRO-101 [CA-45.5] una partida cerrada no ofrece cobrar ni condonar; sin deudores dice «Nadie te debe nada» y el interruptor lleva a los cerrados', () => {
    const cerrada = mostrar(
      <PantallaPorCobrar
        dto={dto([ana([partida({ abierto: 0, restituido: 2500, estado: 'cerrado' })], 0)], 0, 0)}
        cerrados
      />,
    );
    const fila = cerrada.querySelector('[data-partida="l1"]');
    expect(fila?.textContent).toContain('Cerrado');
    expect(fila?.querySelectorAll('a')).toHaveLength(0);
    expect(cerrada.querySelector('[role="switch"]')?.getAttribute('aria-checked')).toBe('true');

    const vacia = mostrar(<PantallaPorCobrar dto={dto([], 0, 0)} cerrados={false} />);
    expect(vacia.textContent).toContain('Nadie te debe nada');
    const interruptor = vacia.querySelector('[role="switch"]');
    expect(interruptor?.getAttribute('href')).toBe('/por-cobrar?cerrados=1');
    expect(interruptor?.getAttribute('aria-checked')).toBe('false');
  });

  it('PRU-CMP-COBRO-101 la pantalla con deudores y la vacía no tienen violaciones de accesibilidad', async () => {
    const con = dto([ana([partida(), partida({ lineaId: 'l2', comercio: null })])]);
    for (const arbol of [
      <PantallaPorCobrar key="con" dto={con} cerrados={false} />,
      <PantallaPorCobrar key="sin" dto={dto([], 0, 0)} cerrados />,
    ]) {
      const raiz = mostrar(arbol);
      const resultado = await axe.run(raiz, { rules: { 'color-contrast': { enabled: false } } });
      expect(
        resultado.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.html).join(' | ')}`),
      ).toEqual([]);
      const { raiz: arboles, nodo } = montados.splice(0)[0] as (typeof montados)[number];
      act(() => {
        arboles.unmount();
      });
      nodo.remove();
    }
  });
});
