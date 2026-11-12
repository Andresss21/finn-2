import axe from 'axe-core';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { CuentasDto } from '@finn/aplicacion/consultas/cuentas';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../../app/globals.css';
import {
  ContextoAcciones,
  type AccionesPublicadas,
} from '../../../componentes/marco/publicar-acciones';
import { PantallaCuentas } from './pantalla';

// `next/link` necesita `process` y el enrutador de Next, que el navegador de prueba no tiene: se simula `next/link`, nunca
// `enlace-finn`, que otras suites importan de verdad (`vitest list` no limpia los mocks de cada sesión del navegador).
vi.mock('next/link', async () => {
  const { createElement } = await import('react');
  const Enlace = ({ href, children, ...resto }: { href: string; children?: ReactNode }) =>
    createElement('a', { href, ...resto }, children);
  // `next/link` es CommonJS: el módulo es la propia función, con `useLinkStatus` como propiedad.
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

/** Un DTO de `cuentas()` armado a mano: la pantalla solo dibuja lo que trae. */
const dto = (parcial: Record<string, unknown> = {}): CuentasDto =>
  ({
    revision: 'r1',
    hoy: '2027-02-05',
    periodoActivo: { inicio: '2027-01-21', fin: '2027-02-20' },
    notificacionesNoLeidas: 0,
    bandejaPorRevisar: 0,
    efectivo: [],
    tarjetas: [],
    prestamos: [],
    inversiones: [],
    posicionNeta: {
      activos: { efectivo: 0, saldosAFavor: 0, inversiones: 0, porCobrar: 0, total: 0 },
      deudas: { tarjetas: 0, prestamos: 0, total: 0 },
      neto: 0,
      barras: { activosBp: 0, deudasBp: 0 },
    },
    enCamino: 0,
    ...parcial,
  }) as unknown as CuentasDto;

const ahorro = {
  cuenta: { id: 'ahorro', nombre: 'Ahorro' },
  saldo: 96000,
  saldoConfirmado: 100000,
};
const visa = (extra: Record<string, unknown> = {}) => ({
  cuenta: { id: 'visa', nombre: 'Visa Oro' },
  deuda: 1875,
  saldoAFavor: 0,
  limite: 250000,
  usoLimite: 75,
  faltaReservar: 1875,
  reservaExcedente: 0,
  proximoCorte: '2027-02-15',
  proximoPago: '2027-03-05',
  paraNoGenerarIntereses: 0,
  usoSinReservarBp: 75,
  ...extra,
});

describe('PRU-CMP-CTA-103 pantalla de Cuentas', () => {
  it('PRU-CMP-CTA-103 [CA-51.4] sin archivadas en el DTO no hay grupo y se ofrece mostrarlas; con ellas aparecen marcadas', () => {
    const sin = montar(<PantallaCuentas dto={dto({ efectivo: [ahorro] })} />);
    expect(sin.querySelector('[data-grupo="Archivadas"]')).toBeNull();
    const apagado = sin.querySelector('a[href="/cuentas?archivadas=1"]');
    expect(apagado?.textContent).toBe('Mostrar archivadas');
    expect(apagado?.getAttribute('aria-checked')).toBe('false');

    const con = montar(
      <PantallaCuentas
        dto={dto({
          efectivo: [ahorro],
          archivadas: [{ id: 'vieja', nombre: 'Vieja', archivada: true }],
        })}
      />,
    );
    const grupo = con.querySelector('[data-grupo="Archivadas"]');
    expect(grupo?.textContent).toContain('Vieja');
    expect(grupo?.querySelector('[data-identidad="archivada"]')?.textContent).toContain(
      'Archivada',
    );
    const encendido = con.querySelector('a[href="/cuentas"]');
    expect(encendido?.textContent).toBe('Mostrar archivadas');
    expect(encendido?.getAttribute('aria-checked')).toBe('true');
  });

  it('PRU-CMP-CTA-103 [CA-51.5] la cuenta muestra su saldo y su saldo confirmado tal como vienen, con la diferencia a la vista', () => {
    const raiz = montar(<PantallaCuentas dto={dto({ efectivo: [ahorro] })} />);
    const montos = [...raiz.querySelectorAll('[data-identidad="efectivo"] [data-centavos]')].map(
      (m) => m.getAttribute('data-centavos'),
    );
    expect(montos).toEqual(['96000', '100000']);
  });

  it('PRU-CMP-CTA-103 [CA-51.6, CA-51.7] PosicionNeta dibuja los puntos básicos del DTO sin recalcular: 1,887 y 10,000, 0 y 0, 10,000 y 10,000', () => {
    const anchos = (activosBp: number, deudasBp: number) => {
      const raiz = montar(
        <PantallaCuentas
          dto={dto({
            efectivo: [ahorro],
            posicionNeta: {
              activos: {
                efectivo: 100000,
                saldosAFavor: 0,
                inversiones: 0,
                porCobrar: 0,
                total: 100000,
              },
              deudas: { tarjetas: 30000, prestamos: 500000, total: 530000 },
              neto: -430000,
              barras: { activosBp, deudasBp },
            },
          })}
        />,
      );
      return ['Activos', 'Deudas'].map((n) => {
        const barra = raiz.querySelector<HTMLElement>(
          `[data-fila-posicion="${n}"] [data-barra-bp]`,
        );
        return [barra?.getAttribute('data-barra-bp'), barra?.style.width];
      });
    };
    expect(anchos(1887, 10000)).toEqual([
      ['1887', '18.87%'],
      ['10000', '100%'],
    ]);
    expect(anchos(0, 0)).toEqual([
      ['0', '0%'],
      ['0', '0%'],
    ]);
    expect(anchos(10000, 10000)).toEqual([
      ['10000', '100%'],
      ['10000', '100%'],
    ]);
  });

  it('PRU-CMP-CTA-103 [CA-51.8] la barra de uso del límite dibuja usoSinReservarBp (75) y, si es nulo, no muestra la parte sin reservar', () => {
    const con = montar(<PantallaCuentas dto={dto({ tarjetas: [visa()] })} />);
    expect(con.querySelector<HTMLElement>('[data-segmento="sin-reservar"]')?.style.width).toBe(
      '0.75%',
    );
    const sin = montar(
      <PantallaCuentas dto={dto({ tarjetas: [visa({ limite: 0, usoSinReservarBp: null })] })} />,
    );
    expect(sin.querySelector('[data-segmento="sin-reservar"]')).toBeNull();
  });

  it('PRU-CMP-CTA-103 sin ninguna cuenta dice "Agregá tu primera cuenta" con el enlace a crearla; con cuentas, enlaza a ordenar, a cada detalle y a pagar', () => {
    const vacia = montar(<PantallaCuentas dto={dto()} />);
    expect(vacia.querySelector('h2')?.textContent).toBe('Agregá tu primera cuenta');
    expect(vacia.querySelector('a[href="/cuentas/nueva"]')?.textContent).toBe('Agregar una cuenta');
    expect(vacia.querySelector('a[href="/cuentas/ordenar"]')).toBeNull();

    const llena = montar(<PantallaCuentas dto={dto({ efectivo: [ahorro], tarjetas: [visa()] })} />);
    const enlaces = [...llena.querySelectorAll('a')].map((a) => a.getAttribute('href'));
    // E4-33: «Nueva cuenta» y «Ordenar las cuentas» salen de la página y entran al menú (PublicarAcciones).
    expect(enlaces).toEqual(expect.arrayContaining(['/cuentas/ahorro', '/cuentas/visa']));
    expect(enlaces).not.toContain('/cuentas/ordenar');
    expect(enlaces).not.toContain('/cuentas/nueva');
  });

  it('PRU-CMP-CTA-234 [CA-51.4] «Mostrar archivadas» es un interruptor de servidor: enlace con role switch, aria-checked y la misma etiqueta en ambos estados', () => {
    const interruptores = (raiz: HTMLElement) =>
      [...raiz.querySelectorAll('[role="switch"]')].map((e) => [
        e.tagName,
        e.getAttribute('aria-checked'),
        e.getAttribute('href'),
        e.textContent,
      ]);
    expect(interruptores(montar(<PantallaCuentas dto={dto({ efectivo: [ahorro] })} />))).toEqual([
      ['A', 'false', '/cuentas?archivadas=1', 'Mostrar archivadas'],
    ]);
    expect(
      interruptores(montar(<PantallaCuentas dto={dto({ efectivo: [ahorro], archivadas: [] })} />)),
    ).toEqual([['A', 'true', '/cuentas', 'Mostrar archivadas']]);
    const con = montar(
      <PantallaCuentas
        dto={dto({ efectivo: [ahorro], archivadas: [{ id: 'vieja', nombre: 'Vieja' }] })}
      />,
    );
    expect(interruptores(con)).toEqual([['A', 'true', '/cuentas', 'Mostrar archivadas']]);
    expect(con.querySelector('[data-grupo="Archivadas"] [role="switch"]')).not.toBeNull();
    expect(con.querySelector('[data-grupo="Archivadas"] h2')?.textContent).toBe('Archivadas');
  });

  it('PRU-CMP-CTA-235 la tarjeta enlaza entera: no hay «Ver detalle de …» ni «Pagar …» subrayados; «En camino» está dentro de la posición neta', () => {
    const raiz = montar(
      <PantallaCuentas dto={dto({ efectivo: [ahorro], tarjetas: [visa()], enCamino: 4000 })} />,
    );
    const nombres = [...raiz.querySelectorAll('a')].map(
      (a) => a.getAttribute('aria-label') ?? a.textContent,
    );
    expect(nombres).toContain('Ver detalle de Visa Oro');
    expect(nombres.filter((n) => /^Pagar /.test(n))).toEqual([]);
    expect(raiz.querySelectorAll('a.underline').length).toBe(0);
    expect(raiz.querySelector('[data-posicion-neta] [data-en-camino]')?.textContent).toContain(
      '$40.00',
    );
    expect(raiz.querySelectorAll('[data-en-camino]').length).toBe(1);
  });

  it('PRU-CMP-CTA-701 [CA-E4-22] «Archivada · {banco}» mide al menos 4.5:1 sobre su fondo, en claro y oscuro', async () => {
    const raiz = montar(
      <PantallaCuentas
        dto={dto({
          efectivo: [ahorro],
          archivadas: [{ id: 'vieja', nombre: 'Vieja', institucion: 'Banco Cuscatlán' }],
        })}
      />,
    );
    const archivada = raiz.querySelector('[data-identidad="archivada"]') as HTMLElement;
    expect(archivada.textContent).toContain('Archivada · Banco Cuscatlán');
    for (const tema of ['claro', 'oscuro']) {
      document.documentElement.setAttribute('data-theme', tema);
      const r = await axe.run(archivada, { runOnly: ['color-contrast'] });
      expect(r.violations.map((v) => v.id)).toEqual([]);
    }
    document.documentElement.removeAttribute('data-theme');
  });

  it('PRU-CMP-CTA-701 la billetera lleva costura punteada y el ícono wallet; el rótulo de la red no usa opacidad', () => {
    const raiz = montar(
      <PantallaCuentas
        dto={dto({
          efectivo: [{ ...ahorro, subtipoEfectivo: 'billetera' }],
          tarjetas: [visa({ red: 'Visa' })],
        })}
      />,
    );
    const bill = raiz.querySelector('[data-subtipo="billetera"]');
    expect(bill?.querySelector('[data-motivo="costura"]')).not.toBeNull();
    expect(bill?.querySelector('[data-motivo="libreta"]')).toBeNull();
    const rotulos = [...raiz.querySelectorAll('[data-billetera] span')].filter((s) =>
      /crédito/.test(s.textContent ?? ''),
    );
    expect(rotulos.length).toBeGreaterThan(0);
    for (const r of rotulos) expect(getComputedStyle(r).opacity).toBe('1');
  });

  it('PRU-CMP-CTA-701 [CA-E6-14] la pantalla publica «Nueva cuenta» y «Ordenar las cuentas» al menú «En Cuentas»; sin cuentas, solo «Nueva cuenta»', () => {
    const publicadas: AccionesPublicadas[] = [];
    const llena = montar(
      <ContextoAcciones value={(a) => a !== null && publicadas.push(a)}>
        <PantallaCuentas dto={dto({ efectivo: [ahorro] })} />
      </ContextoAcciones>,
    );
    expect(llena).toBeTruthy();
    const ultima = publicadas.at(-1);
    expect(ultima?.titulo).toBe('En Cuentas');
    expect(ultima?.acciones.map((a) => [a.etiqueta, a.ruta])).toEqual([
      ['Nueva cuenta', '/cuentas/nueva'],
      ['Ordenar las cuentas', '/cuentas/ordenar'],
    ]);
    publicadas.length = 0;
    montar(
      <ContextoAcciones value={(a) => a !== null && publicadas.push(a)}>
        <PantallaCuentas dto={dto()} />
      </ContextoAcciones>,
    );
    expect(publicadas.at(-1)?.acciones.map((a) => a.etiqueta)).toEqual(['Nueva cuenta']);
  });
});
