// FT-36, «Aprobar todos» (07 §17: un texto o un estado de un componente es una CMP). El pago de tarjeta pendiente no se puede sembrar
// en la E2E (necesita un formato de SMS propio); aquí se prueba qué manda el botón y qué dice AV-19. La Server Action es el límite
// del servidor y se reemplaza; qué aprueba OP-38 lo prueba la integración.
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../globals.css';
import type { MovimientoDto } from '../../../componentes/dominio/movimiento-bandeja';
import { bandeja as t } from '../../../textos/bandeja';
import { AprobarTodos } from './aprobar-todos';

const { aprobar } = vi.hoisted(() => ({ aprobar: vi.fn() }));
vi.mock('../../../servidor/acciones/bandeja', () => ({ aprobarTodos: aprobar }));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const montados: { raiz: Root; nodo: HTMLElement }[] = [];
afterEach(() => {
  aprobar.mockReset();
  for (const { raiz, nodo } of montados.splice(0)) {
    act(() => {
      raiz.unmount();
    });
    nodo.remove();
  }
});

function montar(ui: ReactNode): HTMLElement {
  document.body.style.cssText = 'background: var(--fondo); color: var(--texto)';
  const nodo = document.createElement('main');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(ui);
  });
  montados.push({ raiz, nodo });
  return nodo;
}

const movimiento = (
  id: string,
  comercio: string,
  monto: number,
  resto: Partial<MovimientoDto> = {},
): MovimientoDto => ({
  id,
  estado: 'pendiente',
  sms: { texto: `Compra ${comercio}` },
  cuenta: { nombre: 'Visa Oro' },
  fecha: '2027-02-20',
  monto: monto as MovimientoDto['monto'],
  comercio,
  categoriaSugerida: null,
  aprobacion: { posible: true, faltantes: [] },
  ...resto,
});
const LISTO = movimiento('e1', 'SUPER SELECTOS', 4500);
const PAGO = movimiento('p1', 'Pago Visa', 20000, {
  tipoPropuesto: 'pago_tarjeta',
  aprobacion: { posible: false, faltantes: ['origen'], motivoNoElegible: 'pago_sin_origen' },
});

const esperar = () => act(() => new Promise<void>((r) => setTimeout(r, 0)));
const tocar = (boton: HTMLButtonElement | null) =>
  act(() => {
    boton?.click();
    return Promise.resolve();
  });

describe('PRU-CMP-BAND', () => {
  it('PRU-CMP-BAND-160 [CA-36.3] un pago de tarjeta pendiente no va en el lote y AV-19 dice «Elegí de qué cuenta salió el pago.»', async () => {
    aprobar.mockResolvedValue({
      ok: true,
      valor: { elementos: [{ movimientoId: 'e1', resultado: 'aprobado' }] },
      yaAplicada: false,
      avisos: [{ codigo: 'AV-19', mensaje: 'AV-19' }],
    });
    const nodo = montar(<AprobarTodos elegibles={['e1']} movimientos={[LISTO, PAGO]} />);
    const boton = nodo.querySelector('button');
    expect(boton?.textContent).toBe(t.aprobarTodos.boton(1));

    await tocar(boton);
    await esperar();

    expect(aprobar).toHaveBeenCalledTimes(1);
    const entrada = aprobar.mock.calls[0]?.[0] as { movimientoIds: string[]; ids: object };
    expect(entrada.movimientoIds).toEqual(['e1']); // el pago no se manda: necesita su cuenta de origen
    expect(Object.keys(entrada.ids)).toEqual(['e1']);
    expect(nodo.querySelector('[data-testid="resultado"]')?.textContent).toContain(
      t.aprobarTodos.aprobaste(1),
    );
    const aviso = nodo.querySelector('[data-testid="av-19"]');
    expect(aviso?.textContent).toContain('Pago Visa');
    expect(aviso?.textContent).toContain('Elegí de qué cuenta salió el pago.');
    expect(aviso?.querySelectorAll('li')).toHaveLength(1);
  });

  it('PRU-CMP-BAND-161 [FT-36] sin elegibles el botón «Aprobar todos» no aparece', () => {
    const nodo = montar(<AprobarTodos elegibles={[]} movimientos={[PAGO]} />);
    expect(nodo.querySelector('button')).toBeNull();
  });
});
