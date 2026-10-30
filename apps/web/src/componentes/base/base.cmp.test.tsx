import axe from 'axe-core';
import { act, useState, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import '../../app/globals.css';
import { Boton } from './boton';
import { EntradaTexto } from './campo';
import { Pastillas } from './pastillas';
import { Buscador, Seleccion, type Opcion } from './seleccion';
import { SelectorSegmentado } from './selector-segmentado';

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

const sieteOpciones: Opcion[] = [
  { valor: 'a', etiqueta: 'Efectivo', descripcion: 'Billetera' },
  { valor: 'b', etiqueta: 'Débito' },
];
const diezOpciones: Opcion[] = Array.from({ length: 10 }, (_, i) => ({
  valor: String(i),
  etiqueta: `Cuenta ${i}`,
}));
const filtros = [
  { valor: 'todas', etiqueta: 'Todas' },
  { valor: 'sobregiradas', etiqueta: 'Sobregiradas' },
];

function Galeria() {
  const [v, setV] = useState('a');
  const [f, setF] = useState('todas');
  const [g, setG] = useState('grafico');
  const [lista, setLista] = useState('3');
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
      <Seleccion etiqueta="Tipo" opciones={sieteOpciones} valor={v} alCambiar={setV} />
      <Seleccion etiqueta="Cuenta" opciones={diezOpciones} valor={lista} alCambiar={setLista} />
      <Buscador
        etiqueta="Categoría"
        buscar={() => Promise.resolve(sieteOpciones)}
        valor={null}
        alCambiar={() => {}}
      />
      <Pastillas etiqueta="Filtrar categorías" opciones={filtros} valor={f} alCambiar={setF} />
      <SelectorSegmentado
        etiqueta="Vista"
        opciones={[
          { valor: 'grafico', etiqueta: 'Gráfico' },
          { valor: 'tabla', etiqueta: 'Tabla' },
        ]}
        valor={g}
        alCambiar={setG}
      />
    </>
  );
}

const temas = ['claro', 'oscuro'] as const;

// Los objetivos de 44 px se miden en el control o en la etiqueta que lo envuelve (radios y segmentos).
function objetivos(raiz: HTMLElement): HTMLElement[] {
  return [
    ...raiz.querySelectorAll<HTMLElement>(
      'button:not([role=radio]), input, label:has([role=radio]), [aria-label=Vista] [role=radio]',
    ),
  ];
}

describe('PRU-CMP-VAL-102 botones, campos, selección, pastillas y selector segmentado', () => {
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
    expect(medidas.length).toBeGreaterThan(15);
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

  it('PRU-CMP-VAL-102 la selección muestra opciones visibles hasta 7 y una lista con más', async () => {
    const raiz = montar(
      <>
        <Seleccion etiqueta="Tipo" opciones={sieteOpciones} valor="a" alCambiar={() => {}} />
        <Seleccion etiqueta="Cuenta" opciones={diezOpciones} valor="3" alCambiar={() => {}} />
      </>,
    );
    expect(raiz.querySelectorAll('[role=radio]')).toHaveLength(2);
    expect(raiz.querySelector('[role=radio][aria-checked=true]')?.getAttribute('value')).toBe('a');
    expect(raiz.querySelector('[role=radiogroup]')?.getAttribute('aria-labelledby')).toBeTruthy();
    const lista = raiz.querySelector('button[role=combobox]') as HTMLButtonElement;
    expect(lista.labels[0]?.textContent).toContain('Cuenta');
    expect(lista.textContent).toBe('Cuenta 3');
    // Radix abre con el puntero, fuera de `act`.
    const entorno = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean };
    entorno.IS_REACT_ACT_ENVIRONMENT = false;
    await userEvent.click(lista);
    await vi.waitFor(() => {
      expect(document.querySelectorAll('[role=option]')).toHaveLength(10);
    });
    await userEvent.keyboard('{Escape}');
    entorno.IS_REACT_ACT_ENVIRONMENT = true;
  });

  it('PRU-CMP-VAL-102 el buscador es un combobox que anuncia la cantidad de resultados', async () => {
    const elegido = vi.fn();
    const raiz = montar(
      <Buscador
        etiqueta="Categoría"
        buscar={() => Promise.resolve(sieteOpciones)}
        valor={null}
        alCambiar={elegido}
      />,
    );
    const caja = raiz.querySelector('input') as HTMLInputElement;
    expect(caja.getAttribute('role')).toBe('combobox');
    // Tecleo real, fuera de `act`: la búsqueda responde sola y se espera el anuncio.
    const entorno = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean };
    entorno.IS_REACT_ACT_ENVIRONMENT = false;
    await userEvent.type(caja, 'e');
    await vi.waitFor(() => {
      expect(raiz.querySelector('[role=status]')?.textContent).toBe('2 resultados');
    });
    entorno.IS_REACT_ACT_ENVIRONMENT = true;
    expect(caja.getAttribute('aria-expanded')).toBe('true');
    const tecla = (key: string) => {
      act(() => {
        caja.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
      });
    };
    tecla('ArrowDown');
    expect(caja.getAttribute('aria-activedescendant')).toBe(
      raiz.querySelector('[role=option]')?.id,
    );
    tecla('Enter');
    expect(elegido).toHaveBeenCalledWith(sieteOpciones[0]);
  });

  it('PRU-CMP-VAL-102 pastillas y segmentado marcan lo activo con atributo y peso, no solo color', () => {
    const raiz = montar(<Galeria />);
    const activa = raiz.querySelector('[aria-pressed=true]') as HTMLElement;
    const inactiva = raiz.querySelector('[aria-pressed=false]') as HTMLElement;
    expect(getComputedStyle(activa).fontWeight).toBe('700');
    expect(getComputedStyle(inactiva).fontWeight).not.toBe('700');
    expect(raiz.querySelector('[aria-label=Vista]')?.getAttribute('role')).toBe('radiogroup');
    const marcado = raiz.querySelector('[aria-label=Vista] [aria-checked=true]') as HTMLElement;
    expect(getComputedStyle(marcado).fontWeight).toBe('700');
    act(() => {
      raiz.querySelectorAll<HTMLElement>('[aria-label=Vista] [role=radio]')[1]?.click();
    });
    expect(raiz.querySelector('[aria-label=Vista] [aria-checked=true]')?.textContent).toBe('Tabla');
  });
});
