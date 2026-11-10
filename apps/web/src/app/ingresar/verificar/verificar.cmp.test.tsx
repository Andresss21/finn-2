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
  vi.restoreAllMocks();
});

/** «Reducir movimiento» encendido: `matchMedia` de la preferencia responde `true`. */
function conMovimientoReducido(): void {
  const original = window.matchMedia.bind(window);
  vi.spyOn(window, 'matchMedia').mockImplementation((consulta: string) =>
    consulta === '(prefers-reduced-motion: reduce)'
      ? ({
          matches: true,
          media: consulta,
          addEventListener: () => undefined,
          removeEventListener: () => undefined,
        } as unknown as MediaQueryList)
      : original(consulta),
  );
}

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

function pantalla(accion: Accion, rutas = RUTAS) {
  const nodo = montar(
    <FormularioVerificar
      accion={accion}
      accionSalir={() => Promise.resolve({ ok: true, valor: {}, yaAplicada: false, avisos: [] })}
      factores={FACTORES}
      rutas={rutas}
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

describe('PRU-CMP-ACCESO movimiento del código', () => {
  const verificado = (): ResultadoAccion<unknown> => ({
    ok: true,
    valor: {},
    yaAplicada: false,
    avisos: [],
  });
  // El destino es un ancla: la navegación cambia el `hash` sin dejar la página de prueba.
  const conAncla = (ancla: string) => ({ ...RUTAS, destino: `#${ancla}` });

  it('PRU-CMP-ACCESO-110 [CA-01.3] código incorrecto: el campo tiembla con el borde de problema, queda vacío y con el foco, y con el mensaje', async () => {
    const accion = vi.fn<Accion>(() => Promise.resolve(codigoIncorrecto()));
    const { nodo, campo } = pantalla(accion);
    await userEvent.click(campo);
    await userEvent.keyboard('123456');
    await act(async () => {
      await userEvent.keyboard('{Enter}');
    });
    await vi.waitFor(() => {
      expect(nodo.querySelector('[data-temblor]')).not.toBeNull();
    });
    const envoltura = nodo.querySelector('[data-temblor]') as HTMLElement;
    expect(getComputedStyle(envoltura).animationName).toBe('fz-jitter');
    expect(getComputedStyle(envoltura).animationDuration).toBe('0.38s');
    expect(nodo.textContent).toContain(autenticacion.codigo_incorrecto);
    await vi.waitFor(() => {
      expect(campo.value).toBe('');
      expect(document.activeElement).toBe(campo);
    });
    // Sin el foco (que pinta su propio borde), el campo queda con el borde de problema.
    campo.blur();
    const borde = document.createElement('span');
    borde.style.color = 'var(--problema-borde)';
    document.body.append(borde);
    expect(getComputedStyle(campo).borderBottomColor).toBe(getComputedStyle(borde).color);
    borde.remove();
    await userEvent.click(campo);
    // Un segundo error vuelve a temblar (otro nombre de animación, el mismo campo).
    await userEvent.keyboard('654321');
    await act(async () => {
      await userEvent.keyboard('{Enter}');
    });
    await vi.waitFor(() => {
      expect(getComputedStyle(nodo.querySelector('[data-temblor]') as Element).animationName).toBe(
        'fz-jitter-otra',
      );
    });
    expect(nodo.querySelector('input[autocomplete="one-time-code"]')).toBe(campo);
  });

  it('PRU-CMP-ACCESO-110 [CA-01.3] con movimiento reducido el código incorrecto no tiembla', async () => {
    conMovimientoReducido();
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
    const envoltura = nodo.querySelector('[data-temblor]');
    expect(envoltura === null ? 'none' : getComputedStyle(envoltura).animationName).toBe('none');
  });

  it('PRU-CMP-ACCESO-111 [CA-01.4] verificado: el check aparece y la navegación ocurre después de la espera del token; seis dígitos escritos no envían solos', async () => {
    const accion = vi.fn<Accion>(() => Promise.resolve(verificado()));
    const { nodo, campo, boton } = pantalla(accion, conAncla('verificado-111'));
    await userEvent.click(campo);
    await userEvent.keyboard('123456');
    await act(() => Promise.resolve());
    expect(accion).not.toHaveBeenCalled();
    await act(async () => {
      await userEvent.click(boton);
    });
    await vi.waitFor(() => {
      expect(nodo.querySelector('[data-verificado]')).not.toBeNull();
    });
    // El check entra con fz-pop-in; la navegación todavía no ocurrió.
    const check = nodo.querySelector('[data-verificado] .fz-pop-in') as Element;
    expect(getComputedStyle(check).animationName).toBe('fz-pop-in');
    expect(window.location.hash).not.toBe('#verificado-111');
    await vi.waitFor(() => {
      expect(window.location.hash).toBe('#verificado-111');
    });
    expect(
      getComputedStyle(document.documentElement).getPropertyValue('--espera-verificado').trim(),
    ).toBe('650ms');
  });

  it('PRU-CMP-ACCESO-111 [CA-01.4] con movimiento reducido la navegación no espera', async () => {
    conMovimientoReducido();
    const accion = vi.fn<Accion>(() => Promise.resolve(verificado()));
    const { campo, boton } = pantalla(accion, conAncla('verificado-reducido'));
    await userEvent.click(campo);
    await userEvent.keyboard('123456');
    await act(async () => {
      await userEvent.click(boton);
    });
    await vi.waitFor(
      () => {
        expect(window.location.hash).toBe('#verificado-reducido');
      },
      { timeout: 300 },
    );
  });
});
