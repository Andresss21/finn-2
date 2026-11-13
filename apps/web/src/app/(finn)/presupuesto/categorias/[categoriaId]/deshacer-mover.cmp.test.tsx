// CH-248 (E2-13): sin las dos asignaciones de después del movimiento, Mover no ofrece «Deshacer»: la interfaz no las calcula (PF-3)
// ni usa un `esperado` falso (anularía la protección de concurrencia, CP-10a). [CH-254] OP-15 ahora las devuelve y la URL las lleva
// con la inversa: con ellas sí lo ofrece (PRU-CMP-PRES-800 y 801); sin ellas, sigue sin ofrecerlo (795 y 796).
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

const D = '7a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d';

describe('PRU-CMP-PRES-800 «Deshacer» de Mover', () => {
  it('PRU-CMP-PRES-800 [CA-E6-17] con la inversa, «Deshacer» envía OP-15 con el mismo monto, origen y destino intercambiados y las asignaciones devueltas como esperado; después dice que se deshizo', async () => {
    const mover = vi.fn(() =>
      Promise.resolve({
        ok: true as const,
        valor: { asignacionOrigen: 15000, asignacionDestino: 7450 },
        yaAplicada: false as const,
        avisos: [],
      }),
    );
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
          resultado={{
            tipo: 'movido',
            monto: '25.50',
            inversa: {
              origenId: D,
              destinoId: O,
              asignacionOrigen: '150.00',
              asignacionDestino: '74.50',
            },
          }}
          asignar={asignar as never}
          mover={mover}
        />,
      );
    });
    expect(nodo.textContent).toContain('Moviste $25.50.');
    const deshacer = nodo.querySelector('button');
    expect(deshacer?.textContent).toBe('Deshacer');
    await act(() => {
      deshacer?.click();
      return Promise.resolve();
    });
    expect(mover).toHaveBeenCalledTimes(1);
    expect(mover).toHaveBeenCalledWith({
      origenId: D,
      destinoId: O,
      periodoInicio: '2027-04-01',
      monto: '25.50',
      modo: 'confirmar',
      esperado: { asignacionOrigen: '150.00', asignacionDestino: '74.50' },
    });
    expect(asignar).not.toHaveBeenCalled();
    expect(nodo.textContent).toContain('Deshiciste el movimiento de $25.50.');
    expect(nodo.querySelector('button')).toBeNull();
  });
});

describe('PRU-CMP-PRES-801 la inversa de Mover en la URL', () => {
  it('PRU-CMP-PRES-801 [CA-E6-17] la ruta lleva el monto y la inversa tal cual y se lee de vuelta; una inversa incompleta, con un id que no es UUID o con el mismo origen y destino no se muestra', () => {
    const inversa = {
      origenId: D,
      destinoId: O,
      asignacionOrigen: '150.00',
      asignacionDestino: '-10.25',
    };
    const ruta = rutaConResultado(`/presupuesto/categorias/${O}`, {
      tipo: 'movido',
      monto: '25.50',
      inversa,
    });
    const valor = new URL(ruta, 'https://finn.local').searchParams.get('resultado') ?? '';
    expect(valor).toBe(`movido:25.50:${D}:${O}:150.00:-10.25`);
    expect(leerResultadoPresupuesto(valor)).toEqual({ tipo: 'movido', monto: '25.50', inversa });
    for (const malo of [
      `movido:25.50:${D}:${O}:150.00`,
      `movido:25.50:${D}:${O}:150.00:-10.25:1`,
      `movido:25.50:no-es-uuid:${O}:150.00:-10.25`,
      `movido:25.50:${O}:${O}:150.00:-10.25`,
      `movido:25.50:${D}:${O}:150:abc`,
    ])
      expect(leerResultadoPresupuesto(malo)).toBeUndefined();
  });
});
