// FT-08, propuesta de AV-08 de un toque (07 §17: el estado de un componente es una CMP). La acción la pone el lector: la prueba le da
// una propia, sin servidor. Que Listo para asignar suba lo prueba la E2E (PRU-E2E-INICIO-140).
import type { InicioDto } from '@finn/aplicacion/consultas/inicio';
import type { Centavos } from '@finn/dominio/valores';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../globals.css';
import type { AccionEscritura } from '../../formularios/use-operacion';
import { inicio as t } from '../../textos/inicio';
import { ReservaExcedente } from './reserva-excedente';

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

// Pago T con Asignado $100.00 y reserva excedente de $30.00: el selector entrega Asig − RE = $70.00 (PF-3: la pantalla no resta).
const FILA = {
  tarjeta: { id: 't-1', nombre: 'T' },
  monto: 3000 as Centavos,
  categoriaPagoId: 'c-1',
  periodoInicio: '2027-02-21',
  asignado: 10000 as Centavos,
  montoNuevo: 7000 as Centavos,
} as unknown as InicioDto['atencion']['reservaExcedente'][number];

function montar(accion: AccionEscritura): HTMLElement {
  const nodo = document.createElement('main');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(<ReservaExcedente filas={[FILA]} accion={accion} />);
  });
  montados.push({ raiz, nodo });
  return nodo;
}

const boton = (nodo: HTMLElement, texto: string): HTMLButtonElement => {
  const b = [...nodo.querySelectorAll('button')].find((x) => x.textContent.includes(texto));
  if (b === undefined) throw new Error(`no hay botón «${texto}»`);
  return b;
};

const tocar = async (b: HTMLButtonElement): Promise<void> => {
  await act(async () => {
    b.click();
    await Promise.resolve();
  });
};

const ok = () => Promise.resolve({ ok: true as const, valor: {}, avisos: [], yaAplicada: false });

describe('PRU-CMP-INICIO', () => {
  it('PRU-CMP-INICIO-140 [CA-08.7] la propuesta de AV-08 manda OP-14 con el monto nuevo y lo asignado del DTO, y después ofrece "Deshacer" con los dos valores intercambiados', async () => {
    const accion = vi.fn(ok);
    const nodo = montar(accion);
    expect(nodo.textContent).toContain('reservado de más');
    await tocar(boton(nodo, t.devolverReserva('$30.00')));
    expect(accion).toHaveBeenLastCalledWith(
      expect.objectContaining({
        categoriaId: 'c-1',
        periodoInicio: '2027-02-21',
        montoNuevo: '70.00',
        esperado: { monto: '100.00' },
      }),
    );
    expect(nodo.textContent).toContain(t.reservaDevuelta('T', '$30.00'));

    await tocar(boton(nodo, t.deshacer));
    expect(accion).toHaveBeenLastCalledWith(
      expect.objectContaining({ montoNuevo: '100.00', esperado: { monto: '70.00' } }),
    );
    expect(nodo.textContent).not.toContain(t.reservaDevuelta('T', '$30.00'));
  });

  it('PRU-CMP-INICIO-141 [CA-08.7] si la acción falla muestra el mensaje en línea y no ofrece "Deshacer"', async () => {
    const accion = vi.fn(() =>
      Promise.resolve({
        ok: false as const,
        error: { categoria: 'INTERNO', codigo: 'interno', mensaje: 'No se pudo guardar.' },
      }),
    );
    const nodo = montar(accion as unknown as AccionEscritura);
    await tocar(boton(nodo, t.devolverReserva('$30.00')));
    expect(nodo.querySelector('[role="status"]')?.textContent).toContain('No se pudo guardar.');
    expect(nodo.textContent).not.toContain(t.deshacer);
  });
});
