// PRU-CMP-AJUS (07 §17: un estado de componente): la lista de factores de Ajustes > Seguridad con uno y con dos factores, y la hoja de
// quitar (05 §9.6, CH-240 E2-8, AJU-14, AJU-15). Solo se simulan `next/link` y `next/navigation`.
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ResultadoAccion } from '@finn/aplicacion/errores';
import '../../../globals.css';
import { FormularioQuitarFactor } from '../../../../flujos/ajustes-seguridad-factores-quitar/formulario';
import { autenticacion } from '../../../../textos/autenticacion';
import { seguridad } from '../../../../textos/seguridad';
import { ListaFactores } from './lista-factores';

vi.mock('next/link', async () => {
  const { createElement } = await import('react');
  const Enlace = ({ href, children, ...resto }: { href: string; children?: ReactNode }) =>
    createElement('a', { href, ...resto }, children);
  return Object.assign(Enlace, { default: Enlace, useLinkStatus: () => ({ pending: false }) });
});
const reemplazar = vi.fn();
const atras = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: reemplazar, back: atras }),
  usePathname: () => '/ajustes/seguridad',
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const montados: { raiz: Root; nodo: HTMLElement }[] = [];
afterEach(() => {
  for (const { raiz, nodo } of montados.splice(0)) {
    act(() => {
      raiz.unmount();
    });
    nodo.remove();
  }
  reemplazar.mockClear();
  atras.mockClear();
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

const AUTENTICADOR = {
  id: 'f-1',
  nombre: 'Autenticador',
  creadoEn: '2026-09-01T12:00:00.000Z',
  estado: 'verificado',
} as const;
const RESPALDO = { ...AUTENTICADOR, id: 'f-2', nombre: 'Respaldo' } as const;

describe('PRU-CMP-AJUS seguridad', () => {
  it('PRU-CMP-AJUS-731 [] con un solo factor, Seguridad muestra el aviso de advertencia y «Agregar un factor de respaldo», sin «Quitar»', () => {
    const nodo = montar(<ListaFactores factores={[AUTENTICADOR]} />);
    const aviso = nodo.querySelector('[data-estado="advertencia"]');
    expect(aviso?.textContent).toContain(autenticacion.factor_unico);
    expect(aviso?.getAttribute('role')).toBe('status');
    const agregar = [...nodo.querySelectorAll('a')].find((a) =>
      a.textContent.includes(seguridad.agregar),
    );
    expect(agregar?.getAttribute('href')).toBe('/ajustes/seguridad/factores/nuevo');
    expect(agregar?.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    expect(nodo.textContent).not.toContain(seguridad.quitar);
    expect(nodo.querySelector('a[href$="/quitar"]')).toBeNull();
  });

  it('PRU-CMP-AJUS-732 [] con dos factores no hay aviso y cada uno tiene su «Quitar» hacia la hoja', () => {
    const nodo = montar(<ListaFactores factores={[AUTENTICADOR, RESPALDO]} />);
    expect(nodo.querySelector('[data-estado="advertencia"]')).toBeNull();
    const enlaces = [...nodo.querySelectorAll('a[href$="/quitar"]')];
    expect(enlaces.map((a) => a.getAttribute('href'))).toEqual([
      '/ajustes/seguridad/factores/f-1/quitar',
      '/ajustes/seguridad/factores/f-2/quitar',
    ]);
  });

  it('PRU-CMP-AJUS-733 [] la hoja de quitar pide confirmar con «Cancelar» y «Quitar Respaldo» de peligro, y el resultado queda en Seguridad', async () => {
    const accion = vi.fn((): Promise<ResultadoAccion<unknown>> =>
      Promise.resolve({ ok: true, valor: {}, yaAplicada: false, avisos: [] }),
    );
    montar(
      <FormularioQuitarFactor
        accion={accion}
        factorId="f-2"
        nombre="Respaldo"
        alta="Alta 01/09/2026"
        quedan={['Autenticador']}
        esUnico={false}
        superpuesto
      />,
    );
    const dialogo = document.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialogo.textContent).toContain('¿Quitar Respaldo?');
    expect(dialogo.textContent).toContain(
      'Ya no vas a poder ingresar con Respaldo. Te queda Autenticador.',
    );
    const botones = [...dialogo.querySelectorAll('button')];
    const cancelar = botones.find((b) => b.textContent === seguridad.cancelar);
    const quitar = botones.find((b) => b.textContent === 'Quitar Respaldo');
    expect(cancelar).toBeDefined();
    expect(quitar).toBeDefined();
    expect(getComputedStyle(quitar as Element).backgroundColor).not.toBe(
      getComputedStyle(cancelar as Element).backgroundColor,
    );
    await act(async () => {
      quitar?.click();
      await Promise.resolve();
    });
    await vi.waitFor(() => {
      expect(reemplazar).toHaveBeenCalledWith('/ajustes/seguridad?quitado=Respaldo');
    });
    expect(accion).toHaveBeenCalledTimes(1);
  });
});
