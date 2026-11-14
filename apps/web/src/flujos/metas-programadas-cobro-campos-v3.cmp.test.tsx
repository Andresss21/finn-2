// [C-45] Metas, Programadas y Por cobrar con la familia v3 (CAMPOS-V3 §2 a §6, §8 y §11): Nueva meta, Editar meta, la programada,
// Condonar y Renombrar deudor. Cada bloque de datos es un `GrupoCampos`; los montos van en fila con «$», las elecciones de 4 a 7
// en opciones en fila, las de 3 o menos en segmentado y las demás en la lista propia. El botón de guardar se ve apagado con
// `aria-disabled` y dice debajo qué falta. Los CA-K3-n de PROMPT-CAMPOS.md §5 van en el título.
import type { Centavos, FechaLocal } from '@finn/dominio/valores';
import axe from 'axe-core';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import '../app/globals.css';
import { gestionarMeta } from '../servidor/acciones/presupuesto';
import { base } from '../textos/base';
import { metas as tm } from '../textos/metas';
import { porCobrarRenombrar as tr } from '../textos/por-cobrar';
import { porCobrarCondonar as tc } from '../textos/por-cobrar-condonar';
import { programadas as tp } from '../textos/programadas';
import { FormularioMetaEditar } from './metas-meta/formulario';
import { FormularioMeta } from './metas-nueva/formulario';
import { FormularioCondonar } from './por-cobrar-condonar-linea/formulario';
import { FormularioPorCobrarRenombrar } from './por-cobrar-deudores-renombrar/formulario';
import type { Campos } from './programadas-nueva/campos';
import { FormularioProgramada } from './programadas-nueva/formulario';

// `next/link` y `next/navigation` necesitan el enrutador de Next, y las acciones son del servidor: se simulan.
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ replace: vi.fn(), back: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock('next/link', async () => {
  const { createElement } = await import('react');
  const Enlace = ({ href, children, ...resto }: { href: string; children?: ReactNode }) =>
    createElement('a', { href, ...resto }, children);
  return Object.assign(Enlace, { default: Enlace, useLinkStatus: () => ({ pending: false }) });
});
vi.mock('../servidor/acciones/presupuesto', () => ({ gestionarMeta: vi.fn() }));

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
  vi.mocked(gestionarMeta).mockClear();
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

const ok = () => Promise.resolve({ ok: true as const, valor: {}, yaAplicada: false, avisos: [] });

/** El control de un rótulo (input o disparador), buscado por el texto con que empieza su `<label>`. */
const de = (nodo: HTMLElement, etiqueta: string): HTMLInputElement =>
  [...nodo.querySelectorAll('label')]
    .filter((l) => l.textContent.trim().startsWith(etiqueta))
    .map((l) => l.control)
    .find((c): c is HTMLInputElement => c instanceof HTMLElement) as HTMLInputElement;
const filaDe = (el: Element): HTMLElement => el.closest<HTMLElement>('.campo-fila') as HTMLElement;
const enGrupo = (el: Element): boolean => el.closest('.grupo-campos') !== null;
const afijo = (el: Element) => filaDe(el).querySelector('.campo-afijo')?.textContent;
const radiogrupo = (nodo: HTMLElement, etiqueta: string) =>
  nodo.querySelector<HTMLElement>(`[role=radiogroup][aria-label="${etiqueta}"]`) as HTMLElement;
const boton = (nodo: HTMLElement, texto: string): HTMLButtonElement =>
  [...nodo.querySelectorAll('button')].find((b) =>
    b.textContent.trim().startsWith(texto),
  ) as HTMLButtonElement;
const descrito = (el: Element): string =>
  (el.getAttribute('aria-describedby') ?? '')
    .split(' ')
    .map((id) => document.getElementById(id)?.textContent ?? '')
    .join(' ');

/** Un botón apagado (`aria-disabled`) se toca con el teclado: el puntero de Playwright espera a que se habilite. */
async function tocar(b: HTMLElement): Promise<void> {
  b.focus();
  await userEvent.keyboard('{Enter}');
}

const CATEGORIAS = [
  { id: 'c1', nombre: 'Super' },
  { id: 'c2', nombre: 'Salidas' },
  { id: 'c3', nombre: 'Ropa' },
  { id: 'c4', nombre: 'Gimnasio' },
];
const nueva = () => <FormularioMeta categorias={CATEGORIAS} />;
const editar = () => (
  <FormularioMetaEditar
    meta={{
      id: 'm1',
      categoria: 'Viaje',
      tipo: 'para_fecha',
      monto: 50000 as Centavos,
      fechaObjetivo: '2027-01-31',
      vencida: true,
    }}
  />
);
const PROGRAMADA: Campos = {
  tipo: 'gasto',
  cuentaId: '',
  cuentaDestinoId: '',
  comercio: '',
  monto: '',
  tolerancia: '',
  frecuencia: 'mensual',
  frecuenciaDias: '',
  primeraFecha: '2027-02-05',
  fechaFin: '',
  registroAutomatico: false,
  lineas: [{ monto: '', categoriaId: '' }],
};
const programada = (accion = vi.fn(ok)) => (
  <FormularioProgramada
    inicial={PROGRAMADA}
    origenes={{
      gasto: [
        { id: 'o1', nombre: 'Cuenta BAC' },
        { id: 'o2', nombre: 'Visa Oro' },
      ],
      otros: [{ id: 'o1', nombre: 'Cuenta BAC' }],
    }}
    destinos={{ pago_tarjeta: [], cuota_prestamo: [], aporte_inversion: [] }}
    categorias={CATEGORIAS}
    calendarioEditable
    motivoCalendario=""
    puedeEliminar={false}
    accion={accion}
    accionEliminar={vi.fn(ok)}
  />
);
const condonar = (accion = vi.fn(ok)) => (
  <FormularioCondonar
    accion={accion}
    lineaId="l1"
    deudor="Beto"
    abierto="$15.00"
    montoInicial="15.00"
    hoy={'2027-02-12' as FechaLocal}
    categorias={[
      { id: 'c1', nombre: 'Ropa', disponible: '$0.00' },
      { id: 'c2', nombre: 'Salidas', disponible: '$20.00' },
      { id: 'c3', nombre: 'Restaurantes', disponible: '−$26.30' },
      { id: 'c4', nombre: 'Super', disponible: '$5.00' },
    ]}
    categoriaPropuesta="c2"
    rutaPadre="/por-cobrar"
    superpuesto={false}
  />
);
const renombrar = (accion = vi.fn(ok)) => (
  <FormularioPorCobrarRenombrar accion={accion} deudorId="d1" nombre="Beto" />
);

describe('PRU-CMP-META metas con los campos v3', () => {
  it('PRU-CMP-META-782 [C-45, FT-17] CA-K3-6 y CA-K3-13: en Nueva meta el tipo son opciones en fila, el modo un segmentado y el monto lleva «$», todo en grupos; sin monto, «Crear meta» dice «Escribí el monto para guardar.» y al tocarlo marca «Escribí un monto mayor que $0.00.» y lleva el foco al monto', async () => {
    const nodo = await montar(nueva());
    const tipo = radiogrupo(nodo, tm.tipo);
    expect(tipo.classList.contains('grupo-campos')).toBe(true);
    expect(tipo.querySelectorAll('.control-fila')).toHaveLength(4);
    const modo = radiogrupo(nodo, tm.modo);
    expect(modo.dataset['v3']).toBe('');
    expect(enGrupo(modo)).toBe(true);
    expect(de(nodo, tm.categoria).getAttribute('aria-haspopup')).toBe('listbox');
    const monto = de(nodo, tm.monto);
    expect(enGrupo(monto)).toBe(true);
    expect(afijo(monto)).toBe(base.moneda);
    const crear = boton(nodo, tm.crear);
    expect(crear.getAttribute('aria-disabled')).toBe('true');
    expect(descrito(crear)).toBe(base.motivoMonto);
    await tocar(crear);
    await expect.poll(() => filaDe(monto).textContent).toContain(base.montoMayorQueCero);
    await expect.poll(() => document.activeElement).toBe(monto);
    expect(gestionarMeta).not.toHaveBeenCalled();

    // «Para una fecha» no tiene modo y pide la fecha objetivo, en el mismo grupo que el monto.
    const paraFecha = [...tipo.querySelectorAll<HTMLElement>('.control-fila')].find(
      (f) => f.textContent === tm.tipos.para_fecha,
    ) as HTMLElement;
    await userEvent.click(paraFecha);
    expect(radiogrupo(nodo, tm.modo)).toBeNull();
    expect(enGrupo(de(nodo, tm.fechaObjetivo))).toBe(true);
  });

  it('PRU-CMP-META-783 [C-45, FT-17, CA-E4-18] en Editar meta el tipo es la fila «Solo lectura» y el monto y la fecha son filas del mismo grupo; «Ajustar el monto» lleva el foco al monto', async () => {
    const nodo = await montar(editar());
    const tipo = nodo.querySelector<HTMLElement>('[data-dato-fijo="tipo"]') as HTMLElement;
    expect(enGrupo(tipo)).toBe(true);
    expect(tipo.textContent).toContain(base.soloLectura);
    const monto = de(nodo, tm.monto);
    expect(afijo(monto)).toBe(base.moneda);
    expect(monto.value).toBe('500.00');
    expect(enGrupo(de(nodo, tm.fechaObjetivo))).toBe(true);
    await userEvent.click(boton(nodo, tm.vencida.ajustar));
    expect(document.activeElement).toBe(monto);
  });
});

describe('PRU-CMP-PROG programadas con los campos v3', () => {
  it('PRU-CMP-PROG-782 [C-45, FT-40] CA-K3-6 y CA-K3-13: la programada nueva lleva el tipo en opciones en fila, la cuenta en segmentado, la categoría y la frecuencia en la lista propia y los montos con «$»; vacía, «Crear programada» dice cuántos campos corregir y al tocarlo no envía y lleva el foco al primero', async () => {
    const accion = vi.fn(ok);
    const nodo = await montar(programada(accion));
    expect(radiogrupo(nodo, tp.tipo).querySelectorAll('.control-fila')).toHaveLength(4);
    const cuenta = radiogrupo(nodo, tp.cuenta);
    expect(enGrupo(cuenta)).toBe(true);
    for (const e of [tp.comercio, tp.monto, tp.tolerancia, tp.primeraFecha, tp.fechaFin])
      expect(enGrupo(de(nodo, e))).toBe(true);
    expect(afijo(de(nodo, tp.monto))).toBe(base.moneda);
    expect(afijo(de(nodo, tp.tolerancia))).toBe(base.moneda);
    for (const e of [tp.categoria, tp.frecuencia])
      expect(de(nodo, e).getAttribute('aria-haspopup')).toBe('listbox');
    expect(nodo.querySelector('select')).toBeNull();
    const crear = boton(nodo, tp.crear);
    expect(crear.getAttribute('aria-disabled')).toBe('true');
    expect(descrito(crear)).toBe(base.corregirCampos(4));
    await tocar(crear);
    await expect.poll(() => filaDe(cuenta).textContent).toContain(tp.elegirCuenta);
    expect(filaDe(de(nodo, tp.categoria)).textContent).toContain(tp.elegirCategoria);
    expect(filaDe(de(nodo, tp.monto)).textContent).toContain(base.montoMayorQueCero);
    await expect.poll(() => document.activeElement?.closest('[role=radiogroup]')).toBe(cuenta);
    expect(accion).not.toHaveBeenCalled();
  });
});

describe('PRU-CMP-COBRO por cobrar con los campos v3', () => {
  it('PRU-CMP-COBRO-884 [C-45, FT-47] CA-K3-5 y CA-K3-13: en Condonar el monto, la fecha y la categoría son filas de un grupo, con el Disponible negativo en problema; sin monto, «Condonar» dice «Escribí el monto para guardar.» y al tocarlo no envía', async () => {
    const accion = vi.fn(ok);
    const nodo = await montar(condonar(accion));
    const monto = de(nodo, tc.monto);
    expect(enGrupo(monto)).toBe(true);
    expect(afijo(monto)).toBe(base.moneda);
    expect(enGrupo(de(nodo, tc.fecha))).toBe(true);
    const categoria = de(nodo, tc.categoria);
    expect(enGrupo(categoria)).toBe(true);
    await userEvent.click(categoria);
    const restaurantes = [...document.querySelectorAll<HTMLElement>('[role=option]')].find((o) =>
      o.textContent.startsWith('Restaurantes'),
    ) as HTMLElement;
    expect(restaurantes.querySelector<HTMLElement>('.campo-detalle')?.dataset['negativo']).toBe('');
    await userEvent.keyboard('{Escape}');
    await userEvent.clear(monto);
    const condonarBoton = () => boton(nodo, tc.condonar);
    await expect.poll(() => condonarBoton().getAttribute('aria-disabled')).toBe('true');
    expect(descrito(condonarBoton())).toBe(base.motivoMonto);
    await tocar(condonarBoton());
    await expect.poll(() => filaDe(monto).textContent).toContain(base.montoMayorQueCero);
    expect(accion).not.toHaveBeenCalled();
  });

  it('PRU-CMP-COBRO-885 [C-45, FT-48] CA-K3-13: en Renombrar el nombre es una fila de un grupo; vacío, «Guardar nombre» se ve apagado con el motivo y al tocarlo no envía y lleva el foco al nombre', async () => {
    const accion = vi.fn(ok);
    const nodo = await montar(renombrar(accion));
    const nombre = de(nodo, tr.nombre);
    expect(enGrupo(nombre)).toBe(true);
    await userEvent.clear(nombre);
    const guardar = () => boton(nodo, tr.guardar);
    await expect.poll(() => guardar().getAttribute('aria-disabled')).toBe('true');
    expect(descrito(guardar())).toBe(base.corregirCampos(1));
    await tocar(guardar());
    await expect.poll(() => filaDe(nombre).dataset['error']).toBe('');
    await expect.poll(() => document.activeElement).toBe(nombre);
    expect(accion).not.toHaveBeenCalled();
  });

  it.each(['claro', 'oscuro'])(
    'PRU-CMP-COBRO-886 [C-45] CA-K3-14: en el tema %s Nueva meta, Editar meta, la programada, Condonar y Renombrar no tienen violaciones de axe',
    async (tema) => {
      document.documentElement.dataset['theme'] = tema;
      const raices = [
        await montar(nueva()),
        await montar(editar()),
        await montar(programada()),
        await montar(condonar()),
        await montar(renombrar()),
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
