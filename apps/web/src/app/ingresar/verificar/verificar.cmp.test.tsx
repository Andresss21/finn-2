// PRU-CMP-ACCESO (07 §17: un texto, un estado o el foco de un componente): el campo de código de /ingresar/verificar
// (05 §9.4, FE-38). La Server Action se reemplaza por una función; lo que se prueba es lo que hace la pantalla con ella.
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import type { ResultadoAccion } from '@finn/aplicacion/errores';
import '../../../app/globals.css';
import { autenticacion } from '../../../textos/autenticacion';
import { ingreso } from '../../../textos/ingreso';
import { FormularioVerificar } from './formulario-verificar';

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
  const nodo = document.createElement('main');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(ui);
  });
  montados.push({ raiz, nodo });
  return nodo;
}

type Accion = (entrada: unknown) => Promise<ResultadoAccion<unknown>>;
const RUTAS = { ingresar: '/ingresar', verificar: '/x', inscribir: '/y', destino: '/' };
const FACTORES = [{ id: 'f-1', nombre: 'Autenticador' }];
// Un objeto nuevo por respuesta, como las que deserializa la Server Action
const codigoIncorrecto = (): ResultadoAccion<unknown> => ({
  ok: false,
  error: {
    categoria: 'DOMINIO',
    codigo: 'codigo_incorrecto',
    mensaje: autenticacion.codigo_incorrecto,
  },
});

function pantalla(accion: Accion) {
  const nodo = montar(
    <FormularioVerificar
      accion={accion}
      accionSalir={() => Promise.resolve({ ok: true, valor: {}, yaAplicada: false, avisos: [] })}
      factores={FACTORES}
      rutas={RUTAS}
    />,
  );
  const campo = nodo.querySelector<HTMLInputElement>('input[autocomplete="one-time-code"]');
  if (campo === null) throw new Error('falta el campo de código');
  const boton = [...nodo.querySelectorAll('button')].find(
    (b) => b.textContent === ingreso.verificar,
  );
  if (boton === undefined) throw new Error('falta el botón Verificar');
  return { nodo, campo, boton };
}

describe('PRU-CMP-ACCESO', () => {
  it('PRU-CMP-ACCESO-101 [CA-01.3] un código incorrecto muestra su mensaje y deja el campo vacío y con el foco', async () => {
    const accion = vi.fn<Accion>(() => Promise.resolve(codigoIncorrecto()));
    const { nodo, campo } = pantalla(accion);
    await userEvent.click(campo);
    await userEvent.keyboard('123456');
    await act(async () => {
      await userEvent.keyboard('{Enter}');
    });
    await vi.waitFor(() => {
      expect(nodo.textContent).toContain(autenticacion.codigo_incorrecto);
    });
    expect(accion).toHaveBeenCalledTimes(1);
    await vi.waitFor(() => {
      expect(campo.value).toBe('');
      expect(document.activeElement).toBe(campo);
    });
  });

  it('PRU-CMP-ACCESO-102 [CA-01.4] con los 6 dígitos escritos no se envía nada hasta tocar Verificar o Enter', async () => {
    const accion = vi.fn<Accion>(() => Promise.resolve(codigoIncorrecto()));
    const { campo, boton } = pantalla(accion);
    await userEvent.click(campo);
    await userEvent.keyboard('123456');
    await act(() => Promise.resolve());
    expect(campo.value).toBe('123456');
    expect(accion).not.toHaveBeenCalled();
    await act(async () => {
      await userEvent.click(boton);
    });
    await vi.waitFor(() => {
      expect(accion).toHaveBeenCalledTimes(1);
    });
  });

  it('PRU-CMP-ACCESO-103 [CA-01.7] el código pegado como "123 456" o "123-456" se envía como 123456', async () => {
    const accion = vi.fn<Accion>(() => Promise.resolve(codigoIncorrecto()));
    const { campo } = pantalla(accion);
    for (const [vez, pegado] of ['123 456', '123-456'].entries()) {
      await userEvent.fill(campo, pegado); // de una vez, como un pegado
      await act(async () => {
        await userEvent.keyboard('{Enter}');
      });
      await vi.waitFor(() => {
        expect(accion).toHaveBeenCalledTimes(vez + 1);
      });
      expect(accion).toHaveBeenLastCalledWith(
        expect.objectContaining({ codigo: '123456', factorId: 'f-1' }),
      );
      await vi.waitFor(() => {
        expect(campo.value).toBe(''); // el error de código vacía el campo (CA-01.3)
      });
    }
  });
});
