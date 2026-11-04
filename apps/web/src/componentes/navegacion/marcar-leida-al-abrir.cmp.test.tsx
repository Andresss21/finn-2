// FT-69 `MarcarLeidaAlAbrir` (05 §3.5, FE-32; 07 §17): el comportamiento del componente sin servidor. El recorrido completo
// (tocar una notificación, la campana que baja) es la E2E del centro.
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MarcarLeidaAlAbrir } from './marcar-leida-al-abrir';

// Solo el límite externo: `next/navigation` necesita el enrutador de Next, que el navegador de prueba no tiene.
const nav = vi.hoisted(() => ({ pathname: '/', busqueda: '', reemplazos: [] as string[] }));
vi.mock('next/navigation', () => ({
  usePathname: () => nav.pathname,
  useSearchParams: () => new URLSearchParams(nav.busqueda),
  useRouter: () => ({
    replace: (url: string) => {
      nav.reemplazos.push(url);
    },
  }),
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const montados: { raiz: Root; nodo: HTMLElement }[] = [];
beforeEach(() => {
  nav.reemplazos = [];
});
afterEach(() => {
  for (const { raiz, nodo } of montados.splice(0)) {
    act(() => {
      raiz.unmount();
    });
    nodo.remove();
  }
});

async function montar(
  pathname: string,
  busqueda: string,
  accion: (entrada: unknown) => Promise<never>,
): Promise<void> {
  nav.pathname = pathname;
  nav.busqueda = busqueda;
  const nodo = document.createElement('div');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  await act(async () => {
    raiz.render(<MarcarLeidaAlAbrir marcarLeidas={accion} />);
    await Promise.resolve();
  });
  montados.push({ raiz, nodo });
}

describe('PRU-CMP-NOTIF-120 marcar leída al abrir', () => {
  it('PRU-CMP-NOTIF-120 [CA-69.2] con ?notificacion= marca esa notificación una sola vez y quita el parámetro con replace, conservando los demás', async () => {
    const llamadas: unknown[] = [];
    const accion = (entrada: unknown) => {
      llamadas.push(entrada);
      return Promise.resolve({
        ok: true,
        valor: { marcadas: 1 },
        yaAplicada: false,
        avisos: [],
      } as never);
    };
    await montar('/actividad/t1', 'notificacion=n-1&volver=%2Factividad', accion);
    expect(llamadas).toEqual([{ ids: ['n-1'] }]);
    await vi.waitFor(() => {
      expect(nav.reemplazos).toEqual(['/actividad/t1?volver=%2Factividad']);
    });
  });

  it('PRU-CMP-NOTIF-121 [CA-69.2] si OPT-04 falla no muestra error y el parámetro igual se quita; sin el parámetro no hace nada', async () => {
    const rechazada = () => Promise.reject(new Error('sin red'));
    await montar('/', 'notificacion=n-2', rechazada);
    await vi.waitFor(() => {
      expect(nav.reemplazos).toEqual(['/']);
    });
    expect(document.querySelector('[role=alert], [role=status]')).toBeNull();

    nav.reemplazos = [];
    const llamadas: unknown[] = [];
    await montar('/', '', (e) => {
      llamadas.push(e);
      return Promise.reject(new Error('no se usa'));
    });
    expect(llamadas).toEqual([]);
    expect(nav.reemplazos).toEqual([]);
  });
});
