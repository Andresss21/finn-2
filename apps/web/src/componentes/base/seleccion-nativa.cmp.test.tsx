// SeleccionNativa (K2 y S5 del export; 07 §17: un componente con su aspecto y su teclado es una CMP). Un `<select>` nativo
// transparente sobre el dibujo del campo relleno: el nombre accesible, el valor y la lista son los del navegador.
import axe from 'axe-core';
import { act, useState, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import '../../app/globals.css';
import { SeleccionNativa, type OpcionNativa } from './seleccion-nativa';

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

const cuentas: OpcionNativa[] = [
  { valor: 'a', etiqueta: 'Visa Oro', detalle: 'Deuda $642.18', icono: 'card' },
  { valor: 'b', etiqueta: 'Ahorro', detalle: 'Saldo $500.00', icono: 'wallet' },
];
const destinos: OpcionNativa[] = [
  { valor: 'c:1', etiqueta: 'Supermercado', grupo: 'Categorías' },
  { valor: 'd:1', etiqueta: 'Carlos (me lo debe)', grupo: 'Por cobrar' },
];

function Galeria({ alCambiar }: { readonly alCambiar?: (v: string) => void }) {
  const [cuenta, setCuenta] = useState('a');
  const [destino, setDestino] = useState('');
  return (
    <>
      <SeleccionNativa
        etiqueta="Cuenta o tarjeta"
        alta
        marcador="Elegí una cuenta."
        opciones={cuentas}
        valor={cuenta}
        alCambiar={(v) => {
          setCuenta(v);
          alCambiar?.(v);
        }}
      />
      <SeleccionNativa
        etiqueta="Categoría de la parte 1"
        etiquetaOculta
        marcador="Elegí…"
        opciones={destinos}
        valor={destino}
        alCambiar={setDestino}
        error="Cada parte necesita una categoría o un por cobrar."
      />
    </>
  );
}

const temas = ['claro', 'oscuro'] as const;

describe('PRU-CMP-TX', () => {
  it.each(temas)('PRU-CMP-TX-440 [CA-21.1] axe sin violaciones en el tema %s', async (tema) => {
    document.documentElement.dataset['theme'] = tema;
    const raiz = montar(<Galeria />);
    const { violations } = await axe.run(raiz, {
      runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
    });
    expect(
      violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
    ).toEqual([]);
  });

  it('PRU-CMP-TX-440 [CA-21.1] la cuenta elegida se ve con su nombre y su detalle en un campo de 52 px y la línea sin valor dice el marcador en uno de 48 px', () => {
    const raiz = montar(<Galeria />);
    const [cuenta, destino] = [...raiz.querySelectorAll('select')];
    const cajaCuenta = cuenta?.parentElement;
    const cajaDestino = destino?.parentElement;
    expect(cajaCuenta?.textContent).toContain('Visa Oro');
    expect(cajaCuenta?.textContent).toContain('Deuda $642.18');
    expect(cajaCuenta?.getBoundingClientRect().height).toBe(52);
    expect(cajaDestino?.textContent).toContain('Elegí…');
    expect(cajaDestino?.getBoundingClientRect().height).toBeGreaterThanOrEqual(48);
    expect(raiz.querySelectorAll('[role=radio], [role=radiogroup]')).toHaveLength(0);
  });

  it('PRU-CMP-TX-440 [CA-21.2] cada select tiene su nombre accesible, agrupa las opciones y avisa el error con aria-invalid', () => {
    const raiz = montar(<Galeria />);
    const [cuenta, destino] = [...raiz.querySelectorAll('select')];
    expect(cuenta?.labels[0]?.textContent).toBe('Cuenta o tarjeta');
    expect(destino?.labels[0]?.textContent).toBe('Categoría de la parte 1');
    expect(destino?.getAttribute('aria-invalid')).toBe('true');
    expect(raiz.textContent).toContain('Cada parte necesita una categoría o un por cobrar.');
    expect([...(destino?.querySelectorAll('optgroup') ?? [])].map((g) => g.label)).toEqual([
      'Categorías',
      'Por cobrar',
    ]);
    expect(cuenta?.querySelectorAll('optgroup')).toHaveLength(0);
  });

  it('PRU-CMP-TX-440 [CA-21.1] elegir otra opción cambia el campo cerrado y avisa el valor', async () => {
    const elegidos: string[] = [];
    const raiz = montar(
      <Galeria
        alCambiar={(v) => {
          elegidos.push(v);
        }}
      />,
    );
    const cuenta = raiz.querySelector('select');
    if (cuenta === null) throw new Error('no hay select');
    await act(async () => {
      await userEvent.selectOptions(cuenta, 'b');
    });
    expect(elegidos).toEqual(['b']);
    expect(cuenta.parentElement?.textContent).toContain('Ahorro');
    expect(cuenta.parentElement?.textContent).toContain('Saldo $500.00');
  });
});
