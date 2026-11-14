// FT-25, campos de la edición (07 §17: un texto o un estado de una pantalla es una CMP). [C-45, C-49 §5] Campos v3: el total es el
// billete; Cuenta, Fecha y Comercio van en un grupo de filas (la cuenta fija, en «Solo lectura»); un gasto usa las secciones de
// Registrar gasto. La interfaz muestra, el servidor valida (PF-3).
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { useForm } from 'react-hook-form';
import { afterEach, describe, expect, it } from 'vitest';
import '../../app/globals.css';
import { registrarGasto as g } from '../../textos/registrar-gasto';
import { transaccion as t } from '../../textos/transaccion';
import type { Campos } from '../bandeja-movimiento/campos';
import { parteVacia } from '../registrar-gasto/campos';
import { estadoDelGasto } from '../registrar-gasto/estado';
import { conSecciones, type CamposDeEdicion } from './campos';
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
const OTRA = '33333333-3333-4333-8333-333333333333';
const inicial: Campos = {
  cuentaId: CUENTA,
  fecha: '2027-02-20',
  total: '30.00',
  comercio: 'Super',
  nota: 'Con Carlos',
  tipo: 'gasto',
  lineas: [
    { ...parteVacia(), monto: '20.00', categoriaId: CATEGORIA },
    { ...parteVacia(), monto: '10.00', categoriaId: OTRA },
  ],
};
const SIN_MARCAS = { personas: false, categorias: false, enviado: false };

function Arnes({ extra }: { readonly extra: Partial<PropsEdicion> }) {
  const formulario = useForm<CamposDeEdicion>({ defaultValues: conSecciones(inicial) });
  const c = formulario.watch();
  return (
    <Edicion
      formulario={formulario}
      cuentas={[
        { id: CUENTA, nombre: 'Visa Oro', tipo: 'tarjeta', detalle: g.deudaDeCuenta('$642.18') },
      ]}
      categorias={[
        {
          id: CATEGORIA,
          nombre: 'Supermercado',
          grupo: 'Casa',
          disponible: '$1.00',
          negativo: false,
        },
        { id: OTRA, nombre: 'Farmacia', grupo: 'Casa', disponible: '$2.00', negativo: false },
      ]}
      deudores={[]}
      e={estadoDelGasto(c, SIN_MARCAS)}
      deLasPartes={undefined}
      sinCuenta={false}
      soloEtiquetas={false}
      alSalir={() => () => undefined}
      anunciar={() => undefined}
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
  it('PRU-CMP-TX-471 [CA-25.1, C-45] el total es el billete; Cuenta (con su deuda), Fecha y Comercio van en un grupo de filas; un gasto con dos categorías abre «Varias» con una fila por categoría y su monto', () => {
    const nodo = montar();
    expect(nodo.querySelector<HTMLInputElement>('.campo-billete input[name="total"]')?.value).toBe(
      '30.00',
    );
    const [datos] = nodo.querySelectorAll('.grupo-campos');
    expect(datos?.textContent).toContain('Visa Oro');
    expect(datos?.querySelector('input[name="fecha"]')).not.toBeNull();
    expect(datos?.querySelector('input[name="comercio"]')).not.toBeNull();
    expect(nodo.querySelectorAll('select')).toHaveLength(0);
    expect(
      nodo.querySelector<HTMLInputElement>(`[aria-label="${g.montoPara('Supermercado')}"]`)?.value,
    ).toBe('20.00');
    expect(
      nodo.querySelector<HTMLInputElement>(`[aria-label="${g.montoPara('Farmacia')}"]`)?.value,
    ).toBe('10.00');
    expect(nodo.textContent).toContain(g.repartido('$30.00', '$30.00'));
  });

  it('PRU-CMP-TX-472 [CA-25.5, CB-24, C-45] con la cuenta fija se dibuja en «Solo lectura» con su motivo y, archivada, Fecha y Total no se editan', () => {
    const conMotivo = montar({ motivoCuenta: 'Tiene una devolución vinculada.' });
    const fija = conMotivo.querySelector('[data-dato-fijo="cuenta"]');
    expect(fija?.textContent).toContain(t.soloLectura);
    expect(fija?.textContent).toContain('Visa Oro');
    expect(fija?.textContent).toContain('Tiene una devolución vinculada.');

    const archivada = montar({ soloEtiquetas: true, motivoCuenta: 'Archivada.' });
    expect(archivada.querySelector('[data-dato-fijo="cuenta"]')?.textContent).not.toContain(
      'Archivada.',
    );
    expect(archivada.querySelector<HTMLInputElement>('input[name="fecha"]')?.disabled).toBe(true);
    expect(archivada.querySelector<HTMLInputElement>('input[name="total"]')?.disabled).toBe(true);
    const sinCuenta = montar({ sinCuenta: true });
    expect(sinCuenta.querySelector('[data-dato-fijo="cuenta"]')).toBeNull();
    expect(sinCuenta.textContent).not.toContain('Visa Oro');
  });
});
