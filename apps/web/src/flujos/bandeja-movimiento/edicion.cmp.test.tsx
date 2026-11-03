// FT-35, edición completa (07 §17: un texto, un estado o el foco de un componente es una CMP). Los campos dibujan los valores del
// movimiento y las partes solo se ofrecen para un gasto; el servidor valida las sumas y los destinos (PF-3).
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { useFieldArray, useForm } from 'react-hook-form';
import { afterEach, describe, expect, it } from 'vitest';
import '../../app/globals.css';
import { bandeja as t } from '../../textos/bandeja';
import { registrarGasto as g } from '../../textos/registrar-gasto';
import { parteVacia } from '../registrar-gasto/campos';
import type { Campos } from './campos';
import Edicion from './edicion';

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

const CUENTA = '11111111-1111-4111-8111-111111111111';
const CATEGORIA = '22222222-2222-4222-8222-222222222222';
const campos = (tipo: string, partes: number): Campos => ({
  cuentaId: CUENTA,
  fecha: '2027-02-20',
  total: '30.00',
  comercio: 'Super',
  nota: '',
  tipo,
  lineas: Array.from({ length: partes }, () => ({ ...parteVacia(), monto: '30.00' })),
});

function Arnes({ inicial }: { readonly inicial: Campos }) {
  const formulario = useForm<Campos>({ defaultValues: inicial });
  const partes = useFieldArray({ control: formulario.control, name: 'lineas' });
  return (
    <Edicion
      formulario={formulario}
      partes={partes}
      cuentas={[{ id: CUENTA, nombre: 'Visa' }]}
      categorias={[{ id: CATEGORIA, nombre: 'Super' }]}
      deudores={[]}
      deLasPartes={undefined}
      ayuda={g.todoRepartido}
    />
  );
}

function montar(inicial: Campos): HTMLElement {
  document.body.style.cssText = 'background: var(--fondo); color: var(--texto)';
  const nodo = document.createElement('main');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(<Arnes inicial={inicial} />);
  });
  montados.push({ raiz, nodo });
  return nodo;
}

const valorDe = (nodo: HTMLElement, etiqueta: string): string | undefined => {
  const l = [...nodo.querySelectorAll('label')].find((x) => x.textContent.startsWith(etiqueta));
  const id = l?.getAttribute('for');
  return id === null || id === undefined
    ? undefined
    : nodo.querySelector<HTMLInputElement>(`[id="${id}"]`)?.value;
};

describe('PRU-CMP-BAND', () => {
  it('PRU-CMP-BAND-113 un gasto muestra el tipo, la cuenta, la fecha, el monto, el comercio, la nota y sus partes con lo que trae el movimiento', () => {
    const nodo = montar(campos('gasto', 1));
    expect(nodo.textContent).toContain(t.revisar.tipo);
    expect(nodo.textContent).toContain(g.cuenta);
    expect(valorDe(nodo, g.fecha)).toBe('2027-02-20');
    expect(valorDe(nodo, t.revisar.monto)).toBe('30.00');
    expect(valorDe(nodo, g.comercio)).toBe('Super');
    expect(nodo.textContent).toContain(g.partes);
    expect(nodo.textContent).toContain(g.parte('1'));
    expect(nodo.textContent).toContain(g.todoRepartido);
  });

  it('PRU-CMP-BAND-114 un ingreso no ofrece partes y un gasto con dos partes muestra las dos', () => {
    const ingreso = montar(campos('ingreso', 0));
    expect(ingreso.textContent).not.toContain(g.partes);
    const dividido = montar(campos('gasto', 2));
    expect(dividido.textContent).toContain(g.parte('1'));
    expect(dividido.textContent).toContain(g.parte('2'));
  });
});
