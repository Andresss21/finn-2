import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { DetalleCuentaDto } from '@finn/aplicacion/consultas/detalle-cuenta';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../../../app/globals.css';
import { PantallaDetalleCuenta } from './pantalla';

// `next/link` necesita `process`, que el navegador del proyecto no trae: el enlace se simula con un ancla (lo que prueba esta
// suite son los destinos y lo que dibuja la pantalla, no la navegación).
vi.mock('../../../../componentes/navegacion/enlace-finn', () => ({
  EnlaceFinn: ({
    href,
    children,
    className,
    'aria-label': etiqueta,
  }: {
    href: string;
    children?: ReactNode;
    className?: string;
    'aria-label'?: string;
  }) => (
    <a href={href} className={className} aria-label={etiqueta}>
      {children}
    </a>
  ),
}));

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

const activo = {
  inicio: '2027-02-21',
  fin: '2027-03-20',
  dias: 28,
  estado: 'activo',
  transicion: false,
  diasTranscurridos: 3,
  diasRestantes: 25,
};

/** Un DTO de `detalleCuenta()` armado a mano: la pantalla solo dibuja lo que trae. */
const dto = (parcial: Record<string, unknown> = {}): DetalleCuentaDto =>
  ({
    revision: 'r1',
    hoy: '2027-02-23',
    periodoActivo: activo,
    periodo: activo,
    notificacionesNoLeidas: 0,
    bandejaPorRevisar: 0,
    cuenta: {
      id: 'visa',
      nombre: 'Visa',
      tipo: 'efectivo',
      fechaApertura: '2027-01-21',
      archivada: false,
    },
    saldo: 0,
    saldoConfirmado: 0,
    navegacion: { anterior: '2027-01-21', siguiente: '2027-03-21' },
    movimientos: [],
    conciliaciones: [],
    programadas: [],
    acciones: {
      puedeArchivar: true,
      bloqueosArchivo: [],
      puedeEliminar: true,
      bloqueosEliminar: [],
    },
    ...parcial,
  }) as unknown as DetalleCuentaDto;

const mostrar = (d: DetalleCuentaDto, filtros: Record<string, string | undefined> = {}) =>
  montar(<PantallaDetalleCuenta dto={d} filtros={filtros} />);

const fila = (id: string, saldoDespues: number, efecto = -1000) => ({
  id,
  fecha: '2027-02-10',
  tipo: 'gasto',
  comercio: `Comercio ${id}`,
  montoPresentado: efecto,
  efectoEnCuenta: efecto,
  saldoDespues,
  estadoBancario: 'confirmada',
  marcas: {
    porCobrar: false,
    conDevoluciones: false,
    conciliada: false,
    programada: false,
    periodoCerrado: false,
  },
});

describe('PRU-CMP-CTA-104 pantalla de detalle de cuenta', () => {
  it('PRU-CMP-CTA-104 [CA-52.3] con ?periodo= de un período cerrado el selector ofrece los períodos vecinos y volver al actual, y sin él usa el selector del período activo', () => {
    const cerrado = mostrar(
      dto({
        periodo: {
          inicio: '2027-01-21',
          fin: '2027-02-20',
          dias: 31,
          estado: 'cerrado',
          transicion: false,
        },
        navegacion: { anterior: '2026-12-21', siguiente: '2027-02-21' },
      }),
      { periodo: '2027-01-21' },
    );
    expect(cerrado.querySelector('[data-selector-periodo="cerrado"]')).not.toBeNull();
    // El siguiente es el período activo: su enlace no lleva `?periodo=` (05 §3.4)
    const enlaces = [...cerrado.querySelectorAll('nav a')].map((a) => [
      a.textContent || a.getAttribute('aria-label'),
      a.getAttribute('href'),
    ]);
    expect(enlaces).toEqual([
      ['Período anterior', '/cuentas/visa?periodo=2026-12-21'],
      ['Período siguiente', '/cuentas/visa'],
      ['Ir al período actual', '/cuentas/visa'],
    ]);

    const actual = mostrar(dto());
    expect(actual.querySelector('[data-selector-periodo="activo"]')).not.toBeNull();
    expect(actual.querySelector('a[aria-label="Período anterior"]')?.getAttribute('href')).toBe(
      '/cuentas/visa?periodo=2027-01-21',
    );
  });

  it('PRU-CMP-CTA-104 [CA-52.5] la segunda página sigue el saldo corrido de la primera y conserva los filtros en los enlaces de más y de volver', () => {
    const pagina2 = mostrar(
      dto({
        movimientos: [fila('b', 3000, -1000), fila('a', 4000, -1000)],
        siguienteCursor: 'cursor-3',
      }),
      { tipo: 'gasto', cursor: 'cursor-2' },
    );
    const saldos = [...pagina2.querySelectorAll('[data-saldo-despues]')].map((s) =>
      s.getAttribute('data-saldo-despues'),
    );
    expect(saldos).toEqual(['3000', '4000']);
    const enlaces = [...pagina2.querySelectorAll('[data-movimientos] a')]
      .filter((a) => a.getAttribute('href')?.includes('/cuentas/'))
      .map((a) => [a.textContent, a.getAttribute('href')]);
    expect(enlaces).toEqual([
      ['Quitar filtros', '/cuentas/visa'],
      ['Volver a los más recientes', '/cuentas/visa?tipo=gasto'],
      ['Movimientos anteriores', '/cuentas/visa?tipo=gasto&cursor=cursor-3'],
    ]);
  });

  it('PRU-CMP-CTA-104 [Q-detalleCuenta] cada fila dibuja el saldo después y el efecto que trae el DTO, sin recalcularlos', () => {
    const raiz = mostrar(dto({ movimientos: [fila('a', 12345, -500)] }));
    const li = raiz.querySelector('[data-movimiento="a"]');
    expect(
      li?.querySelector('[data-saldo-despues] [data-centavos]')?.getAttribute('data-centavos'),
    ).toBe('12345');
    expect(li?.textContent).toContain('Efecto en la cuenta');
  });

  it('PRU-CMP-CTA-104 sin movimientos dice "Esta cuenta todavía no tiene movimientos"', () => {
    const raiz = mostrar(dto());
    expect(raiz.textContent).toContain('Esta cuenta todavía no tiene movimientos');
  });
});
