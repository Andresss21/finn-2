// CH-248 (E2-13): el resultado de Mover en el detalle ofrece «Deshacer»: otra OP-15 con el mismo monto y origen y destino
// intercambiados. La interfaz no conoce las asignaciones de después: pide con un `esperado` que no coincide y repite con las
// `actuales` que devuelve el servidor (nada se calcula, PF-3).
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../../../../app/globals.css';
import {
  leerResultadoPresupuesto,
  rutaConResultado,
} from '../../../../../flujos/presupuesto-asignar-categoria/resultado';
import { ResultadoDelFlujo } from './resultado';

vi.mock('next/navigation', () => ({ usePathname: () => '/', useRouter: () => ({}) }));
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
const clic = async (nodo: HTMLElement, texto: string) => {
  const b = [...nodo.querySelectorAll('button')].find((x) => x.textContent === texto);
  await act(() => {
    b?.click();
    return Promise.resolve();
  });
};

const O = '3f2b8a1e-0c4d-4e6a-9b7f-1a2b3c4d5e6f';
const D = '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d';
const props = { categoriaId: O, nombre: 'Supermercado', periodoInicio: '2027-04-01' };
const movido = { tipo: 'movido', monto: '25.50', origenId: O, destinoId: D } as const;
const ok = { ok: true as const, valor: {}, yaAplicada: false as const, avisos: [] };
const conflicto = {
  ok: false as const,
  error: {
    categoria: 'CONFLICTO' as const,
    codigo: 'conflicto_desactualizado',
    mensaje: 'Cambió.',
    datos: { actuales: { asignacionOrigen: '40.00', asignacionDestino: '75.50' } },
  },
};

describe('PRU-CMP-PRES-795 el resultado de Mover lleva sus dos categorías en la URL', () => {
  it('PRU-CMP-PRES-795 [CA-E6-17] la ruta lleva monto, origen y destino y se lee de vuelta; sin ids sigue valiendo y con ids mal formados no se muestra', () => {
    const ruta = rutaConResultado(`/presupuesto/categorias/${O}`, movido);
    expect(ruta).toBe(`/presupuesto/categorias/${O}?resultado=movido%3A25.50%3A${O}%3A${D}`);
    expect(leerResultadoPresupuesto(`movido:25.50:${O}:${D}`)).toEqual(movido);
    expect(leerResultadoPresupuesto('movido:25.50')).toEqual({ tipo: 'movido', monto: '25.50' });
    for (const malo of [`movido:25.50:${O}`, `movido:25.50:${O}:${O}`, 'movido:25.50:x:y'])
      expect(leerResultadoPresupuesto(malo)).toBeUndefined();
  });
});

describe('PRU-CMP-PRES-796 «Deshacer» de Mover', () => {
  it('PRU-CMP-PRES-796 [CA-E6-17] previsualiza la inversa con el mismo monto y origen y destino intercambiados, y al confirmar queda deshecho', async () => {
    const mover = vi.fn(() => Promise.resolve(ok));
    const nodo = montar(
      <ResultadoDelFlujo {...props} resultado={movido} asignar={vi.fn()} mover={mover} />,
    );
    expect(nodo.textContent).toContain('Moviste $25.50.');
    await clic(nodo, 'Deshacer');
    expect(mover).toHaveBeenCalledTimes(1);
    expect(mover).toHaveBeenLastCalledWith(
      expect.objectContaining({
        origenId: D,
        destinoId: O,
        periodoInicio: '2027-04-01',
        monto: '25.50',
        modo: 'previsualizar',
      }),
    );
    await clic(nodo, 'Confirmar');
    expect(mover).toHaveBeenLastCalledWith(
      expect.objectContaining({ origenId: D, destinoId: O, monto: '25.50', modo: 'confirmar' }),
    );
    expect(nodo.textContent).toContain('Deshiciste el movimiento.');
    expect(nodo.querySelector('button')).toBeNull();
  });

  it('PRU-CMP-PRES-796 [CA-E6-17] si el servidor dice que las asignaciones son otras, repite con las actuales que él devuelve', async () => {
    const mover = vi.fn().mockResolvedValueOnce(conflicto).mockResolvedValueOnce(ok);
    const nodo = montar(
      <ResultadoDelFlujo {...props} resultado={movido} asignar={vi.fn()} mover={mover} />,
    );
    await clic(nodo, 'Deshacer');
    expect(mover).toHaveBeenCalledTimes(2);
    expect(mover).toHaveBeenLastCalledWith(
      expect.objectContaining({
        esperado: { asignacionOrigen: '40.00', asignacionDestino: '75.50' },
      }),
    );
    expect(nodo.textContent).toContain('Confirmar');
  });

  it('PRU-CMP-PRES-796 [CA-E6-17] un rechazo del servidor se muestra con su mensaje y un movimiento sin ids no ofrece «Deshacer»', async () => {
    const mover = vi.fn(() =>
      Promise.resolve({
        ok: false as const,
        error: {
          categoria: 'DOMINIO' as const,
          codigo: 'periodo_cerrado',
          mensaje: 'Período cerrado.',
        },
      }),
    );
    const nodo = montar(
      <ResultadoDelFlujo {...props} resultado={movido} asignar={vi.fn()} mover={mover} />,
    );
    await clic(nodo, 'Deshacer');
    expect(nodo.textContent).toContain('Período cerrado.');
    expect(nodo.textContent).toContain('Moviste $25.50.');
    const sin = montar(
      <ResultadoDelFlujo
        {...props}
        resultado={{ tipo: 'movido', monto: '25.50' }}
        asignar={vi.fn()}
        mover={mover}
      />,
    );
    expect(sin.querySelector('button')).toBeNull();
  });
});
