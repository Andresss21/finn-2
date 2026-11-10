// `/bandeja/[movimientoId]` portado del export (S4; CH-136; 07 §17: un componente con sus textos, sus medidas y su teclado es una CMP).
// Los campos y el encabezado se montan con datos del servidor ya formateados: la interfaz
// muestra y el servidor valida (PF-3).
import axe from 'axe-core';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { useFieldArray, useForm } from 'react-hook-form';
import { afterEach, describe, expect, it } from 'vitest';
import '../../app/globals.css';
import type { Centavos, FechaLocal } from '@finn/dominio/valores';
import { bandeja as t } from '../../textos/bandeja';
import { cuentas as c } from '../../textos/cuentas';
import { registrarGasto as g } from '../../textos/registrar-gasto';
import { parteVacia } from '../registrar-gasto/campos';
import type { Campos } from './campos';
import CamposMovimiento from './campos-movimiento';
import type { BuscarCompras } from './eleccion-compra';
import Encabezado, { type ResumenDelMovimiento } from './encabezado';

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

const VISA = '11111111-1111-4111-8111-111111111111';
const SUPER = '22222222-2222-4222-8222-222222222222';

const campos = (tipo: string, partes: number): Campos => ({
  cuentaId: VISA,
  fecha: '2027-02-20',
  total: '35.00',
  comercio: 'SUPER SELECTOS ESCALON',
  nota: '',
  tipo,
  lineas: Array.from({ length: partes }, () => ({
    ...parteVacia(),
    monto: '35.00',
    categoriaId: SUPER,
  })),
});

const AHORRO = '33333333-3333-4333-8333-333333333333';
const COMPRA = '44444444-4444-4444-8444-444444444444';
const LINEA_COMPRA = '55555555-5555-4555-8555-555555555555';
// El `hoy` de negocio del servidor (A12): otro que el del dispositivo, para que el atajo no pueda salir del reloj
const HOY = '2027-02-20' as FechaLocal;

/** La búsqueda de compras de CP-3 sin servidor: la compra con una línea de 35.00 que queda entera. */
const buscarCompras: BuscarCompras = (e) =>
  Promise.resolve({
    ok: true,
    yaAplicada: false,
    avisos: [],
    valor: {
      contexto:
        e.transaccionOriginalId === undefined
          ? { candidatas: [] }
          : {
              lineas: [
                {
                  lineaId: LINEA_COMPRA,
                  destino: { nombre: 'Supermercado', tipo: 'categoria' },
                  capacidad: 3500,
                },
              ],
            },
    },
  });

function Arnes({ inicial }: { readonly inicial: Campos }) {
  const formulario = useForm<Campos>({ defaultValues: inicial });
  const partes = useFieldArray({ control: formulario.control, name: 'lineas' });
  return (
    <CamposMovimiento
      formulario={formulario}
      partes={partes}
      cuentas={[
        { id: VISA, nombre: 'Visa Oro', tipo: 'tarjeta', detalle: g.deudaDeCuenta('$642.18') },
        { id: AHORRO, nombre: 'Ahorro', tipo: 'efectivo', detalle: g.saldoDeCuenta('$900.00') },
      ]}
      categorias={[{ id: SUPER, nombre: 'Supermercado' }]}
      deudores={[]}
      deLasPartes={undefined}
      ayuda={undefined}
      hoy={HOY}
      candidatas={[
        { id: COMPRA, titulo: 'SUPER SELECTOS', detalle: 'jue 18 feb · Visa Oro · Queda $35.00' },
      ]}
      buscarCompras={buscarCompras}
    />
  );
}

function montarElemento(elemento: React.ReactNode): HTMLElement {
  document.body.style.cssText =
    'background: var(--fondo); color: var(--texto); font-family: var(--fuente-cuerpo)';
  const nodo = document.createElement('main');
  nodo.style.width = '350px';
  nodo.className = 'flex flex-col gap-5';
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(elemento);
  });
  montados.push({ raiz, nodo });
  return nodo;
}

const resumen = (extra: Partial<ResumenDelMovimiento> = {}): ResumenDelMovimiento => ({
  vista: 'listo',
  comercio: 'SUPER SELECTOS ESCALON',
  monto: 3500 as Centavos,
  sale: true,
  cuenta: 'Visa Oro',
  fecha: '2027-02-20',
  sugerida: { nombre: 'Supermercado', porRegla: true },
  ...extra,
});

describe('PRU-CMP-BAND', () => {
  it('PRU-CMP-BAND-210 [FT-35] la cuenta es una selección nativa de 52 px con la deuda de la tarjeta, Fecha y Monto van en dos columnas con «$» y no hay radios para la cuenta ni líneas «Se entiende como»', () => {
    const nodo = montarElemento(<Arnes inicial={campos('gasto', 1)} />);
    const cuenta = nodo.querySelector<HTMLSelectElement>('select');
    expect(cuenta?.labels[0]?.textContent).toContain(g.cuenta);
    const caja = cuenta?.parentElement;
    expect(caja?.getBoundingClientRect().height).toBe(52);
    expect(caja?.textContent).toContain('Deuda $642.18');
    const fecha = nodo.querySelector<HTMLElement>('input[name=fecha]');
    const monto = nodo.querySelector<HTMLElement>('input[name=total]');
    const f = fecha?.getBoundingClientRect();
    const m = monto?.getBoundingClientRect();
    expect(Math.abs((f?.top ?? 0) - (m?.top ?? 99))).toBeLessThan(2);
    expect((m?.left ?? 0) > (f?.left ?? 99)).toBe(true);
    expect(monto?.parentElement?.textContent).toContain('$');
    expect(nodo.textContent).not.toContain('Se entiende como');
    expect(nodo.textContent).not.toContain('Fecha elegida');
    expect(nodo.querySelectorAll('[role=radiogroup]')).toHaveLength(1);
  });

  it('PRU-CMP-BAND-211 [FT-35] el tipo es un selector segmentado de cuatro opciones iguales de al menos 44 px, con la del movimiento marcada, y cambiarlo con las flechas mueve la marca', () => {
    const nodo = montarElemento(<Arnes inicial={campos('gasto', 1)} />);
    const grupo = nodo.querySelector('[role=radiogroup]');
    expect(grupo?.getAttribute('aria-label')).toBe(t.revisar.tipo);
    const opciones = [...nodo.querySelectorAll<HTMLElement>('[role=radio]')];
    expect(opciones.map((o) => o.textContent)).toEqual(Object.values(t.revisar.tipos));
    expect(opciones.every((o) => o.getBoundingClientRect().height >= 44)).toBe(true);
    expect(opciones.map((o) => Math.round(o.getBoundingClientRect().width))).toSatisfy(
      (ws: number[]) => Math.max(...ws) - Math.min(...ws) <= 1,
    );
    expect(opciones[0]?.getAttribute('aria-checked')).toBe('true');
    act(() => {
      opciones[0]?.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
      );
    });
    expect(opciones[1]?.getAttribute('aria-checked')).toBe('true');
  });

  it('PRU-CMP-BAND-212 [FT-35] un tipo que el servidor no propuso no deja ninguna opción marcada y un ingreso no ofrece líneas', () => {
    const sin = montarElemento(<Arnes inicial={campos('', 0)} />);
    expect(sin.querySelectorAll('[role=radio][aria-checked=true]')).toHaveLength(0);
    expect(sin.querySelector('[data-campo-lineas]')).toBeNull();
    const ingreso = montarElemento(<Arnes inicial={campos('ingreso', 0)} />);
    expect(ingreso.querySelector('[data-campo-lineas]')).toBeNull();
  });

  it('PRU-CMP-BAND-213 [CA-35.4] un gasto dividido muestra una fila compacta por línea con selección, monto de 120 px y ×, y «+ Agregar línea»', () => {
    const nodo = montarElemento(<Arnes inicial={campos('gasto', 2)} />);
    const lineas = nodo.querySelector('[data-campo-lineas]');
    expect(lineas?.textContent).toContain(g.dividir);
    expect(lineas?.textContent).toContain(g.agregarLinea);
    expect(lineas?.querySelectorAll('[data-parte]')).toHaveLength(2);
    const destino = lineas?.querySelector<HTMLElement>(
      `select[aria-label="${g.categoriaDeParte('2')}"], select`,
    );
    expect(destino).not.toBeNull();
    const monto = [...(lineas?.querySelectorAll<HTMLInputElement>('input') ?? [])].find(
      (i) => i.labels?.[0]?.textContent === g.montoDeParte('2'),
    );
    expect(Math.round(monto?.closest('div')?.getBoundingClientRect().width ?? 0)).toBe(120);
    expect(lineas?.querySelector(`[aria-label="${g.quitarParte('2')}"]`)).not.toBeNull();
    expect(lineas?.querySelectorAll('[role=radiogroup]')).toHaveLength(0);
  });

  it('PRU-CMP-BAND-214 [FT-35] el encabezado dice el estado, el comercio, el monto con signo de salida y la categoría sugerida con su origen', () => {
    const nodo = montarElemento(<Encabezado resumen={resumen()} />);
    expect(nodo.textContent).toContain(c.bandeja.estados.listo);
    expect(nodo.textContent).toContain('SUPER SELECTOS ESCALON');
    expect(nodo.querySelector('[data-centavos]')?.textContent).toContain('−$35.00');
    expect(nodo.textContent).toContain('Visa Oro · 20/02/2027');
    expect(nodo.textContent).toContain(t.revisar.categoriaSugerida('Supermercado', true));
    expect(nodo.textContent).toContain('(por regla)');
  });

  it('PRU-CMP-BAND-215 [CA-35.11] la categoría del historial no dice «por regla»; sin sugerencia ni monto no hay línea de categoría ni cifra, y un ingreso va sin signo', () => {
    const historial = montarElemento(
      <Encabezado resumen={resumen({ sugerida: { nombre: 'Supermercado', porRegla: false } })} />,
    );
    expect(historial.textContent).toContain('(de tu historial)');
    expect(historial.textContent).not.toContain('por regla');
    const nada = montarElemento(
      <Encabezado
        resumen={resumen({
          vista: 'falta',
          sugerida: null,
          monto: null,
          comercio: null,
          cuenta: null,
          fecha: null,
        })}
      />,
    );
    expect(nada.textContent).toContain(c.bandeja.estados.falta);
    expect(nada.textContent).toContain(c.bandeja.sinComercio);
    expect(nada.querySelector('[data-centavos]')).toBeNull();
    const ingreso = montarElemento(<Encabezado resumen={resumen({ sale: false })} />);
    expect(ingreso.querySelector('[data-centavos]')?.textContent).not.toContain('−');
  });

  it('PRU-CMP-BAND-320 [] (CH-226) el selector Tipo muestra el origen preseleccionado en Pago y «Elegí la compra» en Devolución; «Hoy» y «Ayer» ponen las fechas del servidor', async () => {
    // Pago: el origen propuesto (BE-41) a la vista y elegible entre las cuentas de efectivo
    const pago = montarElemento(
      <Arnes inicial={{ ...campos('pago_tarjeta', 0), origenId: AHORRO }} />,
    );
    const origen = [...pago.querySelectorAll<HTMLSelectElement>('select')].find(
      (s) => s.labels[0]?.textContent.includes(t.revisar.origen) === true,
    );
    expect(origen?.value).toBe(AHORRO);
    expect([...(origen?.options ?? [])].map((o) => o.value)).not.toContain(VISA);
    expect(pago.textContent).not.toContain(t.revisar.elegirCompra);

    // Devolución: «Elegí la compra» con las candidatas; al elegir, su línea con lo que queda y el monto copiado
    const devolucion = montarElemento(<Arnes inicial={campos('devolucion', 1)} />);
    await act(async () => {
      await import('./eleccion-compra'); // la parte diferida termina de cargar dentro de act
    });
    await expect.poll(() => devolucion.textContent).toContain(t.revisar.elegirCompra);
    expect(devolucion.textContent).not.toContain(t.revisar.origen);
    const candidata = [...devolucion.querySelectorAll<HTMLButtonElement>('li button')].find((b) =>
      b.textContent.includes('SUPER SELECTOS'),
    );
    await act(async () => {
      candidata?.click();
      await Promise.resolve();
    });
    await expect
      .poll(
        () => devolucion.querySelector<HTMLInputElement>('input[name="devueltas.0.monto"]')?.value,
      )
      .toBe('35.00');
    expect(devolucion.textContent).toContain(t.revisar.queda('$35.00'));
    expect(devolucion.textContent).toContain(t.revisar.cambiarCompra);
    expect(devolucion.querySelector('[data-campo-lineas]')).toBeNull();

    // «Hoy» y «Ayer»: botones de al menos 44 px que ponen las fechas del servidor
    const fecha = montarElemento(
      <Arnes inicial={{ ...campos('gasto', 1), fecha: '2027-02-10' }} />,
    );
    const atajo = (texto: string) =>
      [...fecha.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent === texto);
    const input = () => fecha.querySelector<HTMLInputElement>('input[name=fecha]')?.value;
    expect(atajo(t.revisar.hoy)?.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    act(() => {
      atajo(t.revisar.ayer)?.click();
    });
    expect(input()).toBe('19/02/2027');
    expect(atajo(t.revisar.ayer)?.getAttribute('aria-pressed')).toBe('true');
    act(() => {
      atajo(t.revisar.hoy)?.click();
    });
    expect(input()).toBe('20/02/2027');
    // El botón del calendario sigue dentro del campo, con su área de 44
    const calendario = fecha.querySelector<HTMLElement>('button[aria-haspopup=dialog]');
    expect(calendario?.getBoundingClientRect().height).toBe(44);
  });

  it('PRU-CMP-BAND-216 [FT-35] los campos y el encabezado no tienen violaciones de axe en claro ni en oscuro', async () => {
    for (const tema of ['light', 'dark']) {
      document.documentElement.dataset['theme'] = tema;
      const nodo = montarElemento(
        <>
          <Encabezado resumen={resumen()} />
          <Arnes inicial={campos('gasto', 2)} />
        </>,
      );
      const { violations } = await axe.run(nodo, {
        runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
      });
      expect(
        violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
      ).toEqual([]);
    }
  });
});
