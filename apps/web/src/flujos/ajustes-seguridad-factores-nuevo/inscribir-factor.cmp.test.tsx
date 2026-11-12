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

// `next/link` y `next/navigation` necesitan el enrutador de Next, que el navegador de prueba no tiene (el cierre lleva enlaces).
const reemplazar = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: reemplazar }) }));
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
  reemplazar.mockClear();
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

function montar(iniciar: Accion, completar: Accion, usados: readonly string[] = []): HTMLElement {
  const nodo = document.createElement('main');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(
      <InscribirFactor
        iniciar={iniciar}
        completar={completar}
        nombre="Respaldo"
        esRespaldo
        destino="/ajustes/seguridad"
        rutaIngresar="/ingresar"
        nombresUsados={usados}
      />,
    );
  });
  montados.push({ raiz, nodo });
  return nodo;
}

const boton = (nodo: HTMLElement, texto: string): HTMLButtonElement =>
  [...nodo.querySelectorAll('button')].find((b) =>
    b.textContent.includes(texto),
  ) as HTMLButtonElement;

/** El respaldo pide su nombre primero (E2-7): se toca «Seguir» con «Respaldo» ya escrito. */
async function seguir(nodo: HTMLElement): Promise<void> {
  await act(async () => {
    boton(nodo, ingreso.seguir).click();
    await Promise.resolve();
  });
}

async function pantalla(completar: Accion) {
  const nodo = montar(() => Promise.resolve(bien(INSCRIPCION)), completar);
  await seguir(nodo);
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
    // El respaldo no tiene pantalla de cierre: vuelve a Seguridad con el resultado (E2-7)
    expect(reemplazar).not.toHaveBeenCalled();
    await vi.waitFor(() => {
      expect(reemplazar).toHaveBeenCalledWith('/ajustes/seguridad?agregado=Respaldo');
    });
    expect(nodo.textContent).not.toContain(ingreso.tituloRespaldoListo);
    expect(completar).toHaveBeenCalledTimes(1);
  });
});

describe('PRU-CMP-ACCESO inscribir: preparando, copiado y error (CH-240)', () => {
  it('PRU-CMP-ACCESO-711 [] preparando muestra el esqueleto con aria-busy y el envío deshabilitado con su motivo', async () => {
    const nodo = montar(
      () => new Promise<never>(() => undefined),
      () => Promise.resolve(bien({})),
    );
    await seguir(nodo);
    expect(nodo.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(nodo.textContent).toContain(ingreso.preparando);
    const enviar = boton(nodo, ingreso.verificar);
    expect(enviar.disabled).toBe(true);
    const motivo = document.getElementById(enviar.getAttribute('aria-describedby') ?? '');
    expect(motivo?.textContent).toBe(ingreso.esperaCodigo);
  });

  it('PRU-CMP-ACCESO-712 [] copiar deja «Copiada» con el check en el botón, que mide 44 px', async () => {
    vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    const { nodo } = await pantalla(() => Promise.resolve(bien({})));
    const copiar = boton(nodo, ingreso.copiar);
    expect(copiar.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    await act(async () => {
      copiar.click();
      await Promise.resolve();
    });
    await vi.waitFor(() => {
      expect(copiar.textContent).toBe(ingreso.copiado);
    });
    expect(copiar.querySelector('[data-icono="check"]')).not.toBeNull();
  });

  it('PRU-CMP-ACCESO-713 [] si no se puede preparar, el aviso de problema trae el mensaje e «Intentar de nuevo» vuelve a pedir', async () => {
    const iniciar = vi.fn<Accion>(() =>
      Promise.resolve({
        ok: false,
        error: {
          categoria: 'DOMINIO',
          codigo: 'interno',
          mensaje: 'Algo falló. Referencia: ABC123',
        },
      }),
    );
    const nodo = montar(iniciar, () => Promise.resolve(bien({})));
    await seguir(nodo);
    await vi.waitFor(() => {
      expect(nodo.textContent).toContain(ingreso.errorPreparar);
    });
    expect(nodo.textContent).toContain('Referencia: ABC123');
    await act(async () => {
      boton(nodo, ingreso.intentarDeNuevo).click();
      await Promise.resolve();
    });
    expect(iniciar).toHaveBeenCalledTimes(2);
  });

  it('PRU-CMP-ACCESO-714 [] un nombre repetido se rechaza en el campo antes del QR; con otro nombre queda de solo lectura', async () => {
    const iniciar = vi.fn<Accion>(() => Promise.resolve(bien(INSCRIPCION)));
    const nodo = montar(iniciar, () => Promise.resolve(bien({})), ['Autenticador', 'respaldo']);
    await seguir(nodo);
    expect(nodo.textContent).toContain(ingreso.nombreRepetido);
    expect(iniciar).not.toHaveBeenCalled();
    const campo = nodo.querySelector('input') as HTMLInputElement;
    expect(campo.getAttribute('aria-invalid')).toBe('true');
    await userEvent.fill(campo, 'Mi gestor');
    await seguir(nodo);
    await vi.waitFor(() => {
      expect(iniciar).toHaveBeenCalledWith(expect.objectContaining({ nombre: 'Mi gestor' }));
    });
    await vi.waitFor(() => {
      expect(nodo.querySelector('input[autocomplete="one-time-code"]')).not.toBeNull();
    });
    expect((nodo.querySelector('input') as HTMLInputElement).readOnly).toBe(true);
  });
});
