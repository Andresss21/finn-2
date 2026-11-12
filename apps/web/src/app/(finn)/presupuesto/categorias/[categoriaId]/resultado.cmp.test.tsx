// CH-248 (E2-13): el resultado de Asignar y de Mover queda en el detalle de la categoría, bajo sus botones. Se prueba la pieza que lo
// dibuja, el «Deshacer» de la asignación escrita y el contrato de la URL que lo lleva; el recorrido completo lo prueba la E2E.
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../../../../app/globals.css';
import {
  detalleDeVolver,
  enlaceDeFlujo,
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

const ID = '3f2b8a1e-0c4d-4e6a-9b7f-1a2b3c4d5e6f';
const DETALLE = `/presupuesto/categorias/${ID}?periodo=2027-04-01`;

describe('PRU-CMP-PRES-780 el resultado de Asignar y de Mover viaja en la URL del detalle', () => {
  it('PRU-CMP-PRES-780 la ruta lleva el resultado y se lee de vuelta; un valor mal formado no se muestra', () => {
    const asignado = { tipo: 'asignado', nuevo: '150.00', anterior: '100.00' } as const;
    const movido = { tipo: 'movido', monto: '25.50' } as const;
    expect(rutaConResultado(DETALLE, asignado)).toBe(
      `${DETALLE}&resultado=asignado%3A150.00%3A100.00`,
    );
    expect(rutaConResultado(`/presupuesto/categorias/${ID}`, movido)).toBe(
      `/presupuesto/categorias/${ID}?resultado=movido%3A25.50`,
    );
    expect(leerResultadoPresupuesto('asignado:150.00:100.00')).toEqual(asignado);
    expect(leerResultadoPresupuesto('asignado:-10.00:0.00')).toEqual({
      tipo: 'asignado',
      nuevo: '-10.00',
      anterior: '0.00',
    });
    expect(leerResultadoPresupuesto('asignado')).toEqual({ tipo: 'asignado' });
    expect(leerResultadoPresupuesto('movido:25.50')).toEqual(movido);
    for (const malo of [
      undefined,
      '',
      'asignado:abc:1.00',
      'asignado:1.00',
      'asignado:1.00:2.00:3.00',
      'movido',
      'movido:-5.00',
      'movido:5.00:1',
      'otro:1.00',
    ]) {
      expect(leerResultadoPresupuesto(malo)).toBeUndefined();
    }
  });

  it('PRU-CMP-PRES-780 el enlace del detalle a los flujos lleva ?volver= con su ruta, y solo esa ruta se acepta al volver', () => {
    expect(
      enlaceDeFlujo(`/presupuesto/asignar/${ID}`, `/presupuesto/categorias/${ID}`, undefined),
    ).toBe(`/presupuesto/asignar/${ID}?volver=%2Fpresupuesto%2Fcategorias%2F${ID}`);
    expect(enlaceDeFlujo(`/presupuesto/mover?categoria-origen=${ID}`, DETALLE, '2027-04-01')).toBe(
      `/presupuesto/mover?categoria-origen=${ID}&periodo=2027-04-01&volver=${encodeURIComponent(DETALLE)}`,
    );
    expect(detalleDeVolver(DETALLE)).toBe(DETALLE);
    for (const malo of [
      undefined,
      '',
      'https://ejemplo.com/presupuesto/categorias/' + ID,
      '//ejemplo.com',
      '/cuentas',
      `/presupuesto/categorias/${ID}/archivar`,
      `/presupuesto/categorias/${ID}?x=1`,
    ]) {
      expect(detalleDeVolver(malo)).toBeUndefined();
    }
  });
});

describe('PRU-CMP-PRES-781 el resultado bajo los botones del detalle', () => {
  const props = {
    categoriaId: ID,
    nombre: 'Supermercado',
    periodoInicio: '2027-04-01',
  };

  it('PRU-CMP-PRES-781 [CA-E6-17] asignar deja el resultado con «Deshacer», que es la asignación anterior con el valor visto como esperado', async () => {
    const asignar = vi.fn(() =>
      Promise.resolve({ ok: true as const, valor: {}, yaAplicada: false as const, avisos: [] }),
    );
    const nodo = montar(
      <ResultadoDelFlujo
        {...props}
        resultado={{ tipo: 'asignado', nuevo: '150.00', anterior: '100.00' }}
        asignar={asignar}
      />,
    );
    expect(nodo.querySelector('[data-testid="resultado"] p')?.textContent).toBe(
      'Asignaste $150.00 a Supermercado.',
    );
    const deshacer = nodo.querySelector('button');
    expect(deshacer?.textContent).toBe('Deshacer');
    await act(async () => {
      deshacer?.click();
    });
    expect(asignar).toHaveBeenCalledTimes(1);
    expect(asignar).toHaveBeenCalledWith({
      categoriaId: ID,
      periodoInicio: '2027-04-01',
      montoNuevo: '100.00',
      modo: 'confirmar',
      esperado: { monto: '150.00' },
    });
    expect(nodo.querySelector('[data-testid="resultado"] p')?.textContent).toBe(
      'Deshiciste la asignación de Supermercado.',
    );
    expect(nodo.querySelector('button')).toBeNull();
  });

  it('PRU-CMP-PRES-781 una asignación rápida (el valor lo calculó el servidor) y un mover muestran el resultado sin «Deshacer»', () => {
    const asignar = vi.fn();
    const rapida = montar(
      <ResultadoDelFlujo {...props} resultado={{ tipo: 'asignado' }} asignar={asignar} />,
    );
    expect(rapida.querySelector('[data-testid="resultado"]')?.textContent).toContain(
      'Guardaste la asignación de Supermercado.',
    );
    expect(rapida.querySelector('button')).toBeNull();
    const movido = montar(
      <ResultadoDelFlujo
        {...props}
        resultado={{ tipo: 'movido', monto: '25.5' }}
        asignar={asignar}
      />,
    );
    expect(movido.querySelector('[data-testid="resultado"]')?.textContent).toContain(
      'Moviste $25.50.',
    );
    expect(movido.querySelector('button')).toBeNull();
    expect(asignar).not.toHaveBeenCalled();
  });

  it('PRU-CMP-PRES-781 un rechazo del servidor al deshacer se muestra con su mensaje y el resultado sigue en su lugar', async () => {
    const asignar = vi.fn(() =>
      Promise.resolve({
        ok: false as const,
        error: {
          categoria: 'CONFLICTO' as const,
          codigo: 'conflicto_desactualizado',
          mensaje: 'Cambió.',
        },
      }),
    );
    const nodo = montar(
      <ResultadoDelFlujo
        {...props}
        resultado={{ tipo: 'asignado', nuevo: '150.00', anterior: '100.00' }}
        asignar={asignar}
      />,
    );
    await act(async () => {
      nodo.querySelector('button')?.click();
    });
    expect(nodo.textContent).toContain('Asignaste $150.00 a Supermercado.');
    expect(nodo.textContent).toContain('Cambió.');
  });
});
