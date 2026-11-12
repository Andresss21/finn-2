// Índice de Ajustes del export de diseño (pantalla 11): la lista de secciones con su ícono y su flecha (CMP, sin servidor).
import axe from 'axe-core';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../globals.css';
import { ListaAjustes } from './lista-ajustes';

// Solo el límite externo: `next/link` necesita el enrutador de Next, que el navegador de prueba no tiene.
vi.mock('next/link', async () => {
  const { createElement } = await import('react');
  const Enlace = ({ href, children, ...resto }: { href: string; children?: ReactNode }) =>
    createElement('a', { href, ...resto }, children);
  return Object.assign(Enlace, { default: Enlace, useLinkStatus: () => ({ pending: false }) });
});
// [CH-242] La tarjeta «Salir» viene de `navegacion-app.tsx`, que importa el enrutador de Next.
vi.mock('next/navigation', () => ({
  usePathname: () => '/ajustes',
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ refresh: () => undefined, replace: () => undefined, back: () => undefined }),
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let montado: { raiz: Root; nodo: HTMLElement } | undefined;
afterEach(() => {
  if (montado !== undefined) {
    const { raiz, nodo } = montado;
    act(() => {
      raiz.unmount();
    });
    nodo.remove();
    montado = undefined;
  }
  document.documentElement.removeAttribute('data-theme');
});

function montar(respaldoAtrasado = false): HTMLElement {
  document.body.style.cssText = 'background: var(--fondo); color: var(--texto)';
  const nodo = document.createElement('main');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(<ListaAjustes respaldoAtrasado={respaldoAtrasado} />);
  });
  montado = { raiz, nodo };
  return nodo;
}

describe('PRU-CMP-AJUS-140 índice de Ajustes', () => {
  it('PRU-CMP-AJUS-140 [FT-04] una fila por sección, en el orden del diseño, con su ícono y su flecha, de 44 px o más', () => {
    const lista = montar();
    const filas = [...lista.querySelectorAll<HTMLAnchorElement>('li > a')];
    expect(filas.map((a) => [a.textContent, a.getAttribute('href')])).toEqual([
      ['Ciclo de los períodos', '/ajustes/ciclo'],
      ['Conectar los SMS', '/ajustes/webhook'],
      ['Formatos bancarios', '/ajustes/formatos'],
      ['Instituciones', '/ajustes/instituciones'],
      ['Notificaciones', '/ajustes/notificaciones'],
      ['Seguridad', '/ajustes/seguridad'],
      ['Exportar tus datos', '/ajustes/exportar'],
      ['Respaldo', '/ajustes/respaldo'],
      ['Diagnóstico', '/ajustes/diagnostico'],
      ['Apariencia', '/ajustes/apariencia'],
    ]);
    for (const a of filas) {
      expect(a.querySelectorAll('svg')).toHaveLength(2);
      expect(a.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    }
  });

  it('PRU-CMP-AJUS-154 [CA-76.1] con el respaldo atrasado, la fila de Respaldo lo dice; al día, no dice nada', () => {
    const alDia = montar(false);
    expect(alDia.textContent).not.toContain('Respaldo atrasado');
    const atrasada = montar(true);
    const fila = atrasada.querySelector('a[href="/ajustes/respaldo"]');
    expect(fila?.textContent).toContain('Respaldo atrasado');
  });

  it.each(['claro', 'oscuro'] as const)(
    'PRU-CMP-AJUS-141 [FT-04] la lista no tiene violaciones de accesibilidad en el tema %s',
    async (tema) => {
      document.documentElement.dataset['theme'] = tema;
      const lista = montar();
      const { violations } = await axe.run(lista, {
        runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
      });
      expect(violations.map((v) => v.id)).toEqual([]);
    },
  );
});
