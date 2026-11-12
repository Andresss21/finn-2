import axe from 'axe-core';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../app/globals.css';
import { Boton } from './boton';
import { EntradaTexto } from './campo';
import { Pastillas } from './pastillas';
import { Resultado } from './resultado';
import { Vacio } from './vacio';

// Solo el límite externo: `Pastillas` usa `EnlaceFinn`, que necesita `next/link` y `next/navigation`.
vi.mock('next/link', async () => {
  const { createElement } = await import('react');
  const Enlace = ({ href, children, ...resto }: { href: string; children?: ReactNode }) =>
    createElement('a', { href, ...resto }, children);
  return Object.assign(Enlace, { default: Enlace, useLinkStatus: () => ({ pending: false }) });
});
vi.mock('next/navigation', () => ({ usePathname: () => '/', useRouter: () => ({}) }));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const montados: { raiz: Root; nodo: HTMLElement }[] = [];
afterEach(() => {
  for (const { raiz, nodo } of montados.splice(0)) {
    act(() => {
      raiz.unmount();
    });
    nodo.remove();
  }
  delete document.documentElement.dataset['theme'];
  document.body.removeAttribute('style');
});

function montar(ui: ReactNode): HTMLElement {
  // Como globals.css: el fondo y el texto de la página vienen de los tokens.
  document.body.style.cssText =
    'background: var(--fondo); color: var(--texto); font-family: var(--fuente-cuerpo)';
  const nodo = document.createElement('main');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(ui);
  });
  montados.push({ raiz, nodo });
  return nodo;
}

function Galeria() {
  return (
    <>
      <Boton>Guardar</Boton>
      <Boton variante="secundaria">Cancelar</Boton>
      <Boton variante="peligro">Eliminar</Boton>
      <Boton variante="discreta">Ver más</Boton>
      <Boton variante="pastilla">Asignar</Boton>
      <Boton deshabilitado motivoDeshabilitado="Falta elegir la cuenta">
        Registrar
      </Boton>
      <Boton enviando>Registrar</Boton>
      <EntradaTexto etiqueta="Nombre" descripcion="Como aparece en la lista" />
      <EntradaTexto etiqueta="Monto" requerido error="Escribí un monto mayor a cero" />
      <EntradaTexto etiqueta="Nota" defaultValue="Solo lectura" readOnly />
    </>
  );
}

const temas = ['claro', 'oscuro'] as const;

function objetivos(raiz: HTMLElement): HTMLElement[] {
  return [...raiz.querySelectorAll<HTMLElement>('button, input')];
}

describe('PRU-CMP-VAL-102 botones y campos', () => {
  it.each(temas)('PRU-CMP-VAL-102 axe sin violaciones en el tema %s', async (tema) => {
    document.documentElement.dataset['theme'] = tema;
    const raiz = montar(<Galeria />);
    const { violations } = await axe.run(raiz, {
      runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
    });
    expect(
      violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
    ).toEqual([]);
  });

  it('PRU-CMP-VAL-102 todo control mide al menos 44 × 44 px', () => {
    const raiz = montar(<Galeria />);
    const medidas = objetivos(raiz).map((el) => {
      const r = el.getBoundingClientRect();
      return {
        texto: el.textContent || el.getAttribute('aria-label') || el.tagName,
        ancho: r.width,
        alto: r.height,
      };
    });
    expect(medidas.length).toBeGreaterThan(8);
    expect(medidas.filter((m) => m.ancho < 44 || m.alto < 44)).toEqual([]);
  });

  it('PRU-CMP-VAL-102 cada control tiene nombre accesible y el foco se ve', () => {
    const raiz = montar(<Galeria />);
    for (const el of raiz.querySelectorAll<HTMLElement>('button, input')) {
      const etiquetas = (el as HTMLInputElement).labels;
      const nombre =
        el.textContent.trim() || el.getAttribute('aria-label') || etiquetas?.[0]?.textContent;
      expect(nombre, el.outerHTML).toBeTruthy();
      if (el.matches(':disabled')) continue;
      act(() => {
        el.focus();
      });
      const estilo = getComputedStyle(el);
      expect(el.matches(':focus-visible'), el.outerHTML).toBe(true);
      expect(estilo.outlineStyle, el.outerHTML).toBe('solid');
      expect(Number(estilo.outlineWidth.slice(0, -2))).toBeGreaterThanOrEqual(2);
    }
  });

  it('PRU-CMP-VAL-102 deshabilitado muestra el motivo en texto asociado; enviando no pierde el foco ni envía', () => {
    const alClic = vi.fn();
    const raiz = montar(
      <>
        <Boton deshabilitado motivoDeshabilitado="Falta elegir la cuenta">
          Registrar
        </Boton>
        <Boton enviando textoEnviando="Guardando…" onClick={alClic}>
          Guardar
        </Boton>
      </>,
    );
    const [bloqueado, enviando] = [...raiz.querySelectorAll('button')] as [
      HTMLButtonElement,
      HTMLButtonElement,
    ];
    expect(bloqueado.disabled).toBe(true);
    const motivo = document.getElementById(bloqueado.getAttribute('aria-describedby') ?? '');
    expect(motivo?.textContent).toBe('Falta elegir la cuenta');
    expect(getComputedStyle(motivo as HTMLElement).display).not.toBe('none');
    expect(enviando.disabled).toBe(false);
    expect(enviando.getAttribute('aria-disabled')).toBe('true');
    expect(enviando.textContent).toBe('Guardando…');
    enviando.focus();
    act(() => {
      enviando.click();
    });
    expect(document.activeElement).toBe(enviando);
    expect(alClic).not.toHaveBeenCalled();
  });

  it('PRU-CMP-VAL-102 el campo asocia etiqueta, descripción y error; marca los opcionales', () => {
    const raiz = montar(
      <>
        <EntradaTexto etiqueta="Nombre" descripcion="Como aparece en la lista" />
        <EntradaTexto etiqueta="Monto" requerido error="Escribí un monto mayor a cero" />
      </>,
    );
    const [nombre, monto] = [...raiz.querySelectorAll('input')] as [
      HTMLInputElement,
      HTMLInputElement,
    ];
    expect(nombre.labels?.[0]?.textContent).toBe('Nombre');
    expect(raiz.textContent).toContain('Opcional');
    expect(
      document.getElementById(nombre.getAttribute('aria-describedby') ?? '')?.textContent,
    ).toBe('Como aparece en la lista');
    expect(nombre.hasAttribute('aria-invalid')).toBe(false);
    expect(monto.getAttribute('aria-invalid')).toBe('true');
    expect(monto.getAttribute('aria-required')).toBe('true');
    expect(
      document.getElementById(monto.getAttribute('aria-describedby') ?? '')?.textContent,
    ).toContain('Escribí un monto mayor a cero');
  });
});

// TA-567 (CH-240): componentes base de la auditoría.
describe('PRU-CMP-PWA componentes base de la auditoría', () => {
  it('PRU-CMP-PWA-761 [CH-240] el foco visible de Boton, Pastillas y un enlace usa --foco (3 px, separado 2 px), no el contorno del navegador', async () => {
    const nodo = montar(
      <>
        <Boton>Guardar</Boton>
        <Pastillas
          etiqueta="Filtro"
          opciones={[
            { valor: 'a', etiqueta: 'Uno' },
            { valor: 'b', etiqueta: 'Dos' },
          ]}
          valor="a"
          alCambiar={() => undefined}
        />
        <a href="/x">Enlace</a>
      </>,
    );
    const sonda = document.createElement('span');
    sonda.style.color = 'var(--foco)';
    nodo.append(sonda);
    const foco = getComputedStyle(sonda).color;
    for (const control of nodo.querySelectorAll<HTMLElement>('button, a[href]')) {
      control.focus({ focusVisible: true } as FocusOptions);
      const e = getComputedStyle(control);
      expect(e.outlineStyle, control.textContent ?? '').toBe('solid');
      expect(e.outlineWidth).toBe('3px');
      expect(e.outlineOffset).toBe('2px');
      expect(e.outlineColor).toBe(foco);
    }
  });

  it('PRU-CMP-PWA-762 [CH-240] las acciones de Resultado y Vacio son botones tonales de 44 px, y un monto en un botón usa cifras tabulares con su espacio', () => {
    const nodo = montar(
      <>
        <Resultado texto="Listo" salida={{ etiqueta: 'Deshacer', ejecutar: () => undefined }} />
        <Vacio titulo="Nada" texto="Sin datos" accion={<a href="/crear">Crear</a>} />
        <Boton>Asignar $75.00</Boton>
      </>,
    );
    const tonal = document.createElement('span');
    tonal.style.backgroundColor = 'var(--accion-tonal)';
    nodo.append(tonal);
    const fondoTonal = getComputedStyle(tonal).backgroundColor;
    const acciones = [
      nodo.querySelector('[data-testid="resultado"] button'),
      nodo.querySelector('a[href="/crear"]'),
    ] as HTMLElement[];
    for (const a of acciones) {
      const e = getComputedStyle(a);
      expect(e.backgroundColor).toBe(fondoTonal);
      expect(e.textDecorationLine).toBe('none');
      expect(a.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    }
    const boton = [...nodo.querySelectorAll('button')].find((b) =>
      b.textContent?.startsWith('Asignar'),
    ) as HTMLElement;
    expect(getComputedStyle(boton).fontVariantNumeric).toContain('tabular-nums');
    expect(boton.textContent).toMatch(/Asignar \$75\.00/);
  });

  it('PRU-CMP-PWA-763 [CH-240] un formulario con dos errores tiene una sola alerta (el resumen) y cada campo enlaza su mensaje', () => {
    const nodo = montar(
      <form>
        <p role="alert">Revisá los campos marcados.</p>
        <EntradaTexto etiqueta="Nombre" error="Completá este campo." />
        <EntradaTexto etiqueta="Comercio" error="Es demasiado corto." />
      </form>,
    );
    expect(nodo.querySelectorAll('[role="alert"]')).toHaveLength(1);
    for (const campo of nodo.querySelectorAll('input')) {
      const id = campo.getAttribute('aria-describedby') ?? '';
      expect(campo.getAttribute('aria-invalid')).toBe('true');
      expect(nodo.querySelector(`#${CSS.escape(id)}`)?.textContent).toMatch(/\./);
    }
  });
});
