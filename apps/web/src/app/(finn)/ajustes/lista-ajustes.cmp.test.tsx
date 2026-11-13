// Índice de Ajustes del export de diseño (pantalla 11): la lista de secciones con su ícono y su flecha (CMP, sin servidor).
import axe from 'axe-core';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../globals.css';
import { escucharInstalacion } from '../../../cliente/instalacion';
import { instalacion } from '../../../textos/instalacion';
import { notificaciones } from '../../../textos/notificaciones';
import { InstalarFinn } from './instalar-finn';
import { ListaAjustes, type ResumenAjustes } from './lista-ajustes';

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
  vi.unstubAllGlobals();
  Reflect.deleteProperty(navigator, 'userAgent');
});

function montar(respaldoAtrasado = false, resumen?: ResumenAjustes): HTMLElement {
  document.body.style.cssText = 'background: var(--fondo); color: var(--texto)';
  const nodo = document.createElement('main');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(
      <ListaAjustes
        respaldoAtrasado={respaldoAtrasado}
        {...(resumen === undefined ? {} : { resumen })}
      />,
    );
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
  it('PRU-CMP-AJUS-721 [CA-E5-20] Android sin instalar muestra «Instalar Finn en este dispositivo» arriba del índice; iPhone, los pasos de Safari; instalada, nada', () => {
    const AGENTE_IOS =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
    const soltar = escucharInstalacion();
    const conPantalla = (): HTMLElement => {
      document.body.style.cssText = 'background: var(--fondo); color: var(--texto)';
      const nodo = document.createElement('main');
      document.body.append(nodo);
      const raiz = createRoot(nodo);
      act(() => {
        raiz.render(
          <>
            <InstalarFinn />
            <ListaAjustes />
          </>,
        );
      });
      montado = { raiz, nodo };
      return nodo;
    };
    const desmontar = (): void => {
      if (montado === undefined) return;
      act(() => {
        montado?.raiz.unmount();
      });
      montado.nodo.remove();
      montado = undefined;
    };
    try {
      // Android: el navegador ofreció la instalación; el botón va antes que la lista
      const android = conPantalla();
      expect(android.querySelector('[data-instalar-finn]')).toBeNull();
      act(() => {
        window.dispatchEvent(new Event('beforeinstallprompt'));
      });
      const tarjeta = android.querySelector('[data-instalar-finn]');
      expect(tarjeta?.textContent).toContain(instalacion.titulo);
      const boton = [...android.querySelectorAll('button')].find(
        (b) => b.textContent === instalacion.accion,
      );
      expect(boton).toBeDefined();
      expect(
        tarjeta?.compareDocumentPosition(
          android.querySelector('[data-rol="lista-ajustes"]') as Node,
        ),
      ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
      expect(android.textContent).not.toContain(notificaciones.filaIosSinInstalar);
      act(() => {
        window.dispatchEvent(new Event('appinstalled'));
      });
      expect(android.querySelector('[data-instalar-finn]')).toBeNull();
      desmontar();

      // iPhone sin instalar: los pasos de Safari y la fila de Notificaciones lo dice
      Object.defineProperty(navigator, 'userAgent', { configurable: true, value: AGENTE_IOS });
      const ios = conPantalla();
      expect(ios.querySelector('[data-instalar-finn]')?.textContent).toContain(
        instalacion.iosTitulo,
      );
      for (const paso of instalacion.iosPasos) expect(ios.textContent).toContain(paso);
      expect(
        [...ios.querySelectorAll('button')].some((b) => b.textContent === instalacion.accion),
      ).toBe(false);
      expect(ios.querySelector('a[href="/ajustes/notificaciones"]')?.textContent).toContain(
        notificaciones.filaIosSinInstalar,
      );
      desmontar();

      // Ya instalada (standalone): nada, ni siquiera con el evento del navegador
      const original = window.matchMedia.bind(window);
      vi.stubGlobal('matchMedia', (consulta: string) => {
        const lista = original(consulta);
        if (consulta.includes('display-mode: standalone'))
          Object.defineProperty(lista, 'matches', { value: true });
        return lista;
      });
      const instalada = conPantalla();
      act(() => {
        window.dispatchEvent(new Event('beforeinstallprompt'));
      });
      expect(instalada.querySelector('[data-instalar-finn]')).toBeNull();
      expect(instalada.textContent).not.toContain(notificaciones.filaIosSinInstalar);
    } finally {
      soltar();
    }
  });

  it('PRU-CMP-AJUS-790 [FT-72, FT-76] (CH-251) cada fila trae su resumen de ajustes(): el día del ciclo, el SMS conectado con su último instante, los formatos activos, las instituciones, los formatos de exportación y los errores de 7 días', () => {
    const resumen = {
      diaInicio: 21,
      webhook: { configurado: true, ultimoSmsEn: '2026-10-15T18:41:00.000Z' },
      formatosActivos: 4,
      instituciones: 3,
      erroresSieteDias: 0,
    };
    const resumenDe = (raiz: HTMLElement, href: string) =>
      raiz.querySelector(`a[href="${href}"] [data-resumen]`)?.textContent;
    const lista = montar(false, resumen);
    expect(resumenDe(lista, '/ajustes/ciclo')).toBe('Empieza el día 21');
    expect(resumenDe(lista, '/ajustes/webhook')).toBe('Conectado · último SMS 15/10/2026 12:41');
    expect(resumenDe(lista, '/ajustes/formatos')).toBe('4 activos');
    expect(resumenDe(lista, '/ajustes/instituciones')).toBe('3');
    expect(resumenDe(lista, '/ajustes/exportar')).toBe('JSON y CSV');
    expect(resumenDe(lista, '/ajustes/diagnostico')).toBe('Sin errores en 7 días');
    // Lo que no es del servidor no tiene resumen: Notificaciones, Seguridad y Apariencia.
    for (const href of ['/ajustes/notificaciones', '/ajustes/seguridad', '/ajustes/apariencia'])
      expect(resumenDe(lista, href)).toBeUndefined();
    const otra = montar(false, {
      ...resumen,
      webhook: { configurado: false },
      formatosActivos: 1,
      erroresSieteDias: 2,
    });
    expect(resumenDe(otra, '/ajustes/webhook')).toBe('Sin conectar');
    expect(resumenDe(otra, '/ajustes/formatos')).toBe('1 activo');
    expect(resumenDe(otra, '/ajustes/diagnostico')).toBe('2 errores en 7 días');
  });

  it('PRU-CMP-AJUS-800 [FT-74] la fila de Seguridad dice cuántos factores trae resumenSeguridad(), en singular o plural, sin sesiones; sin el dato, no resume nada', () => {
    const base = {
      diaInicio: 21,
      webhook: { configurado: true },
      formatosActivos: 4,
      instituciones: 3,
      erroresSieteDias: 0,
    };
    const seguridad = (raiz: HTMLElement) =>
      raiz.querySelector('a[href="/ajustes/seguridad"] [data-resumen]')?.textContent;
    expect(seguridad(montar(false, { ...base, factores: 2 }))).toBe('2 factores');
    expect(seguridad(montar(false, { ...base, factores: 1 }))).toBe('1 factor');
    const sinDato = montar(false, base);
    expect(seguridad(sinDato)).toBeUndefined();
    expect(sinDato.querySelector('a[href="/ajustes/seguridad"]')?.textContent).not.toContain(
      'sesi',
    );
  });

  it('PRU-CMP-AJUS-791 [FT-72, FT-76] (CH-251) el nombre accesible de cada fila es todo su texto visible: empieza por su título e incluye su resumen o aviso', () => {
    const lista = montar(true, {
      diaInicio: 21,
      webhook: { configurado: true },
      formatosActivos: 4,
      instituciones: 3,
      erroresSieteDias: 0,
    });
    const fila = (href: string) => lista.querySelector(`a[href="${href}"]`) as Element;
    // Sin `aria-labelledby` ni `aria-label`: el nombre sale del contenido (axe `label-content-name-mismatch`).
    for (const a of lista.querySelectorAll('[data-rol="lista-ajustes"] a')) {
      expect(a.hasAttribute('aria-labelledby')).toBe(false);
      expect(a.hasAttribute('aria-label')).toBe(false);
      expect(a.hasAttribute('aria-describedby')).toBe(false);
    }
    const nombre = (href: string) => fila(href).textContent.trim();
    const casos: readonly (readonly [string, string, string])[] = [
      ['/ajustes/ciclo', 'Ciclo de los períodos', 'Empieza el día 21'],
      ['/ajustes/webhook', 'Conectar los SMS', 'Conectado'],
      ['/ajustes/exportar', 'Exportar tus datos', 'JSON y CSV'],
      ['/ajustes/respaldo', 'Respaldo', 'Respaldo atrasado'],
    ];
    for (const [href, titulo, resumen] of casos) {
      expect(nombre(href).startsWith(titulo)).toBe(true);
      expect(nombre(href)).toContain(resumen);
    }
    // Sin resumen ni aviso, el nombre es solo el título.
    expect(nombre('/ajustes/seguridad')).toBe('Seguridad');
  });
});
