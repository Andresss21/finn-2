// CH-248 (E2-13): Mover no ofrece «Deshacer». La inversa sería otra OP-15 y su `esperado` pide las dos asignaciones de después del
// movimiento; ni OP-15 (`salida: {}`) ni su previsualización (solo `deltaDisponible`) las devuelven, y la interfaz no las calcula
// (PF-3) ni usa un `esperado` falso (anularía la protección de concurrencia, CP-10a).
import { act } from 'react';
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

const O = '3f2b8a1e-0c4d-4e6a-9b7f-1a2b3c4d5e6f';

describe('PRU-CMP-PRES-795 el resultado de Mover no ofrece «Deshacer»', () => {
  it('PRU-CMP-PRES-795 [CA-E6-17] el resultado de Mover dice el monto movido, sin «Deshacer» y sin llamar al servidor', () => {
    const asignar = vi.fn();
    const nodo = document.createElement('div');
    document.body.append(nodo);
    const raiz = createRoot(nodo);
    montados.push({ raiz, nodo });
    act(() => {
      raiz.render(
        <ResultadoDelFlujo
          categoriaId={O}
          nombre="Supermercado"
          periodoInicio="2027-04-01"
          resultado={{ tipo: 'movido', monto: '25.50' } as const}
          asignar={asignar as never}
        />,
      );
    });
    expect(nodo.textContent).toContain('Moviste $25.50.');
    expect(nodo.querySelector('button')).toBeNull();
    expect(asignar).not.toHaveBeenCalled();
    expect(nodo.innerHTML).not.toContain('Deshacer');
  });
});

describe('PRU-CMP-PRES-796 el resultado de Mover en la URL', () => {
  it('PRU-CMP-PRES-796 [CA-E6-17] la ruta lleva solo el monto movido y se lee de vuelta; un valor con más datos no se muestra', () => {
    const ruta = rutaConResultado(`/presupuesto/categorias/${O}`, {
      tipo: 'movido',
      monto: '25.50',
    });
    expect(ruta).toBe(`/presupuesto/categorias/${O}?resultado=movido%3A25.50`);
    expect(leerResultadoPresupuesto('movido:25.50')).toEqual({ tipo: 'movido', monto: '25.50' });
    expect(leerResultadoPresupuesto(`movido:25.50:${O}`)).toBeUndefined();
  });
});
