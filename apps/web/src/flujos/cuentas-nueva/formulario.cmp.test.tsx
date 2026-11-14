// FT-50 Crear cuenta con un borrador anterior (05 §4.11): un borrador guardado antes de que el formulario tuviera un campo no
// trae esa clave. Al restaurarlo, la clave que falta toma su valor inicial y el campo se muestra vacío, sin romper la pantalla.
// [C-45] Abajo, Nueva cuenta con la familia v3 (CAMPOS-V3 §2 a §6 y §11).
import axe from 'axe-core';
import { act, useState, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import type { FechaLocal } from '@finn/dominio/valores';
import '../../app/globals.css';
import { GrupoCampos } from '../../componentes/base/campo';
import { EntradaMonto } from '../../componentes/formularios/entrada-monto';
import type { Signo } from '../../formularios/normalizar-monto';
import { crearCuenta } from '../../servidor/acciones/cuentas';
import { base } from '../../textos/base';
import { cuentaSubtipo } from '../../textos/cuenta-subtipo';
import { cuentasNueva as t } from '../../textos/cuentas-nueva';
import { claveDeBorrador } from '../../formularios/clave-borrador';
import { valoresIniciales, type TipoCuenta } from './campos';
import { FormularioCuentaNueva } from './formulario';

// `next/link` y `next/navigation` necesitan el enrutador de Next, y la acción es del servidor: se simulan.
vi.mock('next/navigation', () => ({
  usePathname: () => '/cuentas/nueva',
  useRouter: () => ({ replace: vi.fn(), back: vi.fn() }),
}));
vi.mock('next/link', async () => {
  const { createElement } = await import('react');
  const Enlace = ({ href, children, ...resto }: { href: string; children?: ReactNode }) =>
    createElement('a', { href, ...resto }, children);
  return Object.assign(Enlace, { default: Enlace, useLinkStatus: () => ({ pending: false }) });
});
vi.mock('../../servidor/acciones/cuentas', () => ({ crearCuenta: vi.fn() }));

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
  vi.mocked(crearCuenta).mockClear();
});

const HOY = '2027-02-05' as FechaLocal;

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

const entrada = (nodo: HTMLElement, etiqueta: string): HTMLInputElement | undefined =>
  [...nodo.querySelectorAll('label')]
    .filter((l) => l.textContent.trim().startsWith(etiqueta))
    .map((l) => l.control)
    .find((c): c is HTMLInputElement => c instanceof HTMLInputElement);

describe('PRU-CMP-CTA-820 crear un préstamo con un borrador anterior', () => {
  it('PRU-CMP-CTA-820 [FT-50] con un borrador sin seguro del primer mes ni comisión, elegir Banco Agrícola muestra los dos campos vacíos y no rompe', async () => {
    // El borrador de antes de que existieran los dos campos: sin sus claves.
    const viejo = Object.fromEntries(
      Object.entries(valoresIniciales(HOY, 'efectivo', 'Préstamo de Ana')).filter(
        ([clave]) => clave !== 'seguroPrimerMes' && clave !== 'comision',
      ),
    );
    sessionStorage.setItem(
      claveDeBorrador('/cuentas/nueva'),
      JSON.stringify({
        version: 1,
        guardadoEn: '2027-02-05T10:00:00Z',
        campos: viejo,
        id: null,
        esperado: undefined,
        revisionAlAbrir: null,
      }),
    );
    const nodo = await montar(
      <FormularioCuentaNueva
        hoy={HOY}
        tipoInicial="efectivo"
        subtipo={cuentaSubtipo}
        instituciones={[]}
        nombresTarjetaUsados={[]}
      />,
    );
    await expect
      .poll(() => (entrada(nodo, t.nombre)?.value ?? '') === 'Préstamo de Ana')
      .toBe(true);

    await userEvent.click(nodo.querySelector('label[data-tipo-cuenta=prestamo]') as HTMLElement);
    await expect.poll(() => nodo.querySelector('details[data-seccion=condiciones]')).not.toBeNull();
    await userEvent.click(
      nodo.querySelector('details[data-seccion=condiciones] summary') as HTMLElement,
    );
    const agricola = [...nodo.querySelectorAll<HTMLElement>('[role=radio]')].find(
      (r) => r.textContent.trim() === t.modelos.banco_agricola,
    );
    expect(agricola).toBeDefined();
    await userEvent.click(agricola as HTMLElement);

    await expect.poll(() => entrada(nodo, t.seguroPrimerMes)?.value).toBe('');
    expect(entrada(nodo, t.comision)?.value).toBe('');
    expect(nodo.textContent).toContain(t.titulo);
  });
});

// [C-45] Nueva cuenta con la familia v3 (CAMPOS-V3 §2 a §6 y §11): cada bloque de datos es un `GrupoCampos`, los montos van en
// fila con «$», los porcentajes con «%», las fechas con su máscara y los enteros sin letras. Los CA-K3-n de PROMPT-CAMPOS.md §5
// van en el texto del título.
const INSTITUCIONES = [
  { id: '00000000-0000-4000-8000-000000000001', nombre: 'BAC' },
  { id: '00000000-0000-4000-8000-000000000002', nombre: 'Banco Agrícola' },
  { id: '00000000-0000-4000-8000-000000000003', nombre: 'Cuscatlán' },
];

const nueva = (tipo: TipoCuenta) => (
  <FormularioCuentaNueva
    hoy={HOY}
    tipoInicial={tipo}
    subtipo={cuentaSubtipo}
    instituciones={INSTITUCIONES}
    nombresTarjetaUsados={[]}
  />
);

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
const segmentado = (nodo: HTMLElement, etiqueta: string): HTMLElement =>
  nodo.querySelector<HTMLElement>(`[role=radiogroup][aria-label="${etiqueta}"]`) as HTMLElement;
const opcion = (grupo: HTMLElement, texto: string): HTMLElement =>
  [...grupo.querySelectorAll<HTMLElement>('[role=radio]')].find(
    (r) => r.textContent.trim() === texto,
  ) as HTMLElement;
const descrito = (el: Element): string =>
  (el.getAttribute('aria-describedby') ?? '')
    .split(' ')
    .map((id) => document.getElementById(id)?.textContent ?? '')
    .join(' ');
const afijo = (el: Element): string | undefined =>
  filaDe(el).querySelector('.campo-afijo')?.textContent;
const sufijo = (el: Element): string | undefined =>
  filaDe(el).querySelector('.campo-afijo:last-of-type')?.textContent;

async function escribir(el: HTMLElement, texto: string): Promise<void> {
  await userEvent.clear(el);
  await userEvent.type(el, texto);
}

describe('PRU-CMP-CTA nueva cuenta con los campos v3', () => {
  it('PRU-CMP-CTA-850 [C-45, FT-50] CA-K3-6: efectivo va en un grupo de filas con el subtipo en segmentado y su ayuda, la institución en la lista propia, «Últimos 4» sin letras y el saldo con «$»; la billetera quita institución y últimos 4', async () => {
    const nodo = await montar(nueva('efectivo'));
    const sub = segmentado(nodo, cuentaSubtipo.etiqueta);
    expect(sub.dataset['v3']).toBe('');
    expect(enGrupo(sub)).toBe(true);
    expect(sub.querySelectorAll('[role=radio]')).toHaveLength(3);
    expect(filaDe(sub).textContent).toContain(cuentaSubtipo.ayudas.corriente);
    for (const etiqueta of [t.nombre, t.institucion, t.ultimos4, t.apertura, t.saldo.efectivo])
      expect(enGrupo(de(nodo, etiqueta))).toBe(true);
    // Cuatro opciones (Sin institución y tres bancos): la lista propia, no el `<select>` ni radios (CAMPOS-V3 §6).
    expect(de(nodo, t.institucion).getAttribute('aria-haspopup')).toBe('listbox');
    expect(nodo.querySelector('select')).toBeNull();
    const ultimos4 = de(nodo, t.ultimos4);
    await userEvent.type(ultimos4, 'a1b2c3d4e5');
    expect(ultimos4.value).toBe('1234');
    const saldo = de(nodo, t.saldo.efectivo);
    expect(saldo.getAttribute('inputmode')).toBe('decimal');
    expect(afijo(saldo)).toBe(base.moneda);
    expect(descrito(saldo)).toContain(t.entraALpa);

    await userEvent.click(opcion(sub, cuentaSubtipo.opciones.billetera));
    await expect.poll(() => de(nodo, t.nombre).value).toBe(cuentaSubtipo.nombres.billetera);
    expect(filaDe(sub).textContent).toContain(cuentaSubtipo.ayudas.billetera);
    expect(control(nodo, t.institucion)).toBeUndefined();
    expect(control(nodo, t.ultimos4)).toBeUndefined();
  });

  it('PRU-CMP-CTA-851 [C-45, C-41] CA-K3-3 y CA-K3-4: el saldo pone las comas, corta en 2 decimales, completa al salir y marca el máximo en el momento; la apertura pone las barras, marca lo incompleto al salir y la fecha que no existe en el momento', async () => {
    const nodo = await montar(nueva('efectivo'));
    const saldo = de(nodo, t.saldo.efectivo);
    await escribir(saldo, '1236.456');
    expect(saldo.value).toBe('1,236.45');
    await escribir(saldo, '1236.4');
    await userEvent.tab();
    await expect.poll(() => saldo.value).toBe('1,236.40');
    await escribir(saldo, '25000000');
    expect(saldo.value).toBe('25,000,000');
    await expect.poll(() => filaDe(saldo).dataset['error']).toBe('');
    expect(filaDe(saldo).textContent).toContain(base.montoMaximoV3);
    expect(saldo.getAttribute('aria-invalid')).toBe('true');

    const apertura = de(nodo, t.apertura);
    await escribir(apertura, '15102026');
    expect(apertura.value).toBe('15/10/2026');
    await escribir(apertura, '1510');
    expect(filaDe(apertura).textContent).not.toContain(base.fechaIncompleta);
    await userEvent.tab();
    await expect.poll(() => filaDe(apertura).textContent).toContain(base.fechaIncompleta);
    await escribir(apertura, '31022026');
    expect(filaDe(apertura).textContent).toContain(base.fechaNoExiste);
  });

  it('PRU-CMP-CTA-852 [C-45, FT-50] CA-K3-6: la tarjeta lleva el saldo con «Debo · Tengo a favor» en segmentado dentro del grupo, la red en segmentado, la tasa con «%», los días sin letras y el color fuera del grupo', async () => {
    const nodo = await montar(nueva('tarjeta'));
    await expect.poll(() => control(nodo, t.limiteCredito)).toBeDefined();
    const signo = segmentado(nodo, base.signoDelMonto);
    expect(signo.dataset['v3']).toBe('');
    expect(enGrupo(signo)).toBe(true);
    expect(opcion(signo, t.debo).getAttribute('aria-checked')).toBe('true');
    await userEvent.click(opcion(signo, t.tengoAFavor));
    await expect.poll(() => opcion(signo, t.tengoAFavor).getAttribute('aria-checked')).toBe('true');
    const red = segmentado(nodo, t.red);
    expect(red.dataset['v3']).toBe('');
    expect(red.querySelectorAll('[role=radio]')).toHaveLength(3);
    const limite = de(nodo, t.limiteCredito);
    expect(enGrupo(limite)).toBe(true);
    expect(afijo(limite)).toBe(base.moneda);
    const tasa = de(nodo, t.tasaAnual);
    await userEvent.type(tasa, '1005.555');
    expect(tasa.value).toBe('100.55');
    expect(sufijo(tasa)).toBe(base.porcentaje);
    const corte = de(nodo, t.diaCorte);
    await userEvent.type(corte, '1a5');
    expect(corte.value).toBe('15');
    expect(enGrupo(nodo.querySelector('[data-color-tarjeta]') as HTMLElement)).toBe(false);
  });

  it('PRU-CMP-CTA-853 [C-45, C-41, FT-50] «Cantidad de cuotas» y «Cuotas que ya pagaste» no aceptan letras; cada sección del préstamo es un grupo, la frecuencia va en la lista y «Condiciones · opcional» plegada con el modelo en segmentado y el aviso solo con «Sin modelo»', async () => {
    const nodo = await montar(nueva('prestamo'));
    await expect.poll(() => control(nodo, t.plazoCuotas)).toBeDefined();
    for (const seccion of ['El préstamo', 'Cuotas'])
      expect(nodo.querySelector(`[data-seccion="${seccion}"] .grupo-campos`)).not.toBeNull();
    const plazo = de(nodo, t.plazoCuotas);
    await userEvent.type(plazo, '1a8b');
    expect(plazo.value).toBe('18');
    expect(plazo.getAttribute('inputmode')).toBe('numeric');
    const pagadas = de(nodo, t.cuotasPagadas);
    await userEvent.type(pagadas, 'seis6x');
    expect(pagadas.value).toBe('6');
    expect(de(nodo, t.frecuencia).getAttribute('aria-haspopup')).toBe('listbox');
    expect(afijo(de(nodo, t.cuotaPactada))).toBe(base.moneda);

    const condiciones = nodo.querySelector<HTMLDetailsElement>(
      'details[data-seccion=condiciones]',
    ) as HTMLDetailsElement;
    expect(condiciones.open).toBe(false);
    await userEvent.click(condiciones.querySelector('summary') as HTMLElement);
    expect(condiciones.querySelector('.grupo-campos')).not.toBeNull();
    expect(condiciones.textContent).toContain(t.avisoSinModelo);
    const modelo = segmentado(nodo, t.modelo);
    expect(modelo.dataset['v3']).toBe('');
    expect(sufijo(de(nodo, t.tasaAnual))).toBe(base.porcentaje);
    await userEvent.click(opcion(modelo, t.modelos.banco_agricola));
    await expect.poll(() => condiciones.textContent).not.toContain(t.avisoSinModelo);
    expect(afijo(de(nodo, t.seguroPrimerMes))).toBe(base.moneda);
    expect(afijo(de(nodo, t.comision))).toBe(base.moneda);
  });

  it('PRU-CMP-CTA-854 [C-45, FT-50] CA-K3-13: «Crear cuenta» se ve apagado con aria-disabled y el motivo debajo; al tocarlo no envía, marca el error y lleva el foco al primero; completo, se enciende', async () => {
    const nodo = await montar(nueva('efectivo'));
    const boton = nodo.querySelector('button[type=submit]') as HTMLButtonElement;
    expect(boton.disabled).toBe(false);
    expect(boton.getAttribute('aria-disabled')).toBe('true');
    expect(descrito(boton)).toBe(base.corregirCampos(1));
    boton.focus();
    await userEvent.keyboard('{Enter}');
    const saldo = de(nodo, t.saldo.efectivo);
    await expect.poll(() => filaDe(saldo).dataset['error']).toBe('');
    await expect.poll(() => document.activeElement).toBe(saldo);
    expect(crearCuenta).not.toHaveBeenCalled();
    expect(filaDe(saldo).textContent).toContain(t.obligatorio);
    await userEvent.type(saldo, '10');
    // Sin motivo, `Boton` deja de envolverse con él: el botón se vuelve a buscar.
    const listo = () => nodo.querySelector('button[type=submit]') as HTMLButtonElement;
    await expect.poll(() => listo().getAttribute('aria-disabled')).toBeNull();
    expect(listo().getAttribute('aria-describedby')).toBeNull();
  });

  it.each(['claro', 'oscuro'])(
    'PRU-CMP-CTA-855 [C-45] CA-K3-14: en el tema %s la tarjeta y el préstamo con sus condiciones abiertas no tienen violaciones de axe',
    async (tema) => {
      document.documentElement.dataset['theme'] = tema;
      const tarjeta = await montar(nueva('tarjeta'));
      const prestamo = await montar(nueva('prestamo'));
      await expect.poll(() => control(tarjeta, t.limiteCredito)).toBeDefined();
      await expect.poll(() => control(prestamo, t.plazoCuotas)).toBeDefined();
      await userEvent.click(prestamo.querySelector('details summary') as HTMLElement);
      for (const raiz of [tarjeta, prestamo]) {
        const { violations } = await axe.run(raiz, {
          runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
        });
        expect(
          violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
        ).toEqual([]);
      }
    },
  );

  it('PRU-CMP-CTA-856 [C-45] EntradaMonto en fila con signo: el segmentado va en su propia fila del grupo y pegar «-$1,234.50» deja el monto sin signo y elige el negativo', async () => {
    function ConSigno() {
      const [valor, setValor] = useState('');
      const [signo, setSigno] = useState<Signo>('positivo');
      return (
        <GrupoCampos>
          <EntradaMonto
            nombre="saldo"
            etiqueta="Saldo"
            valor={valor}
            alCambiar={setValor}
            conSigno
            signo={signo}
            alCambiarSigno={setSigno}
            etiquetasSigno={{ positivo: 'Debo', negativo: 'Tengo a favor' }}
          />
        </GrupoCampos>
      );
    }
    const nodo = await montar(<ConSigno />);
    const grupo = segmentado(nodo, base.signoDelMonto);
    expect(grupo.dataset['v3']).toBe('');
    const saldo = nodo.querySelector('input[name=saldo]') as HTMLInputElement;
    expect(filaDe(grupo)).not.toBe(filaDe(saldo));
    expect(opcion(grupo, 'Debo').getAttribute('aria-checked')).toBe('true');
    const datos = new DataTransfer();
    datos.setData('text', '-$1,234.50');
    saldo.focus();
    await act(() => {
      saldo.dispatchEvent(
        new ClipboardEvent('paste', { clipboardData: datos, bubbles: true, cancelable: true }),
      );
      return Promise.resolve();
    });
    expect(saldo.value).toBe('1,234.50');
    expect(opcion(grupo, 'Tengo a favor').getAttribute('aria-checked')).toBe('true');
  });
});
