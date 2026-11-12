// CF-05 (05 §4.14), entrega 4 E6-15: el resultado de una propuesta de un reporte reemplaza al hallazgo, con su salida para revertir y sin
// tiempo límite. Solo la ofrece la operación que tiene inversa; las que abren una pantalla no escriben y no tienen salida. Los montos y las
// entradas salen del hallazgo del servidor: la pantalla solo los escribe como texto (PF-3).
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { ResultadoAccion } from '@finn/aplicacion/errores';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../../globals.css';
import { HallazgosRitmo, type Hallazgo } from './ritmo-hallazgos';
import {
  HallazgosSuscripciones,
  type AccionesSuscripciones,
  type HallazgoSuscripcion,
} from './suscripciones-hallazgos';

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

const ref = (id: string, nombre: string) => ({ id, nombre });
const ritmo = (accion: unknown) =>
  ({
    tipo: 'ritmo',
    clave: 'categoria:rest',
    impacto: 5556,
    estado: 'problema',
    categoria: ref('rest', 'Restaurantes'),
    exceso: 5556,
    sobregiroActual: 0,
    fin: '2027-03-20',
    accion,
  }) as unknown as Hallazgo;
const desactivada = {
  tipo: 'suscripcion',
  clave: 'comercio:netflix',
  impacto: 18588,
  estado: 'advertencia',
  comercio: 'NETFLIX',
  mensual: 1549,
  anual: 18588,
  desactivada: true,
  accion: { tipo: 'reactivar', programadaId: 'p7' },
} as unknown as HallazgoSuscripcion;

const OK: ResultadoAccion<unknown> = { ok: true, valor: {}, yaAplicada: false, avisos: [] };
const exito = () => vi.fn((): Promise<ResultadoAccion<unknown>> => Promise.resolve(OK));

const montar = (nodo: ReactNode): HTMLElement => {
  const caja = document.createElement('div');
  document.body.append(caja);
  const raiz = createRoot(caja);
  act(() => {
    raiz.render(nodo);
  });
  montados.push({ raiz, nodo: caja });
  return caja;
};
const boton = (raiz: HTMLElement, texto: string): HTMLButtonElement | undefined =>
  [...raiz.querySelectorAll('button')].find((x) => x.textContent === texto);
const tocar = async (b: HTMLButtonElement | undefined): Promise<void> => {
  await act(async () => {
    b?.click();
    await Promise.resolve();
  });
};

describe('PRU-CMP-REP propuestas con salida', () => {
  it('PRU-CMP-REP-721 [CA-E6-17] el resultado de «Asignar» ofrece «Deshacer» (OP-14 con los montos intercambiados) y la de reactivar, «Desactivarla»; «Revisar» no escribe ni ofrece salida', async () => {
    const asignar = exito();
    const raiz = montar(
      <HallazgosRitmo
        hallazgos={[ritmo({ tipo: 'asignar', montoNuevo: 17556, esperado: 12000 })]}
        periodoInicio="2027-02-21"
        asignar={asignar}
      />,
    );
    await tocar(boton(raiz, 'Asignar $55.56'));
    const resultado = raiz.querySelector('[data-ritmo-asignado]');
    expect(resultado?.textContent).toContain('Asignaste $55.56 a Restaurantes.');
    expect(boton(raiz, 'Deshacer')).toBeDefined();
    await tocar(boton(raiz, 'Deshacer'));
    expect(asignar).toHaveBeenLastCalledWith(
      expect.objectContaining({
        categoriaId: 'rest',
        montoNuevo: '120.00',
        esperado: { monto: '175.56' },
      }),
    );
    expect(raiz.querySelector('[data-ritmo-asignado]')).toBeNull();

    const gestionar = exito();
    const acciones: AccionesSuscripciones = { gestionar, eliminar: exito() };
    const otra = montar(<HallazgosSuscripciones hallazgos={[desactivada]} acciones={acciones} />);
    await tocar(boton(otra, 'Reactivarla'));
    expect(otra.querySelector('[data-suscripciones-hecho]')?.textContent).toContain(
      'Reactivaste NETFLIX.',
    );
    expect(boton(otra, 'Deshacer')).toBeUndefined();
    await tocar(boton(otra, 'Desactivarla'));
    expect(gestionar).toHaveBeenLastCalledWith(
      expect.objectContaining({ accion: 'activar', programadaId: 'p7', activa: false }),
    );

    const sinInversa = exito();
    const revisar = montar(
      <HallazgosRitmo
        hallazgos={[ritmo({ tipo: 'revisar', categoriaId: 'rest' })]}
        periodoInicio="2027-02-21"
        asignar={sinInversa}
      />,
    );
    expect(revisar.querySelector('button')).toBeNull();
    expect(revisar.querySelector('a')?.getAttribute('href')).toBe('/presupuesto/categorias/rest');
    expect(sinInversa).not.toHaveBeenCalled();
  });
});
