// FT-69 Centro de notificaciones (07 §17: un texto, un estado o el foco de un componente es una CMP). El centro solo dibuja lo que
// trae el DTO de `notificaciones()` (04 §6.12.5); el recorrido real (campana, destinos, marcas) es de la E2E.
import axe from 'axe-core';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { NotificacionesDto } from '@finn/aplicacion/consultas/notificaciones';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import '../../globals.css';
import { notificaciones as textos } from '../../../textos/notificaciones';
import { ContenidoNotificaciones } from './contenido';

// `next/link` necesita `process` y el enrutador de Next, que el navegador de prueba no tiene: se simula `next/link`, nunca
// `enlace-finn`, que otras suites importan de verdad (`vitest list` no limpia los mocks de cada sesión del navegador).
vi.mock('next/link', async () => {
  const { createElement } = await import('react');
  const Enlace = ({ href, children, ...resto }: { href: string; children?: ReactNode }) =>
    createElement('a', { href, ...resto }, children);
  return Object.assign(Enlace, { default: Enlace, useLinkStatus: () => ({ pending: false }) });
});

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const t = textos.centro;
const montados: { raiz: Root; nodo: HTMLElement }[] = [];
afterEach(() => {
  for (const { raiz, nodo } of montados.splice(0)) {
    act(() => {
      raiz.unmount();
    });
    nodo.remove();
  }
});

const TRANSACCION = '0b3f4f6e-8c41-4c0e-9a2b-3f6d2b8c0a11';
const fila = (parcial: Record<string, unknown> = {}) => ({
  id: 'n1',
  creadaEn: '2027-02-10T16:00:00.000Z',
  aviso: 'AV-23',
  motivo: 'registro_automatico',
  titulo: 'Se registró Netflix',
  cuerpo: '$12.99 desde Ahorro.',
  destino: { pantalla: 'transaccion', transaccionId: TRANSACCION },
  leida: false,
  existeDestino: true,
  ...parcial,
});
const dto = (notificaciones: Record<string, unknown>[], noLeidas = 0, siguienteCursor?: string) =>
  ({
    revision: 'r1',
    hoy: '2027-02-21',
    notificacionesNoLeidas: noLeidas,
    bandejaPorRevisar: 0,
    notificaciones,
    ...(siguienteCursor === undefined ? {} : { siguienteCursor }),
  }) as unknown as NotificacionesDto;

const mostrar = (arbol: ReactNode): HTMLElement => {
  document.body.style.cssText = 'background: var(--fondo); color: var(--texto)';
  const nodo = document.createElement('div');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(arbol);
  });
  montados.push({ raiz, nodo });
  return nodo;
};
const contenido = (
  d: NotificacionesDto,
  opciones: { soloNoLeidas?: boolean; accion?: () => Promise<never> } = {},
) =>
  mostrar(
    <ContenidoNotificaciones
      dto={d}
      soloNoLeidas={opciones.soloNoLeidas ?? false}
      marcarLeidas={opciones.accion ?? (() => Promise.reject(new Error('no se usa')))}
    />,
  );

describe('PRU-CMP-NOTIF-110 centro de notificaciones', () => {
  it('PRU-CMP-NOTIF-110 [CA-69.3] una notificación cuyo destino ya no existe se muestra sin enlace y con «Esto ya no existe»', () => {
    const raiz = contenido(
      dto([fila({ id: 'n2', existeDestino: false }), fila({ id: 'n3', titulo: 'Otra' })], 2),
    );
    const sinDestino = raiz.querySelector('[data-notificacion="n2"]');
    expect(sinDestino?.querySelector('a')).toBeNull();
    expect(sinDestino?.textContent).toContain(t.yaNoExiste);
    const conDestino = raiz.querySelector('[data-notificacion="n3"] a');
    expect(conDestino?.getAttribute('href')).toBe(`/actividad/${TRANSACCION}?notificacion=n3`);
    expect(raiz.querySelector('[data-notificacion="n3"]')?.textContent).not.toContain(t.yaNoExiste);
  });

  it('PRU-CMP-NOTIF-111 [CA-69.6] una notificación sin destino válido lleva al centro y no a otra pantalla ni lleva la marca de leída', () => {
    const raiz = contenido(dto([fila({ destino: undefined })], 1));
    const enlace = raiz.querySelector('[data-notificacion="n1"] a');
    expect(enlace?.getAttribute('href')).toBe('/notificaciones');
  });

  it('PRU-CMP-NOTIF-112 [CA-69.2] las sin leer van en «Nuevas» con su punto accesible y las leídas en «Anteriores»; cada una abre su destino con ?notificacion=', () => {
    const raiz = contenido(
      dto(
        [
          fila(),
          fila({
            id: 'n2',
            leida: true,
            motivo: 'cierre_periodo',
            destino: { pantalla: 'presupuesto', periodoInicio: '2027-01-21' },
          }),
        ],
        1,
      ),
    );
    const titulos = [...raiz.querySelectorAll('h2')].map((h) => h.textContent);
    expect(titulos).toEqual([t.nuevas, t.anteriores]);
    expect(raiz.querySelector('[data-notificacion="n1"]')?.textContent).toContain(t.sinLeerMarca);
    expect(raiz.querySelector('[data-notificacion="n2"]')?.textContent).not.toContain(
      t.sinLeerMarca,
    );
    expect(raiz.querySelector('[data-notificacion="n2"] a')?.getAttribute('href')).toBe(
      '/presupuesto?periodo=2027-01-21&notificacion=n2',
    );
  });

  it('PRU-CMP-NOTIF-113 [CA-69.4] «Marcar todo como leído» llama a OPT-04 con todas, se ofrece solo con notificaciones sin leer y dice el fallo en línea', async () => {
    const acciones: unknown[] = [];
    const accion = vi.fn((entrada: unknown) => {
      acciones.push(entrada);
      return Promise.resolve({
        ok: false as const,
        error: { mensaje: 'No se pudo completar.' },
      });
    });
    const raiz = contenido(dto([fila()], 1), { accion: accion as never });
    const boton = [...raiz.querySelectorAll('button')].find((b) => b.textContent === t.marcarTodo);
    expect(boton).toBeDefined();
    await act(async () => {
      await userEvent.click(boton as HTMLButtonElement);
    });
    expect(acciones).toEqual([{ todas: true }]);
    expect(raiz.textContent).toContain('No se pudo completar.');

    // Sin nada por leer no hay botón: se dice «Todo leído».
    const leido = contenido(dto([fila({ leida: true })], 0));
    expect([...leido.querySelectorAll('button')].some((b) => b.textContent === t.marcarTodo)).toBe(
      false,
    );
    expect(leido.textContent).toContain(t.todoLeido);
  });

  it('PRU-CMP-NOTIF-114 [] sin notificaciones dice «No tenés notificaciones»; con ?no-leidas=1 vacío dice que todo está leído', () => {
    const todas = contenido(dto([]));
    expect(todas.querySelector('h2')?.textContent).toBe(t.vacioTitulo);
    const sinLeer = contenido(dto([]), { soloNoLeidas: true });
    expect(sinLeer.querySelector('h2')?.textContent).toBe(t.sinLeerVacioTitulo);
  });

  it('PRU-CMP-NOTIF-115 [] el filtro marca la opción activa, «Sin leer» lleva su cantidad, y «Ver más antiguas» sigue el cursor conservando el filtro', () => {
    const raiz = contenido(dto([fila()], 3, 'c-2'), { soloNoLeidas: true });
    const enlaces = [...raiz.querySelectorAll<HTMLAnchorElement>('nav a')];
    expect(enlaces.map((a) => a.textContent)).toEqual([t.todas, 'Sin leer · 3']);
    expect(enlaces.map((a) => a.getAttribute('aria-current'))).toEqual([null, 'true']);
    const mas = [...raiz.querySelectorAll('a')].find((a) => a.textContent === t.masAntiguas);
    expect(mas?.getAttribute('href')).toBe('/notificaciones?no-leidas=1&cursor=c-2');
  });

  it('PRU-CMP-NOTIF-116 [] el centro no tiene violaciones de accesibilidad con notificaciones leídas, sin leer y sin destino', async () => {
    const raiz = contenido(
      dto(
        [
          fila(),
          fila({ id: 'n2', leida: true }),
          fila({ id: 'n3', existeDestino: false }),
          fila({ id: 'n4', destino: undefined }),
        ],
        2,
        'c-2',
      ),
    );
    const resultado = await axe.run(raiz);
    expect(resultado.violations.map((v) => v.id)).toEqual([]);
  });
});
