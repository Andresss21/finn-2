// PRU-CMP-ACCESO (07 §17: un texto, un estado o el foco de un componente): el código de /ingresar/verificar en seis casillas
// (05 §9.4, FE-38 [CH-241]). La Server Action se reemplaza por una función; lo que se prueba es lo que hace la pantalla con ella.
// `campo` es la primera casilla (la del `one-time-code`); `escrito()` junta lo que muestran las seis.
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import type { ResultadoAccion } from '@finn/aplicacion/errores';
import '../../../app/globals.css';
import { autenticacion } from '../../../textos/autenticacion';
import { codigoTotp } from '../../../textos/codigo-totp';
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
  const casillas = () => [...nodo.querySelectorAll<HTMLInputElement>('[role="group"] input')];
  const escrito = () =>
    casillas()
      .map((c) => c.value)
      .join('');
  return { nodo, campo, boton, casillas, escrito };
}

/** El color de un token, resuelto como lo pinta el navegador. */
function colorDe(token: string): string {
  const muestra = document.createElement('span');
  muestra.style.color = `var(${token})`;
  document.body.append(muestra);
  const color = getComputedStyle(muestra).color;
  muestra.remove();
  return color;
}

/** Un pegado real: el evento `paste` con el texto en el portapapeles. */
function pegar(casilla: HTMLInputElement, texto: string): void {
  const datos = new DataTransfer();
  datos.setData('text/plain', texto);
  act(() => {
    casilla.dispatchEvent(
      new ClipboardEvent('paste', { clipboardData: datos, bubbles: true, cancelable: true }),
    );
  });
}

describe('PRU-CMP-ACCESO', () => {
  it('PRU-CMP-ACCESO-101 [CA-01.3] un código incorrecto muestra su mensaje y deja el campo vacío y con el foco', async () => {
    const accion = vi.fn<Accion>(() => Promise.resolve(codigoIncorrecto()));
    const { nodo, campo, escrito } = pantalla(accion);
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
      expect(escrito()).toBe('');
      expect(document.activeElement).toBe(campo);
    });
  });

  it('PRU-CMP-ACCESO-102 [CA-01.4] con los 6 dígitos escritos no se envía nada hasta tocar Verificar o Enter', async () => {
    const accion = vi.fn<Accion>(() => Promise.resolve(codigoIncorrecto()));
    const { campo, boton, escrito } = pantalla(accion);
    await userEvent.click(campo);
    await userEvent.keyboard('123456');
    await act(() => Promise.resolve());
    expect(escrito()).toBe('123456');
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
    const { campo, escrito } = pantalla(accion);
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
        expect(escrito()).toBe(''); // el error de código vacía el campo (CA-01.3)
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
    const { nodo, campo, escrito } = pantalla(accion);
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
      expect(escrito()).toBe('');
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
      getComputedStyle(document.documentElement).getPropertyValue('--duracion-confirmacion').trim(),
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

describe('PRU-CMP-ACCESO seis casillas (CH-241)', () => {
  it('PRU-CMP-ACCESO-721 [CA-E2-2] completar los 6 dígitos no envía nada; Enter o «Verificar» envían una vez el código de 6 dígitos', async () => {
    for (const gesto of ['Enter', 'Verificar'] as const) {
      const accion = vi.fn<Accion>(() => Promise.resolve(codigoIncorrecto()));
      const { nodo, campo, boton, casillas } = pantalla(accion);
      await userEvent.click(campo);
      await userEvent.keyboard('482193');
      await act(() => Promise.resolve());
      // Cada dígito en su casilla y el foco en la sexta: nada se envió solo.
      expect(casillas().map((c) => c.value)).toEqual(['4', '8', '2', '1', '9', '3']);
      expect(document.activeElement).toBe(casillas()[5]);
      expect(accion).not.toHaveBeenCalled();
      await act(async () => {
        if (gesto === 'Enter') await userEvent.keyboard('{Enter}');
        else await userEvent.click(boton);
      });
      await vi.waitFor(() => {
        expect(nodo.textContent).toContain(autenticacion.codigo_incorrecto);
      });
      expect(accion).toHaveBeenCalledTimes(1);
      expect(accion).toHaveBeenCalledWith(
        expect.objectContaining({ factorId: 'f-1', codigo: '482193' }),
      );
      nodo.remove(); // la segunda vuelta busca sus casillas en su propio nodo
    }
  });

  it('PRU-CMP-ACCESO-722 [CA-E2-2] pegar «123 456» reparte los 6 dígitos; un solo nombre para el grupo y one-time-code en la primera; con 4, «Faltan 2 dígitos…»', async () => {
    const accion = vi.fn<Accion>(() => Promise.resolve(codigoIncorrecto()));
    const { nodo, campo, boton, casillas, escrito } = pantalla(accion);
    // Un solo grupo con nombre; las casillas, «Dígito n de 6»; solo la primera ofrece el código del teléfono.
    const grupos = nodo.querySelectorAll('[role="group"]');
    expect(grupos).toHaveLength(1);
    const grupo = grupos[0] as HTMLElement;
    expect(grupo.getAttribute('aria-label')).toBe(ingreso.codigo);
    expect(nodo.querySelector('label')).toBeNull(); // sin etiqueta visible sobre las casillas (ACC-05)
    expect(casillas().map((c) => c.getAttribute('autocomplete'))).toEqual([
      'one-time-code',
      'off',
      'off',
      'off',
      'off',
      'off',
    ]);
    expect(casillas().map((c) => c.getAttribute('aria-label'))).toEqual(
      [1, 2, 3, 4, 5, 6].map((n) => codigoTotp.casilla(n)),
    );
    expect(casillas().every((c) => c.inputMode === 'numeric')).toBe(true);
    // Cada casilla mide 44 × 52 (tocable ≥ 44).
    const caja = campo.getBoundingClientRect();
    expect([Math.round(caja.width), Math.round(caja.height)]).toEqual([44, 52]);

    await userEvent.click(campo);
    pegar(campo, '123 456');
    expect(casillas().map((c) => c.value)).toEqual(['1', '2', '3', '4', '5', '6']);
    expect(accion).not.toHaveBeenCalled(); // pegar tampoco envía

    // Retroceso: la sexta se vacía; en la vacía, vuelve a la quinta y la vacía.
    await userEvent.keyboard('{Backspace}');
    expect(escrito()).toBe('12345');
    await userEvent.keyboard('{Backspace}');
    expect(escrito()).toBe('1234');
    expect(document.activeElement).toBe(casillas()[4]);

    await act(async () => {
      await userEvent.click(boton);
    });
    await vi.waitFor(() => {
      expect(nodo.textContent).toContain(codigoTotp.faltan(2));
    });
    expect(codigoTotp.faltan(2)).toMatch(/^Faltan 2 dígitos\./);
    expect(accion).not.toHaveBeenCalled();
    // El foco en la primera vacía; las vacías con el borde de problema y las llenas con la línea de la acción.
    expect(document.activeElement).toBe(casillas()[4]);
    (document.activeElement as HTMLElement).blur();
    const bordes = casillas().map((c) => getComputedStyle(c).borderBottomColor);
    expect(bordes.slice(4)).toEqual([colorDe('--problema-borde'), colorDe('--problema-borde')]);
    expect(bordes.slice(0, 4)).toEqual(Array<string>(4).fill(colorDe('--accion')));
    // El mensaje queda bajo las casillas y las describe (ACC-03).
    const mensaje = document.getElementById(grupo.getAttribute('aria-describedby') ?? '');
    expect(mensaje?.textContent).toBe(codigoTotp.faltan(2));
    expect(
      grupo.compareDocumentPosition(mensaje as Node) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).not.toBe(0);
  });
});
