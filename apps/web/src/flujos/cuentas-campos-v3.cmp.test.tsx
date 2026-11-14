// [C-45] Las pantallas de Cuentas con la familia v3 (CAMPOS-V3 §2 a §6, §8 y §11): Editar cuenta, Condiciones del préstamo,
// Cuota, Pagar tarjeta, Verificar saldo, Conciliar y Archivar. Cada bloque de datos es un `GrupoCampos`; los montos van en fila con
// «$», los porcentajes con «%», los enteros sin letras, las selecciones en segmentado o en la lista propia y las casillas como
// filas. Guardar se ve apagado con `aria-disabled` y dice debajo qué falta. Los CA-K3-n de PROMPT-CAMPOS.md §5 van en el título.
import axe from 'axe-core';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import type { Centavos, FechaLocal } from '@finn/dominio/valores';
import '../app/globals.css';
import { pagarCuotaPrestamo, pagarTarjeta } from '../servidor/acciones/transacciones';
import { editarCondicionesPrestamo } from '../servidor/acciones/cuentas';
import { base } from '../textos/base';
import { conciliar as tc } from '../textos/conciliar';
import { cuentasCondiciones as tco } from '../textos/cuentas-condiciones';
import { cuentasCuota as tcu } from '../textos/cuentas-cuota';
import { cuentasGestion } from '../textos/cuentas-gestion';
import { cuentasNuevaTipos as tarjeta } from '../textos/cuentas-nueva-tipos';
import { cuentasPagar as tp } from '../textos/cuentas-pagar';
import { verificarSaldo as tv } from '../textos/verificar-saldo';
import { FormularioCuentasArchivar } from './cuentas-archivar/formulario';
import { camposDe } from './cuentas-condiciones/campos';
import { FormularioCuentasCondiciones } from './cuentas-condiciones/formulario';
import { FormularioConciliar } from './cuentas-conciliar/formulario';
import { FormularioCuentasCuota } from './cuentas-cuota/formulario';
import { FormularioCuentasEditar } from './cuentas-editar/formulario';
import { FormularioCuentasPagar } from './cuentas-pagar/formulario';
import { FormularioVerificarSaldo } from './cuentas-verificar-saldo/formulario';

// `next/link` y `next/navigation` necesitan el enrutador de Next, y las acciones son del servidor: se simulan.
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ replace: vi.fn(), back: vi.fn(), push: vi.fn() }),
}));
vi.mock('next/link', async () => {
  const { createElement } = await import('react');
  const Enlace = ({ href, children, ...resto }: { href: string; children?: ReactNode }) =>
    createElement('a', { href, ...resto }, children);
  return Object.assign(Enlace, { default: Enlace, useLinkStatus: () => ({ pending: false }) });
});
vi.mock('../servidor/acciones/cuentas', () => ({ editarCondicionesPrestamo: vi.fn() }));
vi.mock('../servidor/acciones/transacciones', () => ({
  pagarCuotaPrestamo: vi.fn(),
  pagarTarjeta: vi.fn(),
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const montados: { raiz: Root; nodo: HTMLElement }[] = [];
afterEach(() => {
  for (const { raiz, nodo } of montados.splice(0)) {
    act(() => {
      raiz.unmount();
    });
    nodo.remove();
  }
  sessionStorage.clear();
  delete document.documentElement.dataset['theme'];
  vi.mocked(pagarCuotaPrestamo).mockClear();
  vi.mocked(pagarTarjeta).mockClear();
  vi.mocked(editarCondicionesPrestamo).mockClear();
});

async function montar(ui: ReactNode): Promise<HTMLElement> {
  const nodo = document.createElement('div');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  await act(() => {
    raiz.render(ui);
    return Promise.resolve();
  });
  montados.push({ raiz, nodo });
  return nodo;
}

const HOY = '2027-02-05' as FechaLocal;
const ok = (valor: unknown) =>
  Promise.resolve({ ok: true as const, valor, yaAplicada: false, avisos: [] });

/** El control de un rótulo (input o disparador), buscado por el texto con que empieza su `<label>`. */
const control = (nodo: HTMLElement, etiqueta: string): HTMLElement | undefined =>
  [...nodo.querySelectorAll('label')]
    .filter((l) => l.textContent.trim().startsWith(etiqueta))
    .map((l) => l.control)
    .find((c): c is HTMLElement => c instanceof HTMLElement);
const de = (nodo: HTMLElement, etiqueta: string): HTMLInputElement =>
  control(nodo, etiqueta) as HTMLInputElement;
const filaDe = (el: Element): HTMLElement => el.closest<HTMLElement>('.campo-fila') as HTMLElement;
const enGrupo = (el: Element): boolean => el.closest('.grupo-campos') !== null;
const afijo = (el: Element) => filaDe(el).querySelector('.campo-afijo')?.textContent;
const sufijo = (el: Element) => filaDe(el).querySelector('.campo-afijo:last-of-type')?.textContent;
const segmentado = (nodo: HTMLElement, etiqueta: string) =>
  nodo.querySelector<HTMLElement>(`[role=radiogroup][aria-label="${etiqueta}"]`);
const boton = (nodo: HTMLElement, texto: string): HTMLButtonElement =>
  [...nodo.querySelectorAll('button')].find((b) =>
    b.textContent.trim().startsWith(texto),
  ) as HTMLButtonElement;
const descrito = (el: Element): string =>
  (el.getAttribute('aria-describedby') ?? '')
    .split(' ')
    .map((id) => document.getElementById(id)?.textContent ?? '')
    .join(' ');

const TARJETA = {
  nombre: 'Visa Oro',
  institucionId: null,
  ultimos4: null,
  fechaApertura: '2027-01-01',
  limiteCredito: '2500.00',
  tasaAnual: '24',
  diaCorte: 15,
  diaPago: 5,
};
const editar = (accion = vi.fn(ok), esperado: Record<string, string | number | null> = TARJETA) => (
  <FormularioCuentasEditar
    accion={accion}
    cuentaId="k1"
    hoy={HOY}
    instituciones={[]}
    esperado={esperado}
  />
);

const PRESTAMO = camposDe({
  contraparte: 'Banco',
  montoOriginal: 1000000,
  tasaNominalAnualMillonesimas: 127525,
  tipoTasa: 'fija',
  seguroPrimerMes: null,
  comision: null,
  frecuencia: 'mensual',
  frecuenciaDias: null,
  cuotaPactada: 35000,
  plazoCuotas: 36,
  modeloCalculo: null,
});

const ORIGENES = [
  { id: 'o1', nombre: 'Cuenta BAC', tarjeta: false },
  { id: 'o2', nombre: 'Ahorro', tarjeta: false },
];
const cuota = () => (
  <FormularioCuentasCuota
    modalidad="cuota"
    prestamoId="p1"
    prestamoNombre="Préstamo carro"
    hoy={HOY}
    fecha={HOY}
    origenes={ORIGENES}
    categorias={[
      { id: 'c1', nombre: 'Carro', grupo: 'Deudas', disponible: 35000 as Centavos },
      { id: 'c2', nombre: 'Casa', grupo: 'Deudas', disponible: 0 as Centavos },
      { id: 'c3', nombre: 'Súper', grupo: 'Comida', disponible: -500 as Centavos },
      { id: 'c4', nombre: 'Luz', grupo: 'Casa', disponible: 100 as Centavos },
    ]}
    capitalPendiente={500000 as Centavos}
    cuotaPactada="350.00"
    tieneModelo={false}
    propuesta={undefined}
    categoriaPropuesta="c1"
  />
);
const pagar = (origenPropuesto?: string) => (
  <FormularioCuentasPagar
    tarjetaId="t1"
    tarjetaNombre="Visa Oro"
    hoy={HOY}
    deuda="$642.18"
    origenes={[
      { id: 'o1', nombre: 'Cuenta BAC', detalle: 'Saldo $900.00' },
      { id: 'o2', nombre: 'Ahorro', detalle: 'Saldo $50.00' },
    ]}
    origenPropuesto={origenPropuesto}
    filas={[]}
    atajos={[]}
    montoInicial="642.18"
    categoriaPagoId={undefined}
  />
);
const verificar = (accion = vi.fn(ok)) => (
  <FormularioVerificarSaldo
    accion={accion}
    cuentaId="t1"
    cuenta="Visa Oro"
    tarjeta
    hoy={HOY}
    fecha={HOY}
    cantidad={2}
    candidatas={[
      { id: 'x1', comercio: 'Súper', fecha: '2027-02-01', monto: -1250 as Centavos },
      { id: 'x2', comercio: null, fecha: '2027-02-03', monto: -500 as Centavos },
    ]}
  />
);

/** Un botón apagado (`aria-disabled`) se toca con el teclado: el puntero de Playwright espera a que se habilite. */
async function tocar(b: HTMLElement): Promise<void> {
  b.focus();
  await userEvent.keyboard('{Enter}');
}

async function escribir(el: HTMLElement, texto: string): Promise<void> {
  await userEvent.clear(el);
  await userEvent.type(el, texto);
}

describe('PRU-CMP-CTA pantallas de Cuentas con los campos v3', () => {
  it('PRU-CMP-CTA-860 [C-45, FT-53] CA-K3-3: Editar una tarjeta va en grupos de filas: el límite con «$» y comas, la tasa con «%», los días sin letras y «Últimos 4» con «Opcional» en el rótulo, sin marcador', async () => {
    const accion = vi.fn(ok);
    const nodo = await montar(editar(accion));
    for (const e of [
      cuentasGestion.comunes.nombre,
      cuentasGestion.comunes.ultimos4,
      cuentasGestion.comunes.apertura,
      tarjeta.limiteCredito,
      tarjeta.tasaAnual,
      tarjeta.diaCorte,
      tarjeta.diaPago,
    ])
      expect(enGrupo(de(nodo, e))).toBe(true);
    const limite = de(nodo, tarjeta.limiteCredito);
    expect(afijo(limite)).toBe(base.moneda);
    expect(limite.value).toBe('2,500.00');
    await escribir(limite, '3000.456');
    expect(limite.value).toBe('3,000.45');
    const tasa = de(nodo, tarjeta.tasaAnual);
    expect(sufijo(tasa)).toBe(base.porcentaje);
    expect(tasa.value).toBe('24');
    const corte = de(nodo, tarjeta.diaCorte);
    await escribir(corte, '2x0');
    expect(corte.value).toBe('20');
    const ultimos4 = de(nodo, cuentasGestion.comunes.ultimos4);
    expect(ultimos4.getAttribute('placeholder')).toBeNull();
    expect(filaDe(ultimos4).querySelector('label')?.textContent).toContain(base.opcional);

    await userEvent.click(boton(nodo, cuentasGestion.editar.guardar));
    const entrada = accion.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(entrada).toMatchObject({ cuentaId: 'k1', diaCorte: 20, limiteCredito: '3000.45' });
    expect(entrada).not.toHaveProperty('tasaAnual');
  });

  it('PRU-CMP-CTA-861 [C-45, FT-53] CA-K3-13: sin nombre, «Guardar cambios» se ve apagado con aria-disabled y el motivo debajo; al tocarlo no envía, marca el error y lleva el foco al nombre', async () => {
    const accion = vi.fn(ok);
    const nodo = await montar(editar(accion));
    const nombre = de(nodo, cuentasGestion.comunes.nombre);
    await userEvent.clear(nombre);
    const guardar = () => boton(nodo, cuentasGestion.editar.guardar);
    await expect.poll(() => guardar().getAttribute('aria-disabled')).toBe('true');
    expect(guardar().disabled).toBe(false);
    expect(descrito(guardar())).toBe(base.corregirCampos(1));
    await tocar(guardar());
    await expect.poll(() => filaDe(nombre).dataset['error']).toBe('');
    await expect.poll(() => document.activeElement).toBe(nombre);
    expect(accion).not.toHaveBeenCalled();
  });

  it('PRU-CMP-CTA-862 [C-45, FT-55] CA-K3-6: Condiciones del préstamo es un grupo: la tasa guardada con cuatro decimales se ve completa con «%», tipo de tasa y modelo en segmentado, la frecuencia en la lista propia, el plazo sin letras y los montos con «$»', async () => {
    const nodo = await montar(<FormularioCuentasCondiciones prestamoId="p1" visto={PRESTAMO} />);
    const n = tco.comunes;
    const tasa = de(nodo, n.tasaAnual);
    expect(enGrupo(tasa)).toBe(true);
    expect(tasa.value).toBe('12.7525');
    expect(sufijo(tasa)).toBe(base.porcentaje);
    for (const e of [n.tipoTasa, n.modelo]) {
      const grupo = segmentado(nodo, e) as HTMLElement;
      expect(grupo.dataset['v3']).toBe('');
      expect(enGrupo(grupo)).toBe(true);
    }
    expect(de(nodo, n.frecuencia).getAttribute('aria-haspopup')).toBe('listbox');
    expect(nodo.querySelector('select')).toBeNull();
    const plazo = de(nodo, n.plazoCuotas);
    await escribir(plazo, '4a8');
    expect(plazo.value).toBe('48');
    expect(afijo(de(nodo, n.montoOriginal))).toBe(base.moneda);
    expect(de(nodo, n.montoOriginal).value).toBe('10,000.00');
    expect(afijo(de(nodo, tco.seguroPrimerMes))).toBe(base.moneda);
  });

  it('PRU-CMP-CTA-863 [C-45, FT-54] CA-K3-6 y CA-K3-13: la cuota lleva «Pagar con» en segmentado, la categoría en la lista con su disponible y los montos con «$»; sin cuenta ni desglose, «Guardar pago» dice cuántos campos corregir y al tocarlo no envía', async () => {
    const nodo = await montar(cuota());
    const origen = segmentado(nodo, tcu.origen) as HTMLElement;
    expect(origen.dataset['v3']).toBe('');
    expect(enGrupo(origen)).toBe(true);
    expect(de(nodo, tcu.categoria).getAttribute('aria-haspopup')).toBe('listbox');
    for (const e of [tcu.total, tcu.capital, tcu.interes, tcu.seguro]) {
      expect(enGrupo(de(nodo, e))).toBe(true);
      expect(afijo(de(nodo, e))).toBe(base.moneda);
    }
    expect(de(nodo, tcu.total).value).toBe('350.00');
    const guardar = () => boton(nodo, tcu.guardarCuota);
    expect(guardar().getAttribute('aria-disabled')).toBe('true');
    expect(descrito(guardar())).toBe(base.corregirCampos(4));
    await tocar(guardar());
    await expect.poll(() => filaDe(origen).dataset['error']).toBe('');
    expect(filaDe(origen).textContent).toContain(tcu.elegirOrigen);
    await expect.poll(() => document.activeElement?.closest('[role=radiogroup]')).toBe(origen);
    expect(pagarCuotaPrestamo).not.toHaveBeenCalled();
  });

  it('PRU-CMP-CTA-864 [C-45, FT-30] CA-K3-4 y CA-K3-13: Pagar tarjeta lleva «Desde» en segmentado y el monto y la fecha en filas; sin cuenta elegida «Pagar» se ve apagado con el motivo, y la fecha pone las barras y marca la que no existe', async () => {
    const nodo = await montar(pagar());
    const desde = segmentado(nodo, tp.desde) as HTMLElement;
    expect(enGrupo(desde)).toBe(true);
    const monto = de(nodo, tp.monto);
    expect(enGrupo(monto)).toBe(true);
    expect(afijo(monto)).toBe(base.moneda);
    expect(monto.value).toBe('642.18');
    const pagarBoton = () => boton(nodo, tp.pagar);
    expect(pagarBoton().getAttribute('aria-disabled')).toBe('true');
    expect(descrito(pagarBoton())).toBe(base.corregirCampos(1));
    const fecha = de(nodo, tp.fecha);
    await escribir(fecha, '31022027');
    expect(fecha.value).toBe('31/02/2027');
    expect(filaDe(fecha).textContent).toContain(base.fechaNoExiste);
    await tocar(pagarBoton());
    expect(pagarTarjeta).not.toHaveBeenCalled();
    await expect.poll(() => filaDe(desde).dataset['error']).toBe('');

    const listo = await montar(pagar('o1'));
    expect(boton(listo, tp.pagar).getAttribute('aria-disabled')).toBeNull();
  });

  it('PRU-CMP-CTA-865 [C-45, FT-44] CA-K3-8: Verificar el saldo de una tarjeta pone la fecha y la deuda con «Debo · Tengo a favor» en un grupo; al marcar, cada transacción es una casilla en fila que cambia al tocar su texto', async () => {
    const accion = vi.fn(() =>
      ok({
        revisionVista: 'r1',
        huellaImpacto: 'h1',
        impacto: null,
        avisos: [],
        rechazos: [],
        propuesta: { saldoFinn: -17000, diferencia: -500, marcaria: 2, deudaFinn: 17000 },
      }),
    );
    const nodo = await montar(verificar(accion));
    const signo = segmentado(nodo, base.signoDelMonto) as HTMLElement;
    expect(enGrupo(signo)).toBe(true);
    const deuda = de(nodo, tv.deudaBanco);
    expect(enGrupo(deuda)).toBe(true);
    expect(enGrupo(de(nodo, tv.fecha))).toBe(true);
    const ver = () => boton(nodo, tv.verDiferencia);
    expect(ver().getAttribute('aria-disabled')).toBe('true');
    expect(descrito(ver())).toBe(base.corregirCampos(1));
    await userEvent.type(deuda, '175');
    // La diferencia en vivo llega primero (CTA-07); después se pide el paso de marcar.
    await expect.poll(() => nodo.querySelector('[data-diferencia-vivo]')).not.toBeNull();
    expect(ver().getAttribute('aria-disabled')).toBeNull();
    await userEvent.click(ver());
    await expect.poll(() => nodo.querySelectorAll('.control-fila').length, { timeout: 3000 }).toBe(2);
    const fila = nodo.querySelector('.control-fila') as HTMLElement;
    expect(enGrupo(fila)).toBe(true);
    const casilla = fila.querySelector('input[type=checkbox]') as HTMLInputElement;
    expect(casilla.checked).toBe(false);
    expect(fila.querySelector('.control-cifra')?.textContent).toBe('−$12.50');
    await userEvent.click(fila);
    expect(casilla.checked).toBe(true);
  });

  it('PRU-CMP-CTA-866 [C-45, FT-43] CA-K3-13: en Conciliar, «Revisar» sin archivo se ve apagado con «Subí el archivo CSV.» debajo; al tocarlo no lee nada y el foco va a «Elegir archivo»', async () => {
    const iniciar = vi.fn(ok);
    const nodo = await montar(
      <FormularioConciliar
        iniciar={iniciar}
        terminar={vi.fn()}
        agregar={vi.fn()}
        cuentaId="c1"
        cuenta="Cuenta corriente"
        categorias={[]}
        tiposAlta={{ cargo: [], abono: [] }}
      />,
    );
    const revisar = boton(nodo, tc.revisar);
    expect(revisar.disabled).toBe(false);
    expect(revisar.getAttribute('aria-disabled')).toBe('true');
    expect(descrito(revisar)).toBe(tc.falta);
    await tocar(revisar);
    expect(iniciar).not.toHaveBeenCalled();
    await expect.poll(() => document.activeElement).toBe(boton(nodo, tc.elegirArchivo));
  });

  it('PRU-CMP-CTA-867 [C-45, FT-53] CA-K3-8: archivar una tarjeta elige qué hacer con las asignaciones futuras en opciones en fila, dentro de un radiogroup con nombre', async () => {
    const accion = vi.fn(() =>
      ok({ revisionVista: 'r1', huellaImpacto: 'h1', impacto: null, avisos: [], rechazos: [] }),
    );
    const nodo = await montar(
      <FormularioCuentasArchivar
        accion={accion}
        cuentaId="t1"
        nombre="Visa Oro"
        esTarjeta
        saldo={0 as Centavos}
        deuda={0 as Centavos}
        reservado={0 as Centavos}
        bloqueos={[]}
      />,
    );
    const t = cuentasGestion.archivar;
    const grupo = segmentado(nodo, t.futuras) as HTMLElement;
    expect(grupo.classList.contains('grupo-campos')).toBe(true);
    const filas = grupo.querySelectorAll('.control-fila');
    expect(filas).toHaveLength(2);
    expect(grupo.querySelector<HTMLInputElement>('input[value=devolver]')?.checked).toBe(true);
    await userEvent.click(filas[1] as HTMLElement);
    expect(grupo.querySelector<HTMLInputElement>('input[value=dejar]')?.checked).toBe(true);
  });

  it.each(['claro', 'oscuro'])(
    'PRU-CMP-CTA-868 [C-45] CA-K3-14: en el tema %s Editar una tarjeta, Condiciones, Cuota, Pagar y Verificar saldo no tienen violaciones de axe',
    async (tema) => {
      document.documentElement.dataset['theme'] = tema;
      const raices = [
        await montar(editar()),
        await montar(<FormularioCuentasCondiciones prestamoId="p1" visto={PRESTAMO} />),
        await montar(cuota()),
        await montar(pagar('o1')),
        await montar(verificar()),
      ];
      for (const raiz of raices) {
        const { violations } = await axe.run(raiz, {
          runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
        });
        expect(
          violations.map((v) => `${v.id}: ${v.nodes.map((x) => x.target.join(' ')).join(', ')}`),
        ).toEqual([]);
      }
    },
  );
});
