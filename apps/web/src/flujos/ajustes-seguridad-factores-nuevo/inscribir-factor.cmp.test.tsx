// PRU-CMP-ACCESO (07 §17: un estado o el foco de un componente): el código de la inscripción de un factor (05 §9.5, FE-37) con el
// movimiento de CH-221 b, igual que en `/ingresar/verificar`. Las Server Actions se reemplazan por funciones: lo que se prueba es
// lo que hace la pantalla con su respuesta; la inscripción y la sesión no cambian.
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import type { ResultadoAccion } from '@finn/aplicacion/errores';
import '../../app/globals.css';
import { autenticacion } from '../../textos/autenticacion';
import { ingreso } from '../../textos/ingreso';
import { InscribirFactor } from './inscribir-factor';

// `next/link` necesita el enrutador de Next, que el navegador de prueba no tiene (el cierre lleva enlaces).
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
  vi.restoreAllMocks();
});

type Accion = (entrada: unknown) => Promise<ResultadoAccion<unknown>>;
const bien = (valor: unknown): ResultadoAccion<unknown> => ({
  ok: true,
  valor,
  yaAplicada: false,
  avisos: [],
});
const codigoIncorrecto = (): ResultadoAccion<unknown> => ({
  ok: false,
  error: {
    categoria: 'DOMINIO',
    codigo: 'codigo_incorrecto',
    mensaje: autenticacion.codigo_incorrecto,
  },
});
const INSCRIPCION = {
  factorId: 'f-1',
  qrSvg: '<svg xmlns="http://www.w3.org/2000/svg"/>',
  secreto: 'ABCDEFGH',
};

async function pantalla(completar: Accion) {
  const nodo = document.createElement('main');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  await act(async () => {
    raiz.render(
      <InscribirFactor
        iniciar={() => Promise.resolve(bien(INSCRIPCION))}
        completar={completar}
        nombre="Respaldo"
        esRespaldo
        destino="/ajustes/seguridad"
        rutaIngresar="/ingresar"
      />,
    );
    await Promise.resolve();
  });
  montados.push({ raiz, nodo });
  await vi.waitFor(() => {
    expect(nodo.querySelector('input[autocomplete="one-time-code"]')).not.toBeNull();
  });
  const campo = nodo.querySelector<HTMLInputElement>(
    'input[autocomplete="one-time-code"]',
  ) as HTMLInputElement;
  return { nodo, campo };
}

const enviar = async (campo: HTMLInputElement, codigo: string) => {
  await userEvent.click(campo);
  await userEvent.keyboard(codigo);
  await act(async () => {
    await userEvent.keyboard('{Enter}');
  });
};

describe('PRU-CMP-ACCESO movimiento del código en la inscripción', () => {
  it('PRU-CMP-ACCESO-400 [CA-02.3] código incorrecto: el campo tiembla con el borde de problema y queda vacío y con el foco', async () => {
    const completar = vi.fn<Accion>(() => Promise.resolve(codigoIncorrecto()));
    const { nodo, campo } = await pantalla(completar);
    await enviar(campo, '123456');
    await vi.waitFor(() => {
      expect(nodo.querySelector('[data-temblor]')).not.toBeNull();
    });
    expect(getComputedStyle(nodo.querySelector('[data-temblor]') as Element).animationName).toBe(
      'fz-jitter',
    );
    expect(campo.className).toContain('border-problema-borde');
    expect(nodo.textContent).toContain(autenticacion.codigo_incorrecto);
    await vi.waitFor(() => {
      expect(campo.value).toBe('');
      expect(document.activeElement).toBe(campo);
    });
  });

  it('PRU-CMP-ACCESO-401 [CA-02.3] confirmado: el check entra con fz-pop-in y el cierre llega después de la espera del token', async () => {
    const completar = vi.fn<Accion>(() => Promise.resolve(bien({})));
    const { nodo, campo } = await pantalla(completar);
    await enviar(campo, '123456');
    await vi.waitFor(() => {
      expect(nodo.querySelector('[data-verificado]')).not.toBeNull();
    });
    expect(
      getComputedStyle(nodo.querySelector('[data-verificado] .fz-pop-in') as Element).animationName,
    ).toBe('fz-pop-in');
    expect(nodo.textContent).not.toContain(ingreso.tituloRespaldoListo);
    await vi.waitFor(() => {
      expect(nodo.textContent).toContain(ingreso.tituloRespaldoListo);
    });
    expect(completar).toHaveBeenCalledTimes(1);
  });
});
