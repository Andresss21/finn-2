// FT-19 AV-14 en Presupuesto (07 §17: un texto, un estado o el foco de un componente es una CMP): una archivada con Disponible
// ofrece sacarlo de un toque (OP-11 con la propuesta del servidor) y el enlace al flujo. Los números los trae el DTO (PF-3).
import type { PresupuestoDto } from '@finn/aplicacion/consultas/presupuesto';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import '../../globals.css';
import { PantallaPresupuesto } from './pantalla';

// `next/link` necesita `process` y el enrutador de Next, que el navegador de prueba no tiene: se simula `next/link`.
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
  inicio: '2027-03-21',
  fin: '2027-04-20',
  dias: 31,
  estado: 'activo',
  transicion: false,
  diasTranscurridos: 1,
  diasRestantes: 30,
};
const ID = '11111111-1111-4111-8111-111111111111';
const dto = (disponible: number): PresupuestoDto =>
  ({
    revision: 'r1',
    hoy: '2027-03-22',
    periodoActivo: ACTIVO,
    notificacionesNoLeidas: 0,
    bandejaPorRevisar: 0,
    periodo: ACTIVO,
    navegacion: { anterior: '2027-02-21', siguiente: '2027-04-21' },
    lpa: 67000,
    enCamino: 0,
    lpaNegativo: false,
    grupos: [],
    pagosTarjeta: [],
    archivadasConDinero: [
      {
        categoria: { id: ID, nombre: 'Gimnasio', archivada: true },
        orden: 1,
        asignado: 2500,
        gastado: 0,
        arrastre: 0,
        disponible,
        sobregiro: null,
        meta: null,
        clasificacion: 'cubierta',
        asignadoEsperado: 2500,
        barra: null,
      },
    ],
    totales: { asignado: 0, gastado: 0, disponible: 0 },
  }) as unknown as PresupuestoDto;

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

describe('PRU-CMP-CATEG', () => {
  it('PRU-CMP-CATEG-108 [AV-14] una archivada con $25.00 ofrece sacarlos a Listo para asignar de un toque, con el Asignado del DTO como lo esperado, y el enlace al flujo', async () => {
    const sacar = vi.fn(() =>
      Promise.resolve({ ok: true as const, valor: {}, yaAplicada: false, avisos: [] }),
    );
    const nodo = montar(<PantallaPresupuesto dto={dto(2500)} sacar={sacar} />);
    const seccion = nodo.querySelector('[data-seccion="archivadas-con-dinero"]');
    expect(seccion?.querySelector('a')?.getAttribute('href')).toBe(
      `/presupuesto/categorias/${ID}/sacar`,
    );
    const boton = [...(seccion?.querySelectorAll('button') ?? [])].find((b) =>
      b.textContent.includes('Sacar $25.00 a Listo para asignar'),
    );
    expect(boton).toBeDefined();

    await userEvent.click(boton as HTMLButtonElement);
    expect(sacar).toHaveBeenCalledWith({
      categoriaId: ID,
      monto: '25.00',
      destino: 'lpa',
      esperado: { asignacionOrigen: '25.00' },
      modo: 'confirmar',
    });
  });

  it('PRU-CMP-CATEG-109 una archivada con Disponible negativo no ofrece sacar de un toque (AV-14 es solo con Disponible mayor que cero)', () => {
    const sacar = vi.fn();
    const nodo = montar(<PantallaPresupuesto dto={dto(-500)} sacar={sacar} />);
    expect([...nodo.querySelectorAll('button')].some((b) => b.textContent.includes('Sacar'))).toBe(
      false,
    );
  });
});
