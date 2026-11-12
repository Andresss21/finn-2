// PRU-CMP-ACCESO (07 §17: un texto, un estado o el foco de un componente): /ingresar sin alta ni recuperación (05 §9.3 [D4], CH-240).
// La Server Action se reemplaza por una función; lo que se prueba es lo que muestra la pantalla.
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import type { ResultadoAccion } from '@finn/aplicacion/errores';
import '../globals.css';
import { autenticacion } from '../../textos/autenticacion';
import { ingreso } from '../../textos/ingreso';
import { FormularioIngresar } from './formulario-ingresar';

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

const RUTAS = { ingresar: '/ingresar', verificar: '/x', inscribir: '/y', destino: '/' };
type Accion = (entrada: unknown) => Promise<ResultadoAccion<unknown>>;
const vacia: Accion = () => Promise.resolve({ ok: true, valor: {}, yaAplicada: false, avisos: [] });
const demasiados: Accion = () =>
  Promise.resolve({
    ok: false,
    error: {
      categoria: 'DOMINIO',
      codigo: 'demasiados_intentos',
      mensaje: autenticacion.demasiados_intentos,
    },
  });

function pantalla(accion: Accion = vacia): HTMLElement {
  const nodo = document.createElement('main');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(
      <FormularioIngresar
        accion={accion}
        cerrarSesion={vacia}
        rutas={RUTAS}
        usuarioNoPermitido={false}
      />,
    );
  });
  montados.push({ raiz, nodo });
  return nodo;
}

const botonIngresar = (nodo: HTMLElement): HTMLButtonElement =>
  [...nodo.querySelectorAll<HTMLButtonElement>('button[type="submit"]')].find(
    (b) => b.textContent === ingreso.ingresar,
  ) as HTMLButtonElement;

describe('PRU-CMP-ACCESO', () => {
  it('PRU-CMP-ACCESO-701 [CA-E2-1] Ingresar no tiene alta ni «Olvidé mi contraseña»: bajo el botón va la línea de ayuda, sin enlace', () => {
    const nodo = pantalla();
    expect(nodo.querySelector('a')).toBeNull();
    expect(nodo.textContent).not.toMatch(/registr|crear cuenta|primera vez|olvid[eé] mi/i);
    const boton = botonIngresar(nodo);
    const linea = [...nodo.querySelectorAll('p')].find(
      (p) => p.textContent === ingreso.sinRecuperacion,
    );
    expect(linea?.textContent).toBe(
      '¿Olvidaste la contraseña? Cambiala desde el panel de Supabase.',
    );
    expect(
      boton.compareDocumentPosition(linea as Element) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(nodo.querySelector('h1')?.textContent).toBe('Ingresá');
  });

  it('PRU-CMP-ACCESO-702 [CA-E2-1] el ojo es un botón de 44 px dentro del campo, no envía el formulario y conserva autocomplete', () => {
    const nodo = pantalla();
    const campo = nodo.querySelector<HTMLInputElement>('input[autocomplete="current-password"]');
    const ojo = nodo.querySelector<HTMLButtonElement>('button[aria-pressed]');
    expect(campo?.type).toBe('password');
    expect(ojo?.type).toBe('button');
    expect(ojo?.getAttribute('aria-label')).toBe(ingreso.mostrarContrasena);
    expect(ojo?.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    expect(ojo?.getBoundingClientRect().width).toBeGreaterThanOrEqual(44);
    expect(campo?.parentElement?.contains(ojo as Element)).toBe(true);
    act(() => {
      ojo?.click();
    });
    expect(campo?.type).toBe('text');
    expect(campo?.getAttribute('autocomplete')).toBe('current-password');
    expect(ojo?.getAttribute('aria-pressed')).toBe('true');
    expect(ojo?.getAttribute('aria-label')).toBe(ingreso.ocultarContrasena);
  });

  it('PRU-CMP-ACCESO-703 [CH-240] con «demasiados intentos» el botón queda deshabilitado y describido por el aviso', async () => {
    const nodo = pantalla(demasiados);
    const [email, clave] = [...nodo.querySelectorAll<HTMLInputElement>('input')];
    await userEvent.click(email as HTMLInputElement);
    await userEvent.keyboard('alguien@finn.test');
    await userEvent.click(clave as HTMLInputElement);
    await userEvent.keyboard('una-clave');
    await act(async () => {
      await userEvent.keyboard('{Enter}');
    });
    const boton = botonIngresar(nodo);
    await expect.poll(() => boton.disabled).toBe(true);
    const aviso = document.getElementById(boton.getAttribute('aria-describedby') ?? '');
    expect(aviso?.textContent).toContain(autenticacion.demasiados_intentos);
  });
});
