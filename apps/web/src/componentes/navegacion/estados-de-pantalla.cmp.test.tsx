// Error de pantalla y página sin conexión del export de diseño (pantalla 14) (CMP, sin servidor).
import axe from 'axe-core';
import { userEvent } from 'vitest/browser';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../app/globals.css';
import PaginaSinConexion from '../../app/sin-conexion/page';
import { ErrorDeLaPantalla } from './error-de-pantalla';
import { Barra, BloqueGrafico, Circulo, Esqueleto, SeccionEsqueleto } from './esqueleto';

// Solo el límite externo: `next/navigation` necesita el enrutador de Next, que el navegador de prueba no tiene.
const refrescar = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: refrescar }) }));

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
  refrescar.mockClear();
});

function montar(ui: ReactNode): HTMLElement {
  document.body.style.cssText = 'background: var(--fondo); color: var(--texto)';
  const nodo = document.createElement('div');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(ui);
  });
  montado = { raiz, nodo };
  return nodo;
}

const sinAct = async (f: () => Promise<void>): Promise<void> => {
  await act(f);
};

describe('PRU-CMP-AJUS-142 error de pantalla', () => {
  it('PRU-CMP-AJUS-142 [CA-38.6] la tarjeta dice el mensaje y la referencia, «Copiar referencia» la copia y «Intentar de nuevo» reinicia, todo de 44 px o más', async () => {
    const copiar = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: copiar },
      configurable: true,
    });
    const reset = vi.fn();
    const raiz = montar(
      <ErrorDeLaPantalla
        error={Object.assign(new Error('x'), { digest: 'E-ABC234' })}
        reset={reset}
      />,
    );
    const alerta = raiz.querySelector('[role=alert]') as HTMLElement;
    expect(alerta.textContent).toContain('Algo salió mal y no se pudo cargar esta pantalla.');
    expect(alerta.textContent).toContain('Referencia: E-ABC234');
    const botones = [...alerta.querySelectorAll('button')];
    expect(botones.map((b) => b.getAttribute('aria-label') ?? b.textContent)).toEqual([
      'Copiar la referencia',
      'Intentar de nuevo',
    ]);
    for (const b of botones) expect(b.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    await sinAct(async () => {
      await userEvent.click(botones[0] as HTMLElement);
    });
    expect(copiar).toHaveBeenCalledWith('E-ABC234');
    expect(alerta.querySelector('[role=status]')?.textContent).toBe('Referencia copiada.');
    await sinAct(async () => {
      await userEvent.click(botones[1] as HTMLElement);
    });
    expect(refrescar).toHaveBeenCalledTimes(1);
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('PRU-CMP-AJUS-143 [V5-24] sin referencia no ofrece copiarla, y la tarjeta no tiene violaciones de accesibilidad en los dos temas', async () => {
    for (const tema of ['claro', 'oscuro'] as const) {
      document.documentElement.dataset['theme'] = tema;
      const raiz = montar(<ErrorDeLaPantalla error={new Error('x')} reset={() => undefined} />);
      expect(raiz.querySelector('[aria-label="Copiar la referencia"]')).toBeNull();
      const { violations } = await axe.run(raiz, {
        runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
      });
      expect(violations.map((v) => v.id)).toEqual([]);
      act(() => {
        montado?.raiz.unmount();
      });
      montado?.nodo.remove();
      montado = undefined;
    }
  });
});

describe('PRU-CMP-AJUS-144 página sin conexión', () => {
  it.each(['claro', 'oscuro'] as const)(
    'PRU-CMP-AJUS-144 [FT-05] la marca, el glifo, el título, el texto y «Intentar de nuevo» de 44 px, sin violaciones de accesibilidad en el tema %s',
    async (tema) => {
      document.documentElement.dataset['theme'] = tema;
      const raiz = montar(<PaginaSinConexion />);
      expect(raiz.querySelector('h1')?.textContent).toBe('Estás sin conexión');
      expect(raiz.querySelectorAll('svg').length).toBeGreaterThanOrEqual(1);
      const boton = raiz.querySelector('button') as HTMLElement;
      expect(boton.textContent).toBe('Intentar de nuevo');
      expect(boton.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
      const { violations } = await axe.run(raiz, {
        runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
      });
      expect(violations.map((v) => v.id)).toEqual([]);
    },
  );
});

describe('PRU-CMP-PWA error de pantalla con su glifo', () => {
  it('PRU-CMP-PWA-341 [] el error de pantalla es una tarjeta con elevación 1, el glifo info, la referencia copiable e «Intentar de nuevo»', () => {
    const raiz = montar(
      <ErrorDeLaPantalla
        error={Object.assign(new Error('x'), { digest: 'E-XYZ987' })}
        reset={() => undefined}
      />,
    );
    const tarjeta = raiz.querySelector('[role=alert]') as HTMLElement;
    expect(tarjeta.querySelector('[data-icono="info"]')).not.toBeNull();
    const sonda = document.createElement('span');
    sonda.style.boxShadow = 'var(--elevacion-1)';
    document.body.append(sonda);
    expect(getComputedStyle(tarjeta).boxShadow).toContain(getComputedStyle(sonda).boxShadow);
    sonda.remove();
    expect(tarjeta.textContent).toContain('E-XYZ987');
    expect(tarjeta.querySelector('button[aria-label]')).not.toBeNull();
    expect(
      [...tarjeta.querySelectorAll('button')].some((b) => b.textContent === 'Intentar de nuevo'),
    ).toBe(true);
  });
});

describe('PRU-CMP-PWA esqueleto', () => {
  it('PRU-CMP-PWA-721 [CA-E6-3] Esqueleto no tiene texto de datos, números ni roles de datos; lleva aria-busy, hijos aria-hidden y un solo anuncio «Cargando {pantalla}» fuera de la región; sin animation', () => {
    const nodo = montar(
      <Esqueleto pantalla="cuentas" titulo="Cuentas">
        <BloqueGrafico />
        <Circulo />
        <Barra />
        <SeccionEsqueleto filas={2} />
      </Esqueleto>,
    );
    const anuncios = nodo.querySelectorAll('[role="status"]');
    expect(anuncios).toHaveLength(1);
    expect(anuncios[0]?.textContent).toBe('Cargando cuentas');
    const ocupada = nodo.querySelector('[aria-busy="true"]') as HTMLElement;
    expect(ocupada.contains(anuncios[0] as Node)).toBe(false);
    expect(ocupada.children).toHaveLength(1);
    expect(ocupada.children[0]?.getAttribute('aria-hidden')).toBe('true');
    // Solo el título y el anuncio son texto: ni cifras ni roles de datos dentro de la región ocupada.
    expect(ocupada.textContent).toBe('');
    expect(ocupada.querySelector('[role],[data-centavos],table,li,img')).toBeNull();
    expect(nodo.textContent).not.toMatch(/\d/);
    // Medidas de E6-1: barras de 12 px con radio 4, gráfico de 168 px, `--superficie-hundida` y sin animación.
    const barra = nodo.querySelector('span.rounded-sm') as HTMLElement;
    expect(getComputedStyle(barra).height).toBe('12px');
    expect(getComputedStyle(barra).borderTopLeftRadius).toBe('4px');
    expect((nodo.querySelector('span.h-42') as HTMLElement).getBoundingClientRect().height).toBe(
      168,
    );
    for (const e of nodo.querySelectorAll<HTMLElement>('span')) {
      expect(getComputedStyle(e).animationName).toBe('none');
    }
  });
});
