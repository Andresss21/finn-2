// FT-25, campos de la edición (07 §17: un texto o un estado de una pantalla es una CMP). Portados de `pantallas/03-detalle-de-transaccion`
// del export: la cuenta en una selección de 52 px con su detalle, o fija con «Solo lectura»; Fecha y Total en dos columnas; las partes
// compactas de Registrar gasto. La interfaz muestra, el servidor valida (PF-3).
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { useFieldArray, useForm } from 'react-hook-form';
import { afterEach, describe, expect, it } from 'vitest';
import '../../app/globals.css';
import { registrarGasto as g } from '../../textos/registrar-gasto';
import { transaccion as t } from '../../textos/transaccion';
import type { Campos } from '../bandeja-movimiento/campos';
import { parteVacia } from '../registrar-gasto/campos';
import Edicion, { type PropsEdicion } from './edicion';

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
const inicial: Campos = {
  cuentaId: CUENTA,
  fecha: '2027-02-20',
  total: '30.00',
  comercio: 'Super',
  nota: 'Con Carlos',
  tipo: 'gasto',
  lineas: [
    { ...parteVacia(), monto: '20.00', categoriaId: CATEGORIA },
    { ...parteVacia(), monto: '10.00', categoriaId: CATEGORIA },
  ],
};

function Arnes({ extra }: { readonly extra: Partial<PropsEdicion> }) {
  const formulario = useForm<Campos>({ defaultValues: inicial });
  const partes = useFieldArray({ control: formulario.control, name: 'lineas' });
  return (
    <Edicion
      formulario={formulario}
      partes={partes}
      cuentas={[
        { id: CUENTA, nombre: 'Visa Oro', tipo: 'tarjeta', detalle: g.deudaDeCuenta('$642.18') },
      ]}
      categorias={[{ id: CATEGORIA, nombre: 'Supermercado' }]}
      deudores={[]}
      deLasPartes={undefined}
      ayuda={g.todoRepartido}
      sinCuenta={false}
      soloEtiquetas={false}
      {...extra}
    />
  );
}

function montar(extra: Partial<PropsEdicion> = {}): HTMLElement {
  document.body.style.cssText = 'background: var(--fondo); color: var(--texto)';
  const nodo = document.createElement('main');
  nodo.style.width = '390px';
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(<Arnes extra={extra} />);
  });
  montados.push({ raiz, nodo });
  return nodo;
}

describe('PRU-CMP-TX edición de una transacción', () => {
  it('PRU-CMP-TX-471 [CA-25.1] la cuenta es una selección de 52 px con su deuda, Fecha y Total van en la misma fila y las partes son filas con selección, monto y ×', () => {
    const nodo = montar();
    const cuenta = nodo.querySelector<HTMLSelectElement>(`select[id]`);
    expect(cuenta?.parentElement?.textContent).toContain('Deuda $642.18');
    expect(cuenta?.parentElement?.getBoundingClientRect().height).toBe(52);
    expect(nodo.querySelectorAll('input[type="radio"]')).toHaveLength(0);
    const fecha = nodo.querySelector('input[name="fecha"]')?.getBoundingClientRect();
    const total = nodo.querySelector('input[name="total"]')?.getBoundingClientRect();
    expect(Math.abs((fecha?.top ?? 0) - (total?.top ?? 99))).toBeLessThan(2);
    expect(nodo.querySelectorAll('[data-parte]')).toHaveLength(2);
    expect(nodo.querySelector('[data-testid="suma-lineas"]')?.textContent).toContain('$30.00');
    for (const quitar of nodo.querySelectorAll('button[aria-label^="Quitar"]'))
      expect(quitar.getBoundingClientRect().width).toBeGreaterThanOrEqual(44);
  });

  it('PRU-CMP-TX-472 [CA-25.5, CB-24] con la cuenta fija se dibuja en solo lectura con su motivo y, archivada, Fecha y Total no se editan', () => {
    const conMotivo = montar({ motivoCuenta: 'Tiene una devolución vinculada.' });
    const fija = conMotivo.querySelector('[data-cuenta-fija]');
    expect(fija?.textContent).toContain(t.soloLectura);
    expect(fija?.textContent).toContain('Visa Oro');
    expect(fija?.textContent).toContain('Tiene una devolución vinculada.');
    expect(conMotivo.querySelectorAll('select')).toHaveLength(2);

    const archivada = montar({ soloEtiquetas: true, motivoCuenta: 'Archivada.' });
    expect(archivada.querySelector('[data-cuenta-fija]')?.textContent).not.toContain('Archivada.');
    expect(archivada.querySelector<HTMLInputElement>('input[name="fecha"]')?.disabled).toBe(true);
    expect(archivada.querySelector<HTMLInputElement>('input[name="total"]')?.disabled).toBe(true);
    const sinCuenta = montar({ sinCuenta: true });
    expect(sinCuenta.querySelectorAll('select')).toHaveLength(2);
    expect(sinCuenta.querySelector('[data-cuenta-fija]')).toBeNull();
  });
});
