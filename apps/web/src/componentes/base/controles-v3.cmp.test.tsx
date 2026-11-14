// Casilla, interruptor, opciones y elección v3 (C-45; docs/anexos/finn-campos-v3/CAMPOS-V3.md §8 y §9): filas tocables
// enteras, tarjetas, segmentado, chips de personas y «Agregar otra persona». Los CA-K3-n de PROMPT-CAMPOS.md §5 van en el
// texto del título. El navegador de prueba toca y escribe de verdad.
import axe from 'axe-core';
import { act, useState, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import '../../app/globals.css';
import { base } from '../../textos/base';
import { GrupoCampos } from './campo';
import { Casilla, Interruptor, Opciones } from './controles-fila';
import { ChipsPersonas, TarjetasEleccion, type PersonaChip } from './eleccion';
import { SelectorSegmentado } from './selector-segmentado';

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
  nodo.style.cssText = 'background: var(--fondo); color: var(--texto); padding: 24px; width: 420px';
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  conAct(() => {
    raiz.render(ui);
  });
  montados.push({ raiz, nodo });
  return nodo;
}

function token(propiedad: 'color' | 'backgroundColor' | 'borderColor', nombre: string): string {
  const sonda = document.createElement('div');
  sonda.style.border = '2px solid transparent';
  sonda.style[propiedad] = `var(${nombre})`;
  document.body.append(sonda);
  const valor = getComputedStyle(sonda)[propiedad];
  sonda.remove();
  return valor;
}

const fila = (el: Element): HTMLElement => el.closest('.campo-fila') as HTMLElement;
/** Toca la fila justo donde está ese texto: el control nativo cubre la fila sin verse. */
async function tocarTexto(texto: HTMLElement): Promise<void> {
  const caja = fila(texto).getBoundingClientRect();
  const t = texto.getBoundingClientRect();
  await userEvent.click(fila(texto), {
    position: { x: t.left - caja.left + t.width / 2, y: t.top - caja.top + t.height / 2 },
  });
}
const porNombre = (raiz: HTMLElement, rol: string, nombre: string): HTMLElement =>
  [...raiz.querySelectorAll<HTMLElement>(`[role="${rol}"], input`)].find(
    (e) =>
      (e.getAttribute('role') ?? (e as HTMLInputElement).type) === rol &&
      nombreDe(e) === nombre,
  ) as HTMLElement;
function nombreDe(e: HTMLElement): string {
  const ids = e.getAttribute('aria-labelledby');
  if (ids !== null)
    return ids
      .split(' ')
      .map((id) => document.getElementById(id)?.textContent ?? '')
      .join(' ');
  return e.getAttribute('aria-label') ?? e.textContent.trim();
}

function Casillas() {
  const [super_, setSuper] = useState(true);
  const [farmacia, setFarmacia] = useState(false);
  const [radio, setRadio] = useState(true);
  const [tipo, setTipo] = useState('gasto');
  return (
    <>
      <GrupoCampos>
        <Casilla etiqueta="Supermercado" cifra="$62.85" marcada={super_} alCambiar={setSuper} />
        <Casilla etiqueta="Farmacia" cifra="$27.65" marcada={farmacia} alCambiar={setFarmacia} />
        <Casilla
          etiqueta="Casa"
          descripcion="Algunas elegidas"
          marcada="mixta"
          alCambiar={() => {}}
        />
        <Casilla
          etiqueta="Netflix"
          descripcion="No se puede elegir: está archivada"
          marcada={false}
          alCambiar={setFarmacia}
          deshabilitada
        />
      </GrupoCampos>
      <GrupoCampos>
        <Interruptor
          etiqueta="Registrar sola"
          descripcion="Al llegar el SMS, sin pasar por la bandeja"
          encendido={radio}
          alCambiar={setRadio}
        />
      </GrupoCampos>
      <Opciones
        etiqueta="Tipo"
        valor={tipo}
        alCambiar={setTipo}
        opciones={[
          { valor: 'gasto', etiqueta: 'Gasto' },
          { valor: 'ingreso', etiqueta: 'Ingreso' },
          { valor: 'transferencia', etiqueta: 'Transferencia' },
          { valor: 'pago', etiqueta: 'Pago de tarjeta', descripcion: 'No tenés tarjetas', deshabilitada: true },
        ]}
      />
    </>
  );
}

const CONOCIDAS: PersonaChip[] = [
  { clave: 'd-carlos', nombre: 'Carlos' },
  { clave: 'd-ana', nombre: 'Ana' },
  { clave: 'd-marta', nombre: 'Marta' },
];

function Personas({ inicial = ['d-carlos'] }: { readonly inicial?: readonly string[] }) {
  const [personas, setPersonas] = useState<readonly PersonaChip[]>(CONOCIDAS);
  const [elegidas, setElegidas] = useState(inicial);
  return (
    <ChipsPersonas
      etiqueta="Con quién"
      personas={personas}
      elegidas={elegidas}
      alCambiar={setElegidas}
      alCrear={(p) => {
        setPersonas((xs) => [...xs, p]);
      }}
    />
  );
}

describe('PRU-CMP-VAL casilla, interruptor, opciones y elección v3', () => {
  it('PRU-CMP-VAL-834 [C-45] CA-K3-8: tocar el texto de una fila cambia su casilla; la casilla a medias tiene aria-checked mixed; el interruptor es un switch a la derecha que anuncia su estado; las opciones van en un radiogroup con nombre; toda la fila mide 56 y con foco se levanta', async () => {
    const raiz = montar(<Casillas />);
    const supermercado = porNombre(raiz, 'checkbox', 'Supermercado') as HTMLInputElement;
    const farmacia = porNombre(raiz, 'checkbox', 'Farmacia') as HTMLInputElement;
    expect(supermercado.checked).toBe(true);
    expect(farmacia.checked).toBe(false);
    // Toda la fila es el `<label>` y mide 56 como mínimo.
    expect(fila(farmacia).tagName).toBe('LABEL');
    expect(fila(farmacia).getBoundingClientRect().height).toBeGreaterThanOrEqual(56);
    // Tocar el texto de la fila cambia su casilla.
    const texto = [...fila(farmacia).querySelectorAll('span')].find(
      (s) => s.textContent === 'Farmacia',
    ) as HTMLElement;
    await tocarTexto(texto);
    await vi.waitFor(() => {
      expect(farmacia.checked).toBe(true);
    });
    const caja = fila(farmacia).querySelector('[data-control]') as HTMLElement;
    expect(getComputedStyle(caja).backgroundColor).toBe(token('backgroundColor', '--accion'));
    expect(caja.getBoundingClientRect().width).toBe(22);
    // La cifra va a la derecha del texto.
    const cifra = [...fila(farmacia).querySelectorAll('span')].find(
      (s) => s.textContent === '$27.65',
    ) as HTMLElement;
    expect(cifra.getBoundingClientRect().left).toBeGreaterThan(texto.getBoundingClientRect().right);
    await tocarTexto(texto);
    await vi.waitFor(() => {
      expect(farmacia.checked).toBe(false);
    });
    expect(getComputedStyle(caja).borderColor).toBe(token('borderColor', '--borde-control'));

    // A medias.
    const casa = porNombre(raiz, 'checkbox', 'Casa') as HTMLInputElement;
    expect(casa.getAttribute('aria-checked')).toBe('mixed');
    expect(casa.indeterminate).toBe(true);
    expect(document.getElementById(casa.getAttribute('aria-describedby') ?? '')?.textContent).toBe(
      'Algunas elegidas',
    );

    // Deshabilitada: no cambia y la fila se apaga.
    const netflix = porNombre(raiz, 'checkbox', 'Netflix') as HTMLInputElement;
    expect(netflix.disabled).toBe(true);
    await userEvent.click(fila(netflix), { force: true });
    expect(netflix.checked).toBe(false);
    expect(fila(netflix).hasAttribute('data-apagado')).toBe(true);

    // Con foco, la fila se levanta como un campo: superficie elevada y sale 6 px a cada lado.
    supermercado.focus();
    const levantada = getComputedStyle(fila(supermercado));
    expect(levantada.backgroundColor).toBe(token('backgroundColor', '--superficie-elevada'));
    expect(levantada.marginLeft).toBe('-6px');
    expect(levantada.marginRight).toBe('-6px');

    // Interruptor: `role="switch"`, a la derecha, anuncia su estado.
    const interruptor = porNombre(raiz, 'switch', 'Registrar sola') as HTMLInputElement;
    expect(interruptor.checked).toBe(true);
    const pista = fila(interruptor).querySelector('[data-control]') as HTMLElement;
    const rotulo = [...fila(interruptor).querySelectorAll('span')].find(
      (s) => s.textContent === 'Registrar sola',
    ) as HTMLElement;
    expect(pista.getBoundingClientRect().left).toBeGreaterThan(rotulo.getBoundingClientRect().right);
    expect(pista.getBoundingClientRect().width).toBe(44);
    expect(pista.getBoundingClientRect().height).toBe(26);
    expect(getComputedStyle(pista).backgroundColor).toBe(token('backgroundColor', '--accion'));
    await tocarTexto(rotulo);
    await vi.waitFor(() => {
      expect(interruptor.checked).toBe(false);
    });
    expect(getComputedStyle(pista).backgroundColor).toBe(
      token('backgroundColor', '--borde-control'),
    );

    // Opciones: un `radiogroup` con nombre; tocar el texto elige; la deshabilitada no.
    const grupo = raiz.querySelector('[role="radiogroup"]') as HTMLElement;
    expect(grupo.getAttribute('aria-label')).toBe('Tipo');
    const ingreso = porNombre(raiz, 'radio', 'Ingreso') as HTMLInputElement;
    expect(fila(ingreso).tagName).toBe('LABEL');
    await userEvent.click(fila(ingreso));
    await vi.waitFor(() => {
      expect(ingreso.checked).toBe(true);
    });
    expect(
      (porNombre(raiz, 'radio', 'Gasto') as HTMLInputElement).checked,
    ).toBe(false);
    expect((porNombre(raiz, 'radio', 'Pago de tarjeta') as HTMLInputElement).disabled).toBe(true);
    // Las flechas mueven la elección (radios nativos con el mismo nombre).
    ingreso.focus();
    await userEvent.keyboard('{ArrowDown}');
    await vi.waitFor(() => {
      expect((porNombre(raiz, 'radio', 'Transferencia') as HTMLInputElement).checked).toBe(true);
    });
  });

  it('PRU-CMP-VAL-835 [C-45] tarjetas de elección en dos columnas con lo elegido en borde 2 px de acción y fondo tonal; el segmentado v3 dentro de un grupo, y fuera de él como hoy', async () => {
    function Tarjetas() {
      const [v, setV] = useState('solo');
      return (
        <TarjetasEleccion
          etiqueta="Quién paga"
          valor={v}
          alCambiar={setV}
          opciones={[
            { valor: 'solo', titulo: 'Solo yo', detalle: 'Todo va a la categoría', icono: 'user' },
            { valor: 'con', titulo: 'Con alguien', detalle: 'Su parte queda por cobrar', icono: 'user' },
          ]}
        />
      );
    }
    const raiz = montar(
      <>
        <Tarjetas />
        <GrupoCampos>
          <SelectorSegmentado
            etiqueta="Modo"
            valor="iguales"
            alCambiar={() => {}}
            opciones={[
              { valor: 'iguales', etiqueta: 'En partes iguales' },
              { valor: 'pct', etiqueta: 'Porcentaje' },
              { valor: 'montos', etiqueta: 'Montos' },
            ]}
          />
        </GrupoCampos>
        <SelectorSegmentado
          etiqueta="Vista"
          valor="a"
          alCambiar={() => {}}
          opciones={[
            { valor: 'a', etiqueta: 'Gráfico' },
            { valor: 'b', etiqueta: 'Tabla' },
          ]}
        />
      </>,
    );
    const grupo = raiz.querySelector('[role="radiogroup"][aria-label="Quién paga"]') as HTMLElement;
    const solo = porNombre(raiz, 'radio', 'Solo yo') as HTMLInputElement;
    const con = porNombre(raiz, 'radio', 'Con alguien') as HTMLInputElement;
    expect(grupo.contains(solo)).toBe(true);
    const tarjeta = (e: HTMLElement) => e.closest('label') as HTMLElement;
    expect(tarjeta(solo).getBoundingClientRect().height).toBeGreaterThanOrEqual(96);
    // Dos columnas: la segunda tarjeta está a la derecha de la primera.
    expect(tarjeta(con).getBoundingClientRect().left).toBeGreaterThan(
      tarjeta(solo).getBoundingClientRect().right,
    );
    await userEvent.click(tarjeta(con));
    await vi.waitFor(() => {
      expect(con.checked).toBe(true);
    });
    const elegida = getComputedStyle(tarjeta(con));
    expect(elegida.borderTopWidth).toBe('2px');
    expect(elegida.borderTopColor).toBe(token('borderColor', '--accion'));
    expect(elegida.backgroundColor).toBe(token('backgroundColor', '--accion-tonal'));
    // Foco de teclado: contorno de 2 px en el color de foco.
    con.focus();
    await userEvent.keyboard('{ArrowLeft}');
    await vi.waitFor(() => {
      expect(solo.checked).toBe(true);
    });
    expect(getComputedStyle(tarjeta(solo)).outlineWidth).toBe('2px');

    // Segmentado v3: pista hundida de radio 11; la elegida en superficie, radio 8, 700 y alto de 44.
    const modo = raiz.querySelector('[role="radiogroup"][aria-label="Modo"]') as HTMLElement;
    expect(modo.hasAttribute('data-v3')).toBe(true);
    expect(getComputedStyle(modo).borderTopLeftRadius).toBe('11px');
    expect(getComputedStyle(modo).backgroundColor).toBe(
      token('backgroundColor', '--superficie-hundida'),
    );
    const iguales = porNombre(raiz, 'radio', 'En partes iguales');
    expect(getComputedStyle(iguales).fontWeight).toBe('700');
    expect(getComputedStyle(iguales).borderTopLeftRadius).toBe('8px');
    expect(iguales.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    const indicador = modo.querySelector('[data-segmento-indicador]') as HTMLElement;
    await vi.waitFor(() => {
      expect(getComputedStyle(indicador).boxShadow).toContain('0px 0px 0px 1px');
    });
    // Fuera de un grupo, el segmentado sigue como hoy.
    const vista = raiz.querySelector('[role="radiogroup"][aria-label="Vista"]') as HTMLElement;
    expect(vista.hasAttribute('data-v3')).toBe(false);
  });

  it('PRU-CMP-VAL-836 [C-45] CA-K3-12: chips de personas con «Otra persona»; «ana» marca la Ana existente con su aviso, «Luis» llega con «Nueva», «yo» y el vacío se rechazan, Escape cancela y más de 19 llega al máximo', async () => {
    const raiz = montar(<Personas />);
    const grupo = raiz.querySelector('[role="group"]') as HTMLElement;
    expect(grupo.getAttribute('aria-label')).toBe('Con quién');
    // El nombre del chip, sin la inicial del avatar (oculta a los lectores).
    const visible = (c: HTMLElement) =>
      [...c.childNodes]
        .filter((n) => !(n instanceof Element && n.hasAttribute('aria-hidden')))
        .map((n) => n.textContent)
        .join('');
    const chip = (nombre: string) =>
      [...grupo.querySelectorAll<HTMLElement>('[role="checkbox"]')].find((c) =>
        visible(c).startsWith(nombre),
      ) as HTMLElement;
    expect(chip('Carlos').getAttribute('aria-checked')).toBe('true');
    expect(chip('Ana').getAttribute('aria-checked')).toBe('false');
    expect(chip('Carlos').getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    expect(getComputedStyle(chip('Carlos')).backgroundColor).toBe(
      token('backgroundColor', '--accion-tonal'),
    );
    // Marcar y desmarcar.
    await userEvent.click(chip('Marta'));
    await vi.waitFor(() => {
      expect(chip('Marta').getAttribute('aria-checked')).toBe('true');
    });
    await userEvent.click(chip('Marta'));
    await vi.waitFor(() => {
      expect(chip('Marta').getAttribute('aria-checked')).toBe('false');
    });

    // «Otra persona» abre la fila en línea, ya levantada, con el foco en el nombre.
    const otra = () =>
      [...raiz.querySelectorAll('button')].find((b) => b.textContent === base.otraPersona);
    expect(getComputedStyle(otra() as HTMLElement).borderTopStyle).toBe('dashed');
    await userEvent.click(otra() as HTMLElement);
    const entrada = () =>
      porNombre(raiz, 'text', base.nombreDeLaPersona) as HTMLInputElement | undefined;
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(entrada());
    });
    expect(getComputedStyle(fila(entrada() as HTMLElement)).marginLeft).toBe('-6px');
    const estado = raiz.querySelector('[role="status"]') as HTMLElement;

    // «ana» (ya existe): se marca la Ana existente, no se crea otra y se avisa.
    await userEvent.keyboard('ana{Enter}');
    await vi.waitFor(() => {
      expect(chip('Ana').getAttribute('aria-checked')).toBe('true');
    });
    expect(estado.textContent).toBe(base.yaTenias('Ana'));
    expect(estado.textContent).toBe('Ya tenías a Ana en Por cobrar: la sumamos.');
    expect(grupo.querySelectorAll('[role="checkbox"]')).toHaveLength(3);
    expect(entrada()).toBeUndefined();
    expect(document.activeElement).toBe(otra());

    // «Luis»: aparece el chip con «Nueva», marcado.
    await userEvent.click(otra() as HTMLElement);
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(entrada());
    });
    await userEvent.keyboard('luis');
    await userEvent.click(
      [...raiz.querySelectorAll('button')].find((b) => b.textContent === base.agregar) as HTMLElement,
    );
    await vi.waitFor(() => {
      expect(chip('Luis')?.getAttribute('aria-checked')).toBe('true');
    });
    expect(visible(chip('Luis'))).toBe(`Luis ${base.nueva}`);
    expect(estado.textContent).toBe('');

    // «yo»: tu parte ya está. Vacío: escribí un nombre. El error va en la fila y en aria-describedby.
    await userEvent.click(otra() as HTMLElement);
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(entrada());
    });
    await userEvent.keyboard('yo{Enter}');
    await vi.waitFor(() => {
      expect(fila(entrada() as HTMLElement).textContent).toContain(
        'Tu parte ya está: escribí el nombre de la otra persona.',
      );
    });
    expect(entrada()?.getAttribute('aria-invalid')).toBe('true');
    await userEvent.clear(entrada() as HTMLElement);
    await userEvent.keyboard('{Enter}');
    await vi.waitFor(() => {
      expect(fila(entrada() as HTMLElement).textContent).toContain('Escribí un nombre.');
    });
    // Escape cancela sin agregar y devuelve el foco a «Otra persona».
    await userEvent.keyboard('{Escape}');
    await vi.waitFor(() => {
      expect(entrada()).toBeUndefined();
    });
    expect(document.activeElement).toBe(otra());
    expect(grupo.querySelectorAll('[role="checkbox"]')).toHaveLength(4);
  });

  it('PRU-CMP-VAL-837 [C-45] con 19 personas marcadas, «Agregar otra persona» dice que llegaste al máximo', async () => {
    function Muchas() {
      const conocidas = Array.from({ length: 19 }, (_, k) => ({
        clave: `p${String(k)}`,
        nombre: `Persona ${String(k)}`,
      }));
      const [elegidas, setElegidas] = useState<readonly string[]>(conocidas.map((p) => p.clave));
      return (
        <ChipsPersonas
          etiqueta="Con quién"
          personas={conocidas}
          elegidas={elegidas}
          alCambiar={setElegidas}
          alCrear={() => {}}
        />
      );
    }
    const raiz = montar(<Muchas />);
    await userEvent.click(
      [...raiz.querySelectorAll('button')].find((b) => b.textContent === base.otraPersona) as HTMLElement,
    );
    await userEvent.keyboard('Luis{Enter}');
    await vi.waitFor(() => {
      expect(raiz.textContent).toContain('Llegaste al máximo: hasta 19 personas.');
    });
  });

  it.each(['claro', 'oscuro'] as const)(
    'PRU-CMP-VAL-838 [C-45] axe sin violaciones con casillas, interruptor, opciones, tarjetas, segmentado y chips en el tema %s',
    async (tema) => {
      document.documentElement.dataset['theme'] = tema;
      const raiz = montar(
        <>
          <Casillas />
          <TarjetasEleccion
            etiqueta="Quién paga"
            valor="con"
            alCambiar={() => {}}
            opciones={[
              { valor: 'solo', titulo: 'Solo yo', detalle: 'Todo va a la categoría', icono: 'user' },
              { valor: 'con', titulo: 'Con alguien', detalle: 'Su parte queda por cobrar', icono: 'user' },
            ]}
          />
          <GrupoCampos>
            <SelectorSegmentado
              etiqueta="Modo"
              valor="pct"
              alCambiar={() => {}}
              opciones={[
                { valor: 'iguales', etiqueta: 'En partes iguales' },
                { valor: 'pct', etiqueta: 'Porcentaje' },
              ]}
            />
          </GrupoCampos>
          <Personas inicial={['d-carlos', 'd-ana']} />
        </>,
      );
      await userEvent.click(
        [...raiz.querySelectorAll('button')].find((b) => b.textContent === base.otraPersona) as HTMLElement,
      );
      await userEvent.keyboard('yo{Enter}');
      await vi.waitFor(() => {
        expect(raiz.querySelector('[aria-invalid="true"]')).not.toBeNull();
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
