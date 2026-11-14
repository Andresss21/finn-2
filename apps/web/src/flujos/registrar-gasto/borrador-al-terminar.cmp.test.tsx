// [CH-290] El borrador de Registrar gasto (05 §4.11) se borra al guardar con `ok: true` y al descartarlo, aunque el resultado
// reemplace al formulario y `BorradorGasto` (cargado aparte, 05 §13.1) ya no esté montado. Si quedara, el próximo gasto de la
// pestaña abriría con los datos y el id de creación del ya guardado (CONFLICTO `conflicto_id` al cambiar los datos).
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import type { FechaLocal } from '@finn/dominio/valores';
import '../../app/globals.css';
import { claveDeBorrador } from '../../formularios/clave-borrador';
import { registrarGasto as accion } from '../../servidor/acciones/transacciones';
import { sugerencia } from '../../servidor/lecturas/interactivas';
import { formularios } from '../../textos/formularios';
import { registrarGasto as t } from '../../textos/registrar-gasto';
import { FormularioRegistrarGasto, type PropsFormularioRegistrarGasto } from './formulario';

vi.mock('next/navigation', () => ({
  usePathname: () => '/registrar/gasto',
  useRouter: () => ({ replace: vi.fn(), back: vi.fn(), push: vi.fn() }),
}));
vi.mock('next/link', async () => {
  const { createElement } = await import('react');
  const Enlace = ({ href, children, ...resto }: { href: string; children?: ReactNode }) =>
    createElement('a', { href, ...resto }, children);
  return Object.assign(Enlace, { default: Enlace, useLinkStatus: () => ({ pending: false }) });
});
vi.mock('../../servidor/acciones/transacciones', () => ({ registrarGasto: vi.fn() }));
vi.mock('../../servidor/lecturas/interactivas', () => ({ sugerencia: vi.fn() }));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const CLAVE = claveDeBorrador('/registrar/gasto');
const montados: { raiz: Root; nodo: HTMLElement }[] = [];
afterEach(() => {
  vi.useRealTimers();
  desmontar();
  sessionStorage.clear();
  vi.mocked(accion).mockReset();
  vi.mocked(sugerencia).mockReset();
});
function desmontar(): void {
  for (const { raiz, nodo } of montados.splice(0)) {
    act(() => {
      raiz.unmount();
    });
    nodo.remove();
  }
}

const CUENTA = '00000000-0000-4000-8000-0000000000a1';
const PARAMOUNT = '00000000-0000-4000-8000-0000000000b1';
const PROPS: PropsFormularioRegistrarGasto = {
  hoy: '2026-11-14' as FechaLocal,
  // Con 4 cuentas la cuenta es una lista: la categoría es la segunda (CA-K3-6)
  cuentas: ['Débito', 'Ahorro', 'Planilla', 'Efectivo'].map((nombre, i) => ({
    id: `00000000-0000-4000-8000-0000000000a${String(i + 1)}`,
    nombre,
    tipo: 'efectivo' as const,
    detalle: 'Saldo $827.27',
  })),
  categorias: [
    {
      id: '00000000-0000-4000-8000-0000000000b2',
      nombre: 'Netflix',
      grupo: 'Suscripciones',
      disponible: '$15.49',
      negativo: false,
    },
    {
      id: PARAMOUNT,
      nombre: 'Paramount',
      grupo: 'Suscripciones',
      disponible: '$5.99',
      negativo: false,
    },
  ],
  deudores: [],
  cuentaPropuesta: CUENTA,
};

async function montar(): Promise<HTMLElement> {
  vi.mocked(sugerencia).mockResolvedValue({
    ok: true,
    valor: { sugerencia: { categoria: { id: PARAMOUNT, nombre: 'Paramount' } } },
  } as never);
  const nodo = document.createElement('div');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  await act(() => {
    raiz.render(<FormularioRegistrarGasto {...PROPS} />);
    return Promise.resolve();
  });
  montados.push({ raiz, nodo });
  await vi.waitFor(() => {
    expect(document.querySelector(`[aria-label="${t.cuantasCategorias}"]`)).not.toBeNull();
  });
  return nodo;
}

const total = () => document.querySelector<HTMLInputElement>('.campo-billete input');
const comercio = () =>
  [...document.querySelectorAll('label')].find((l) => l.textContent.startsWith(t.comercio))
    ?.control as HTMLInputElement | null | undefined;
const descartar = () =>
  [...document.querySelectorAll<HTMLElement>('button, a')].find(
    (b) => b.textContent.trim() === formularios.descartarBorrador,
  );
const guardar = () =>
  [...document.querySelectorAll<HTMLButtonElement>('button[type="submit"]')].find((b) =>
    b.textContent.startsWith('Guardar'),
  ) as HTMLButtonElement;

/** Escribe un gasto de $5.99 y espera a que el borrador quede guardado en la pestaña. */
async function escribirGasto(): Promise<void> {
  await userEvent.type(total() as HTMLInputElement, '5.99');
  await userEvent.type(comercio() as HTMLInputElement, 'Google Paramount');
  // La sugerencia del comercio (simulada) pone la categoría Paramount.
  await expect.poll(() => guardar().getAttribute('aria-disabled')).toBeNull();
  await expect.poll(() => sessionStorage.getItem(CLAVE)).toContain('Google Paramount');
}

/** Corre las esperas del borrador (500 ms) sin el reloj de pared. */
async function correrEsperas(): Promise<void> {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(2000);
  });
  vi.useRealTimers();
}

describe('PRU-CMP-TX Registrar gasto: borrador al guardar y al descartar', () => {
  it('PRU-CMP-TX-871 [FT-21] al guardar con ok se borra el borrador: otro gasto en la pestaña abre vacío, sin «Descartar borrador» ni el id del ya guardado', async () => {
    vi.mocked(accion).mockImplementation((p: unknown) =>
      Promise.resolve({
        ok: true,
        valor: { id: (p as { id: string }).id },
        yaAplicada: false,
        avisos: [],
      } as never),
    );
    await montar();
    await escribirGasto();
    await userEvent.click(guardar(), { force: true });
    await expect.poll(() => document.body.textContent).toContain(t.listo);
    const primero = (vi.mocked(accion).mock.calls.at(-1)?.[0] as { id: string }).id;
    await correrEsperas();
    expect(sessionStorage.getItem(CLAVE)).toBeNull();

    desmontar();
    await montar();
    await correrEsperas();
    expect(total()?.value).toBe('');
    expect(comercio()?.value).toBe('');
    expect(descartar()).toBeUndefined();
    await escribirGasto();
    await userEvent.click(guardar(), { force: true });
    await expect.poll(() => vi.mocked(accion).mock.calls.length).toBe(2);
    expect((vi.mocked(accion).mock.calls.at(-1)?.[0] as { id: string }).id).not.toBe(primero);
  });

  it('PRU-CMP-TX-872 [FT-21] «Descartar borrador» vacía los campos, no vuelve a escribir el borrador y el gasto siguiente lleva un id nuevo', async () => {
    vi.mocked(accion).mockImplementation((p: unknown) =>
      Promise.resolve({
        ok: true,
        valor: { id: (p as { id: string }).id },
        yaAplicada: false,
        avisos: [],
      } as never),
    );
    // Un borrador con el id de un intento anterior, como el que quedaba después de guardar.
    sessionStorage.setItem(
      CLAVE,
      JSON.stringify({
        version: 1,
        guardadoEn: '2026-11-14T15:00:00.000Z',
        campos: { comercio: 'Google Paramount', total: '5.99' },
        id: '7d3f6a52-1c0b-4e7a-9a43-5b2f0c9e1d11',
        revisionAlAbrir: null,
        avisoVisto: true,
      }),
    );
    await montar();
    await expect.poll(() => descartar()).toBeDefined();
    expect(comercio()?.value).toBe('Google Paramount');
    await userEvent.click(descartar() as HTMLElement);
    await expect.poll(() => comercio()?.value).toBe('');
    expect(total()?.value).toBe('');
    await correrEsperas();
    expect(sessionStorage.getItem(CLAVE)).toBeNull();
    expect(descartar()).toBeUndefined();

    await escribirGasto();
    await userEvent.click(guardar(), { force: true });
    await expect.poll(() => vi.mocked(accion).mock.calls.length).toBeGreaterThan(0);
    expect((vi.mocked(accion).mock.calls.at(-1)?.[0] as { id: string }).id).not.toBe(
      '7d3f6a52-1c0b-4e7a-9a43-5b2f0c9e1d11',
    );
  });
});
