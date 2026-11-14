// Selección y buscador v3 (C-45; docs/anexos/finn-campos-v3/CAMPOS-V3.md §6 y §7): la lista propia con su teclado, la regla
// de cantidad (3 o menos, segmentado) y el combobox de comercios. Los CA-K3-n de PROMPT-CAMPOS.md §5 van en el texto del
// título. El navegador de prueba escribe de verdad; la espera de 250 ms se avanza con relojes falsos, nunca con el de pared.
import axe from 'axe-core';
import { act, useState, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import '../../app/globals.css';
import { base } from '../../textos/base';
import { BuscadorFila, type Sugerencia } from './buscador-fila';
import { GrupoCampos } from './campo';
import { Seleccion } from './seleccion';
import { SeleccionNativa, type OpcionNativa } from './seleccion-nativa';

// Las pruebas operan con el teclado y el puntero reales: las actualizaciones de React llegan fuera de `act`, que solo
// envuelve el montaje y el desmontaje.
const entorno = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean };
function conAct(accion: () => void): void {
  entorno.IS_REACT_ACT_ENVIRONMENT = true;
  try {
    act(accion);
  } finally {
    entorno.IS_REACT_ACT_ENVIRONMENT = false;
  }
}

const montados: { raiz: Root; nodo: HTMLElement }[] = [];
afterEach(() => {
  vi.useRealTimers();
  for (const { raiz, nodo } of montados.splice(0)) {
    conAct(() => {
      raiz.unmount();
    });
    nodo.remove();
  }
  delete document.documentElement.dataset['theme'];
});

function montar(ui: ReactNode): HTMLElement {
  const nodo = document.createElement('main');
  nodo.style.cssText =
    'background: var(--fondo); color: var(--texto); padding: 24px; width: 420px; min-height: 520px';
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  conAct(() => {
    raiz.render(ui);
  });
  montados.push({ raiz, nodo });
  return nodo;
}

/** El valor calculado de un token en el tema actual, leído con la misma propiedad que se compara. */
function token(propiedad: 'color' | 'backgroundColor', nombre: string): string {
  const sonda = document.createElement('div');
  sonda.style[propiedad] = `var(${nombre})`;
  document.body.append(sonda);
  const valor = getComputedStyle(sonda)[propiedad];
  sonda.remove();
  return valor;
}

const CATEGORIAS: OpcionNativa[] = [
  { valor: 'super', etiqueta: 'Supermercado', detalle: 'Disponible $62.85', grupo: 'Casa' },
  { valor: 'farmacia', etiqueta: 'Farmacia', detalle: 'Disponible $27.65', grupo: 'Casa' },
  {
    valor: 'restaurantes',
    etiqueta: 'Restaurantes',
    detalle: 'Disponible −$26.30',
    grupo: 'Comida fuera',
    negativo: true,
  },
  { valor: 'viaje', etiqueta: 'Viaje', detalle: 'Disponible $184.62', grupo: 'Ahorro' },
];

function Categoria({
  inicial = 'super',
  alCambiar,
}: {
  readonly inicial?: string;
  readonly alCambiar?: (v: string) => void;
}) {
  const [valor, setValor] = useState(inicial);
  return (
    <GrupoCampos>
      <SeleccionNativa
        etiqueta="Categoría"
        marcador="Elegí una categoría"
        opciones={CATEGORIAS}
        valor={valor}
        alCambiar={(v) => {
          setValor(v);
          alCambiar?.(v);
        }}
      />
    </GrupoCampos>
  );
}

const disparador = (raiz: HTMLElement): HTMLButtonElement =>
  raiz.querySelector<HTMLButtonElement>('button[aria-haspopup="listbox"]') as HTMLButtonElement;
const lista = (raiz: HTMLElement): HTMLElement | null =>
  raiz.querySelector<HTMLElement>('[role="listbox"]');
const opcion = (raiz: HTMLElement, nombre: string): HTMLElement =>
  [...raiz.querySelectorAll<HTMLElement>('[role="option"]')].find((o) =>
    o.textContent.startsWith(nombre),
  ) as HTMLElement;
const nombreAccesible = (el: Element): string =>
  (el.getAttribute('aria-labelledby') ?? '')
    .split(' ')
    .map((id) => document.getElementById(id)?.textContent ?? '')
    .join(' ');

describe('PRU-CMP-VAL selección y buscador v3', () => {
  it('PRU-CMP-VAL-829 [C-45] CA-K3-5: la categoría se abre con Intro o con un clic en una lista propia con grupos, la elegida en acción tonal con check, el negativo en problema; flechas, Inicio, Fin y letras mueven, Intro elige, Escape cierra y el foco vuelve al disparador', async () => {
    const cambios: string[] = [];
    const raiz = montar(<Categoria alCambiar={(v) => cambios.push(v)} />);
    const boton = disparador(raiz);
    // Nunca el `<select>` del sistema: el disparador es un botón con el nombre «rótulo + valor».
    expect(raiz.querySelector('select')).toBeNull();
    expect(boton.getAttribute('aria-expanded')).toBe('false');
    expect(nombreAccesible(boton)).toBe('Categoría Supermercado');
    const fila = boton.closest('.campo-fila') as HTMLElement;
    expect(fila.textContent).toContain('Disponible $62.85');
    expect(boton.textContent).toBe('Supermercado');

    // Con Intro.
    boton.focus();
    await userEvent.keyboard('{Enter}');
    await vi.waitFor(() => {
      expect(lista(raiz)).not.toBeNull();
    });
    const panel = lista(raiz) as HTMLElement;
    expect(boton.getAttribute('aria-expanded')).toBe('true');
    expect(document.activeElement).toBe(panel);
    expect(getComputedStyle(panel).maxHeight).toBe('340px');
    expect(getComputedStyle(panel).backgroundColor).toBe(
      token('backgroundColor', '--superficie-elevada'),
    );
    // Grupos con su rótulo, en mayúsculas.
    const grupos = [...panel.querySelectorAll('[role="group"]')];
    expect(grupos.map((g) => nombreAccesible(g))).toEqual(['Casa', 'Comida fuera', 'Ahorro']);
    const rotuloGrupo = document.getElementById(
      grupos[0]?.getAttribute('aria-labelledby') ?? '',
    ) as HTMLElement;
    expect(getComputedStyle(rotuloGrupo).textTransform).toBe('uppercase');
    // La elegida: acción tonal, 700 y check; es la activa al abrir.
    const elegida = opcion(raiz, 'Supermercado');
    expect(elegida.getAttribute('aria-selected')).toBe('true');
    expect(getComputedStyle(elegida).backgroundColor).toBe(
      token('backgroundColor', '--accion-tonal'),
    );
    expect(elegida.querySelector('[data-icono="check"]')).not.toBeNull();
    expect(panel.getAttribute('aria-activedescendant')).toBe(elegida.id);
    for (const o of panel.querySelectorAll('[role="option"]'))
      expect(o.getBoundingClientRect().height).toBeGreaterThanOrEqual(48);
    // Restaurantes con su disponible negativo en problema.
    const negativo = [...opcion(raiz, 'Restaurantes').querySelectorAll('span')].find(
      (s) => s.textContent === 'Disponible −$26.30',
    ) as HTMLElement;
    expect(getComputedStyle(negativo).color).toBe(token('color', '--problema-texto'));

    // Flechas: la activa se mueve con `aria-activedescendant` y lleva la superficie hundida.
    await userEvent.keyboard('{ArrowDown}');
    await vi.waitFor(() => {
      expect(panel.getAttribute('aria-activedescendant')).toBe(opcion(raiz, 'Farmacia').id);
    });
    expect(getComputedStyle(opcion(raiz, 'Farmacia')).backgroundColor).toBe(
      token('backgroundColor', '--superficie-hundida'),
    );
    await userEvent.keyboard('{End}');
    await vi.waitFor(() => {
      expect(panel.getAttribute('aria-activedescendant')).toBe(opcion(raiz, 'Viaje').id);
    });
    await userEvent.keyboard('{Home}');
    await vi.waitFor(() => {
      expect(panel.getAttribute('aria-activedescendant')).toBe(opcion(raiz, 'Supermercado').id);
    });
    // Escribir una letra salta a la opción.
    await userEvent.keyboard('r');
    await vi.waitFor(() => {
      expect(panel.getAttribute('aria-activedescendant')).toBe(opcion(raiz, 'Restaurantes').id);
    });
    // Intro elige y cierra; el foco vuelve al disparador.
    await userEvent.keyboard('{Enter}');
    await vi.waitFor(() => {
      expect(lista(raiz)).toBeNull();
    });
    expect(cambios).toEqual(['restaurantes']);
    expect(document.activeElement).toBe(boton);
    expect(nombreAccesible(boton)).toBe('Categoría Restaurantes');
    const detalle = [...fila.querySelectorAll('span')].find(
      (s) => s.textContent === 'Disponible −$26.30',
    ) as HTMLElement;
    expect(getComputedStyle(detalle).color).toBe(token('color', '--problema-texto'));

    // Con un clic; Escape cierra sin cambiar y el foco vuelve.
    await userEvent.click(boton);
    await vi.waitFor(() => {
      expect(lista(raiz)).not.toBeNull();
    });
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{Escape}');
    await vi.waitFor(() => {
      expect(lista(raiz)).toBeNull();
    });
    expect(cambios).toEqual(['restaurantes']);
    expect(document.activeElement).toBe(boton);

    // Un clic en una opción elige; un clic afuera cierra sin cambiar.
    await userEvent.click(boton);
    await vi.waitFor(() => {
      expect(lista(raiz)).not.toBeNull();
    });
    await userEvent.click(opcion(raiz, 'Viaje'));
    await vi.waitFor(() => {
      expect(lista(raiz)).toBeNull();
    });
    expect(cambios).toEqual(['restaurantes', 'viaje']);
    await userEvent.click(boton);
    await vi.waitFor(() => {
      expect(lista(raiz)).not.toBeNull();
    });
    await userEvent.click(document.body, { position: { x: 600, y: 10 } });
    await vi.waitFor(() => {
      expect(lista(raiz)).toBeNull();
    });
    expect(cambios).toEqual(['restaurantes', 'viaje']);
    expect(boton.getAttribute('aria-expanded')).toBe('false');
  });

  it('PRU-CMP-VAL-830 [C-45] CA-K3-5: sin elegir, el marcador en terciario; con error, la fila en problema con el mensaje en aria-describedby; deshabilitada no se abre; el panel se abre debajo de la fila sin tapar el rótulo', async () => {
    const raiz = montar(
      <GrupoCampos>
        <SeleccionNativa
          etiqueta="Categoría"
          marcador="Elegí una categoría"
          opciones={CATEGORIAS}
          valor=""
          alCambiar={() => {}}
          error="Elegí una categoría."
        />
        <SeleccionNativa
          etiqueta="Cuenta"
          marcador="Elegí una cuenta"
          opciones={CATEGORIAS}
          valor="super"
          alCambiar={() => {}}
          deshabilitado
        />
      </GrupoCampos>,
    );
    const [conError, apagada] = [
      ...raiz.querySelectorAll<HTMLButtonElement>('button[aria-haspopup="listbox"]'),
    ] as [HTMLButtonElement, HTMLButtonElement];
    const marcador = conError.querySelector('.campo-marcador') as HTMLElement;
    expect(marcador.textContent).toBe('Elegí una categoría');
    expect(getComputedStyle(marcador).color).toBe(token('color', '--texto-terciario'));
    const fila = conError.closest('.campo-fila') as HTMLElement;
    expect(getComputedStyle(fila).backgroundColor).toBe(
      token('backgroundColor', '--problema-fondo'),
    );
    const descrita = (conError.getAttribute('aria-describedby') ?? '')
      .split(' ')
      .map((id) => document.getElementById(id)?.textContent);
    expect(descrita).toContain('Elegí una categoría.');

    expect(apagada.disabled).toBe(true);
    await userEvent.click(apagada, { force: true });
    expect(lista(raiz)).toBeNull();

    await userEvent.click(conError);
    await vi.waitFor(() => {
      expect(lista(raiz)).not.toBeNull();
    });
    const rotulo = fila.querySelector('.campo-rotulo') as HTMLElement;
    const panel = lista(raiz) as HTMLElement;
    expect(panel.getBoundingClientRect().top).toBeGreaterThan(
      rotulo.getBoundingClientRect().bottom,
    );
    // Sin opción elegida, la activa al abrir es la primera.
    expect(panel.getAttribute('aria-activedescendant')).toBe(opcion(raiz, 'Supermercado').id);
  });

  it('PRU-CMP-VAL-831 [C-45] CA-K3-6: con 3 opciones o menos la selección es un segmentado sin lista, con 4 o más es la lista; fuera de GrupoCampos Seleccion y SeleccionNativa siguen como hoy', async () => {
    const tres = CATEGORIAS.slice(0, 3);
    const cambios: string[] = [];
    const raiz = montar(
      <>
        <GrupoCampos>
          <Seleccion
            etiqueta="Cuenta"
            opciones={tres.map(({ valor, etiqueta }) => ({ valor, etiqueta }))}
            valor="super"
            alCambiar={(v) => cambios.push(v)}
          />
        </GrupoCampos>
        <div data-fuera>
          <SeleccionNativa
            etiqueta="Fuera"
            marcador="Elegí"
            opciones={CATEGORIAS}
            valor="super"
            alCambiar={() => {}}
          />
          <Seleccion etiqueta="Radios" opciones={tres} valor="super" alCambiar={() => {}} />
        </div>
      </>,
    );
    const grupo = raiz.querySelector('.grupo-campos') as HTMLElement;
    const segmentado = grupo.querySelector('[role="radiogroup"]') as HTMLElement;
    expect(segmentado.getAttribute('aria-label')).toBe('Cuenta');
    expect([...segmentado.querySelectorAll('[role="radio"]')].map((r) => r.textContent)).toEqual([
      'Supermercado',
      'Farmacia',
      'Restaurantes',
    ]);
    expect(grupo.querySelector('[aria-haspopup="listbox"], select')).toBeNull();
    await userEvent.click(
      segmentado.querySelectorAll<HTMLElement>('[role="radio"]')[1] as HTMLElement,
    );
    expect(cambios).toEqual(['farmacia']);

    // Fuera del grupo: la nativa sigue con su `<select>` y la de pocas opciones con sus radios.
    const fuera = raiz.querySelector('[data-fuera]') as HTMLElement;
    expect(fuera.querySelector('select')).not.toBeNull();
    expect(fuera.querySelector('[aria-haspopup="listbox"]')).toBeNull();
    expect(fuera.querySelectorAll('[role="radio"]')).toHaveLength(3);
    expect(fuera.querySelector('.campo-fila')).toBeNull();

    // Con 4 opciones dentro del grupo, la lista.
    const otra = montar(
      <GrupoCampos>
        <Seleccion
          etiqueta="Categoría"
          opciones={CATEGORIAS.map(({ valor, etiqueta, detalle }) => ({
            valor,
            etiqueta,
            descripcion: detalle as string,
          }))}
          valor="viaje"
          alCambiar={() => {}}
        />
      </GrupoCampos>,
    );
    expect(otra.querySelector('[role="radiogroup"]')).toBeNull();
    expect(nombreAccesible(disparador(otra))).toBe('Categoría Viaje');
  });

  it('PRU-CMP-VAL-832 [C-45] CA-K3-7: el buscador de comercio espera 250 ms, dice «Buscando…», resalta lo escrito en 700, anuncia la cantidad, avisa sin resultados y ante un error ofrece «Intentar de nuevo» sin subrayado; lo escrito se respeta', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const pedidos: {
      texto: string;
      resolver: (r: readonly Sugerencia[]) => void;
      fallar: () => void;
    }[] = [];
    const elegidas: Sugerencia[] = [];
    function Comercio() {
      const [texto, setTexto] = useState('');
      return (
        <GrupoCampos>
          <BuscadorFila
            etiqueta="Comercio"
            marcador="¿Dónde fue?"
            valor={texto}
            alCambiar={setTexto}
            alElegir={(s) => elegidas.push(s)}
            buscar={(t) =>
              new Promise((resolver, rechazar) => {
                pedidos.push({
                  texto: t,
                  resolver,
                  fallar: () => {
                    rechazar(new Error('red'));
                  },
                });
              })
            }
          />
          <output data-texto>{texto}</output>
        </GrupoCampos>
      );
    }
    const raiz = montar(<Comercio />);
    const caja = raiz.querySelector('input') as HTMLInputElement;
    expect(caja.getAttribute('role')).toBe('combobox');
    expect(caja.getAttribute('aria-autocomplete')).toBe('list');
    expect(caja.getAttribute('aria-expanded')).toBe('false');
    expect(document.getElementById(caja.getAttribute('aria-controls') ?? '')).not.toBeNull();
    expect(raiz.querySelector('[data-icono="search"]')).not.toBeNull();

    await userEvent.type(caja, 'pric');
    vi.advanceTimersByTime(249);
    expect(pedidos).toHaveLength(0);
    vi.advanceTimersByTime(1);
    expect(pedidos.map((p) => p.texto)).toEqual(['pric']);
    await vi.waitFor(() => {
      expect(raiz.textContent).toContain(base.buscando);
    });
    const buscando = [...raiz.querySelectorAll<HTMLElement>('.campo-fila span')].find(
      (s) => s.textContent === base.buscando,
    ) as HTMLElement;
    expect(getComputedStyle(buscando).fontSize).toBe('13px');

    pedidos[0]?.resolver([
      { valor: 'pricesmart', etiqueta: 'PRICESMART', detalle: base.sueleIrA('Supermercado') },
      {
        valor: 'pricesmart-se',
        etiqueta: 'PRICESMART SANTA ELENA',
        detalle: base.sueleIrA('Supermercado'),
      },
    ]);
    await vi.waitFor(() => {
      expect(raiz.querySelectorAll('[role="option"]')).toHaveLength(2);
    });
    expect(caja.getAttribute('aria-expanded')).toBe('true');
    expect(raiz.querySelector('[role="status"]')?.textContent).toBe(base.comercios(2));
    expect(raiz.textContent).not.toContain(base.buscando);
    const primera = raiz.querySelector('[role="option"]') as HTMLElement;
    const negrita = [...primera.querySelectorAll('span')].find((s) => s.textContent === 'PRIC');
    const resto = [...primera.querySelectorAll('span')].find((s) => s.textContent === 'ESMART');
    expect(getComputedStyle(negrita as HTMLElement).fontWeight).toBe('700');
    expect(getComputedStyle(resto as HTMLElement).fontWeight).toBe('500');
    expect(primera.textContent).toContain('Suele ir a Supermercado');

    // Teclado del combobox: la flecha activa, Intro elige.
    await userEvent.keyboard('{ArrowDown}');
    await vi.waitFor(() => {
      expect(caja.getAttribute('aria-activedescendant')).toBe(primera.id);
    });
    await userEvent.keyboard('{Enter}');
    await vi.waitFor(() => {
      expect(caja.value).toBe('PRICESMART');
    });
    expect(elegidas.map((s) => s.valor)).toEqual(['pricesmart']);
    expect(caja.getAttribute('aria-expanded')).toBe('false');

    // Sin resultados: el aviso y lo escrito queda tal cual.
    await userEvent.clear(caja);
    await userEvent.type(caja, 'pricez');
    vi.advanceTimersByTime(250);
    pedidos.at(-1)?.resolver([]);
    const sinNada = base.sinComercios('pricez');
    expect(sinNada).toBe('No hay comercios con «pricez». Se guarda como comercio nuevo.');
    await vi.waitFor(() => {
      expect(raiz.textContent).toContain(sinNada);
    });
    expect(raiz.querySelector('[data-texto]')?.textContent).toBe('pricez');

    // Error: el mensaje y un botón tonal sin subrayado que vuelve a buscar.
    await userEvent.type(caja, 'x');
    vi.advanceTimersByTime(250);
    pedidos.at(-1)?.fallar();
    await vi.waitFor(() => {
      expect(raiz.textContent).toContain(base.noSePudoBuscar);
    });
    const reintentar = [...raiz.querySelectorAll('button')].find(
      (b) => b.textContent === base.reintentar,
    ) as HTMLButtonElement;
    expect(reintentar.tagName).toBe('BUTTON');
    expect(getComputedStyle(reintentar).textDecorationLine).toBe('none');
    expect(getComputedStyle(reintentar).backgroundColor).toBe(
      token('backgroundColor', '--accion-tonal'),
    );
    expect(reintentar.getBoundingClientRect().height).toBeGreaterThanOrEqual(40);
    const antes = pedidos.length;
    await userEvent.click(reintentar);
    expect(pedidos.length).toBe(antes + 1);
    expect(pedidos.at(-1)?.texto).toBe('pricezx');
    expect(raiz.querySelector('[data-texto]')?.textContent).toBe('pricezx');
  });

  it.each(['claro', 'oscuro'] as const)(
    'PRU-CMP-VAL-833 [C-45] axe sin violaciones con la lista abierta y el buscador en el tema %s',
    async (tema) => {
      document.documentElement.dataset['theme'] = tema;
      const raiz = montar(
        <>
          <Categoria />
          <div style={{ height: 380 }} />
          <GrupoCampos>
            <BuscadorFila
              etiqueta="Comercio"
              valor=""
              alCambiar={() => {}}
              buscar={() =>
                Promise.resolve([
                  { valor: 'p', etiqueta: 'PRICESMART', detalle: base.sueleIrA('Supermercado') },
                ])
              }
            />
          </GrupoCampos>
        </>,
      );
      await userEvent.click(disparador(raiz));
      await vi.waitFor(() => {
        expect(lista(raiz)).not.toBeNull();
      });
      const { violations } = await axe.run(raiz, {
        runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
      });
      expect(
        violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
      ).toEqual([]);
    },
  );
});
