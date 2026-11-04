// Las líneas de un gasto dividido de `/registrar/gasto` (FT-21; K4 y S5 del export; 07 §17: un componente con sus textos, sus
// filas y su teclado es una CMP). La suma y la ayuda son las de PF-3: la interfaz muestra, el servidor valida.
import axe from 'axe-core';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { useFieldArray, useForm } from 'react-hook-form';
import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import '../../app/globals.css';
import { registrarGasto as t } from '../../textos/registrar-gasto';
import { parteVacia, type Campos } from './campos';
import LineasDeGasto from './lineas';

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

const SUPER = '22222222-2222-4222-8222-222222222222';
const MASCOTA = '33333333-3333-4333-8333-333333333333';
const ANA = '44444444-4444-4444-8444-444444444444';
const categorias = [
  { id: SUPER, nombre: 'Supermercado' },
  { id: MASCOTA, nombre: 'Mascota' },
];
const deudores = [{ id: ANA, nombre: 'Ana' }];

function Arnes({ inicial, total }: { readonly inicial: Campos['lineas']; readonly total: string }) {
  const formulario = useForm<Campos>({
    defaultValues: {
      cuentaId: '',
      fecha: '2027-02-10',
      total,
      comercio: '',
      nota: '',
      lineas: inicial,
    },
  });
  const partes = useFieldArray({ control: formulario.control, name: 'lineas' });
  const c = formulario.watch();
  return (
    <>
      <LineasDeGasto
        lineas={c.lineas}
        claves={partes.fields.map((f) => f.id)}
        categorias={categorias}
        deudores={deudores}
        total={c.total}
        error={() => undefined}
        errorDeLasPartes={undefined}
        ayuda={undefined}
        poner={(nombre) => (valor) => {
          formulario.setValue(nombre, valor);
        }}
        registroDeudorNuevo={(i) => formulario.register(`lineas.${i}.deudorNuevo`)}
        alAgregar={() => {
          partes.append(parteVacia());
        }}
        alQuitar={(i) => {
          partes.remove(i);
        }}
      />
      <output data-testid="estado">{JSON.stringify(c.lineas)}</output>
    </>
  );
}

function montar(inicial: Campos['lineas'], total: string): HTMLElement {
  document.body.style.cssText =
    'background: var(--fondo); color: var(--texto); font-family: var(--fuente-cuerpo)';
  const nodo = document.createElement('main');
  nodo.style.width = '350px';
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(<Arnes inicial={inicial} total={total} />);
  });
  montados.push({ raiz, nodo });
  return nodo;
}

const dos = [
  { ...parteVacia(), monto: '30', categoriaId: SUPER },
  { ...parteVacia(), monto: '20', categoriaId: MASCOTA },
];
const boton = (nodo: HTMLElement, nombre: string): HTMLButtonElement => {
  const b = [...nodo.querySelectorAll('button')].find(
    (x) => (x.getAttribute('aria-label') ?? x.textContent) === nombre,
  );
  if (b === undefined) throw new Error(`no hay un botón «${nombre}»`);
  return b;
};
const estado = (nodo: HTMLElement): Campos['lineas'] =>
  JSON.parse(nodo.querySelector('[data-testid=estado]')?.textContent ?? '[]') as Campos['lineas'];

describe('PRU-CMP-TX', () => {
  it('PRU-CMP-TX-441 [CA-21.1] dividir muestra «Dividir · opcional», la cantidad de líneas y una fila con selección, monto y × por línea, sin tarjetas ni radios', () => {
    const nodo = montar(dos, '100');
    expect(nodo.textContent).toContain(t.dividir);
    expect(nodo.textContent).toContain(t.opcional);
    expect(nodo.textContent).toContain('2 líneas');
    expect(nodo.querySelectorAll('[data-parte]')).toHaveLength(2);
    expect(nodo.querySelectorAll('select')).toHaveLength(2);
    expect(nodo.querySelectorAll('input[name^="lineas."][name$=".monto"]')).toHaveLength(2);
    expect(nodo.querySelectorAll('button[aria-label^="Quitar"]')).toHaveLength(2);
    expect(nodo.querySelectorAll('[role=radio], [role=radiogroup]')).toHaveLength(0);
    expect(boton(nodo, t.agregarLinea)).toBeTruthy();
  });

  it('PRU-CMP-TX-441 [CA-21.5] la suma de las líneas dice lo escrito contra el total y no aparece sin un total válido', () => {
    const nodo = montar(dos, '100');
    const suma = nodo.querySelector('[data-testid=suma-lineas]');
    expect(suma?.textContent).toBe(`${t.sumaDeLineas}$50.00${t.sumaDe}$100.00`);
    const sinTotal = montar(dos, '');
    expect(sinTotal.querySelector('[data-testid=suma-lineas]')).toBeNull();
  });

  it('PRU-CMP-TX-442 [CA-21.2] el destino de la línea es una selección con las categorías y las personas que me deben, y «otra persona» pide el nombre', async () => {
    const nodo = montar([{ ...parteVacia(), monto: '30' }], '30');
    const select = nodo.querySelector('select');
    if (select === null) throw new Error('no hay selección');
    expect([...select.querySelectorAll('optgroup')].map((g) => g.label)).toEqual([
      t.grupoCategorias,
      t.grupoPorCobrar,
    ]);
    const etiquetas = [...select.querySelectorAll('option')].map((o) => o.textContent);
    expect(etiquetas).toEqual(
      expect.arrayContaining([
        'Supermercado',
        'Mascota',
        t.porCobrarA('Ana'),
        t.porCobrarA(t.otraPersona),
      ]),
    );
    expect(nodo.textContent).not.toContain(t.deudorNuevoDeParte('1'));

    await act(async () => {
      await userEvent.selectOptions(select, `d:nuevo`);
    });
    expect(estado(nodo)[0]).toMatchObject({
      destino: 'por_cobrar',
      deudorId: 'nuevo',
      categoriaId: '',
    });
    expect(nodo.textContent).toContain(t.deudorNuevoDeParte('1'));

    await act(async () => {
      await userEvent.selectOptions(select, `c:${SUPER}`);
    });
    expect(estado(nodo)[0]).toMatchObject({ destino: 'categoria', categoriaId: SUPER });
    expect(nodo.textContent).not.toContain(t.deudorNuevoDeParte('1'));
  });

  it('PRU-CMP-TX-443 [CA-21.1] agregar una línea suma una fila, quitar la saca y con una sola línea no hay ×', async () => {
    const nodo = montar([{ ...parteVacia(), monto: '30' }], '30');
    expect(nodo.querySelectorAll('button[aria-label^="Quitar"]')).toHaveLength(0);
    await act(() => {
      boton(nodo, t.agregarLinea).click();
      return Promise.resolve();
    });
    expect(nodo.querySelectorAll('[data-parte]')).toHaveLength(2);
    expect(nodo.textContent).toContain('2 líneas');
    await act(() => {
      boton(nodo, t.quitarParte('2')).click();
      return Promise.resolve();
    });
    expect(nodo.querySelectorAll('[data-parte]')).toHaveLength(1);
    expect(nodo.textContent).toContain('1 línea');
  });

  it.each(['claro', 'oscuro'] as const)(
    'PRU-CMP-TX-443 [CA-21.1] axe sin violaciones en el tema %s',
    async (tema) => {
      document.documentElement.dataset['theme'] = tema;
      const nodo = montar(dos, '100');
      const { violations } = await axe.run(nodo, {
        runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
      });
      expect(
        violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
      ).toEqual([]);
    },
  );
});
