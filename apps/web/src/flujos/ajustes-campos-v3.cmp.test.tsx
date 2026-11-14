// [C-45] Ajustes, Seguridad, Reglas y los filtros de Actividad con la familia v3 (CAMPOS-V3 §2 a §6, §8 y §11): cada bloque de
// datos es un `GrupoCampos`; las selecciones van en segmentado (3 opciones o menos) o en la lista propia, las casillas y el
// interruptor como filas, y Guardar se ve apagado con `aria-disabled` y dice debajo qué falta. Sin subrayados (C-33). Los CA-K3-n
// de PROMPT-CAMPOS.md §5 van en el texto del título.
import axe from 'axe-core';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import '../app/globals.css';
import { PanelApariencia } from '../app/(finn)/ajustes/apariencia/panel';
import { FormularioFiltros } from '../app/(finn)/actividad/filtros';
import { ProveedorTema } from '../componentes/marco/proveedor-tema';
import { gestionarRegla } from '../servidor/acciones/bandeja';
import { actividad as ta } from '../textos/actividad';
import { ajustesApariencia as tap } from '../textos/ajustes-apariencia';
import { ajustesCiclo as tci } from '../textos/ajustes-ciclo';
import { ajustesFormatos as tf } from '../textos/ajustes-formatos';
import { ajustesInstituciones as ti } from '../textos/ajustes-instituciones';
import { base } from '../textos/base';
import { ingreso } from '../textos/ingreso';
import { reglas as tr } from '../textos/reglas';
import { seguridad as ts } from '../textos/seguridad';
import { PanelCiclo } from './ajustes-ciclo/panel';
import { FormularioFormato } from './ajustes-formatos-formato/formulario';
import { FormularioInstitucion } from './ajustes-instituciones-institucion/formulario';
import { InscribirFactor } from './ajustes-seguridad-factores-nuevo/inscribir-factor';
import { FormularioQuitarFactor } from './ajustes-seguridad-factores-quitar/formulario';
import { FormularioReglaNueva } from './reglas-nueva/formulario';
import { FormularioReglaRegla } from './reglas-regla/formulario';

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
vi.mock('../servidor/acciones/bandeja', () => ({ gestionarRegla: vi.fn() }));

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
  window.localStorage.clear();
  vi.mocked(gestionarRegla).mockClear();
});

async function montar(ui: ReactNode): Promise<HTMLElement> {
  document.body.style.cssText = 'background: var(--fondo); color: var(--texto)';
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

const ok = (valor: unknown = {}) =>
  Promise.resolve({ ok: true as const, valor, yaAplicada: false, avisos: [] });
const esperar = async (): Promise<void> => {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
};

/** La fila v3 cuyo rótulo empieza con ese texto (la del `<label>` o la del segmentado). */
const fila = (nodo: HTMLElement, rotulo: string): HTMLElement => {
  const r = [...nodo.querySelectorAll('.campo-rotulo, .control-nombre')].find((x) =>
    x.textContent.trim().startsWith(rotulo),
  );
  const f = r?.closest<HTMLElement>('.campo-fila');
  if (f === null || f === undefined) throw new Error(`no hay una fila «${rotulo}»`);
  return f;
};
const enGrupo = (el: Element): boolean => el.closest('.grupo-campos') !== null;
const disparador = (f: HTMLElement) =>
  f.querySelector<HTMLButtonElement>('button[aria-haspopup="listbox"]');
const segmentado = (f: HTMLElement) => f.querySelector<HTMLElement>('[role=radiogroup]');
const boton = (nodo: HTMLElement, texto: string): HTMLButtonElement => {
  const b = [...nodo.querySelectorAll('button')].find((x) =>
    x.textContent.trim().startsWith(texto),
  );
  if (b === undefined) throw new Error(`no hay un botón «${texto}»`);
  return b;
};
const motivo = (b: HTMLElement): string =>
  (b.getAttribute('aria-describedby') ?? '')
    .split(' ')
    .map((id) => document.getElementById(id)?.textContent ?? '')
    .join(' ');
/** Un botón apagado (`aria-disabled`) se toca con el teclado: el puntero de Playwright espera a que se habilite. */
async function tocar(b: HTMLElement): Promise<void> {
  b.focus();
  await userEvent.keyboard('{Enter}');
  await esperar();
}
const subrayados = (nodo: HTMLElement): string[] =>
  [...nodo.querySelectorAll('a, button')]
    .filter((x) => getComputedStyle(x).textDecorationLine.includes('underline'))
    .map((x) => x.textContent);

const BAC = '11111111-1111-4111-8111-111111111111';
const formatoProps = {
  guardar: vi.fn(() => ok({ formatoId: 'f1' })),
  probar: vi.fn(() =>
    Promise.resolve({
      ok: true as const,
      valor: { coincide: true, demasiadoLargo: false },
      yaAplicada: false,
      avisos: [],
    }),
  ),
  instituciones: [
    { id: BAC, nombre: 'BAC' },
    { id: '44444444-4444-4444-8444-444444444444', nombre: 'Promerica' },
  ],
  smsParaProbar: [
    {
      smsId: '33333333-3333-4333-8333-333333333333',
      texto: 'Compra de 4821 por 1,5x',
      recibidoEn: '2027-02-18T20:00:00.000Z',
      estado: 'no_reconocido' as const,
    },
  ],
};

const GRUPOS = [
  {
    nombre: 'Comida',
    categorias: [
      { id: 'c1', nombre: 'Súper' },
      { id: 'c2', nombre: 'Cafés' },
    ],
  },
  {
    nombre: 'Casa',
    categorias: [
      { id: 'c3', nombre: 'Luz' },
      { id: 'c4', nombre: 'Agua' },
    ],
  },
];

describe('PRU-CMP-AJUS Ajustes y Seguridad con los campos v3', () => {
  it('PRU-CMP-AJUS-940 [C-45, FT-77] CA-K3-6: el tema de Apariencia va en un grupo como segmentado de tres opciones, sin lista, y elegir «Oscuro» lo aplica', async () => {
    const nodo = await montar(
      <ProveedorTema>
        <PanelApariencia />
      </ProveedorTema>,
    );
    const f = fila(nodo, tap.etiqueta);
    expect(enGrupo(f)).toBe(true);
    expect(disparador(f)).toBeNull();
    const radios = [...(segmentado(f)?.querySelectorAll<HTMLElement>('[role=radio]') ?? [])];
    expect(radios.map((r) => r.textContent)).toEqual([tap.sistema, tap.claro, tap.oscuro]);
    await act(async () => {
      radios[2]?.click();
      await Promise.resolve();
    });
    expect(document.documentElement.dataset['theme']).toBe('oscuro');
    delete document.documentElement.dataset['theme'];
  });

  it('PRU-CMP-AJUS-941 [C-45, FT-72] CA-K3-5 y CA-K3-13: el día del ciclo es la lista propia en un grupo; con el mismo día el error va en la fila y «Cambiar el ciclo» se ve apagado con aria-disabled y el motivo debajo', async () => {
    const accion = vi.fn(() =>
      ok({
        revisionVista: 'r1',
        huellaImpacto: null,
        impacto: null,
        avisos: [],
        rechazos: [{ codigo: 'ciclo_sin_cambio', datos: { dia: 21 } }],
      }),
    );
    const nodo = await montar(<PanelCiclo accion={accion} diaVigente={21} alCerrar={vi.fn()} />);
    await esperar();
    const f = fila(nodo, tci.nuevoDia);
    expect(enGrupo(f)).toBe(true);
    expect(nodo.querySelector('select')).toBeNull();
    const d = disparador(f) as HTMLButtonElement;
    expect(d.textContent).toContain('21');
    expect(f.hasAttribute('data-error')).toBe(true);
    const mensaje = tci.rechazos.ciclo_sin_cambio('21');
    expect(f.textContent).toContain(mensaje);
    const confirmar = boton(nodo, tci.confirmar);
    expect(confirmar.disabled).toBe(false);
    expect(confirmar.getAttribute('aria-disabled')).toBe('true');
    expect(motivo(confirmar)).toContain(mensaje);
    await tocar(confirmar);
    expect(accion).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(d);
    // Intro abre la lista propia; la flecha y Intro eligen el día siguiente, y Escape la cierra sin cambiar.
    d.focus();
    await userEvent.keyboard('{Enter}');
    expect(nodo.querySelector('[role=listbox]')).not.toBeNull();
    await userEvent.keyboard('{Escape}');
    expect(nodo.querySelector('[role=listbox]')).toBeNull();
    expect(document.activeElement).toBe(d);
  });

  it('PRU-CMP-AJUS-942 [C-45, FT-73] CA-K3-6 y CA-K3-8: el formato va en grupos de filas: la institución en segmentado, el tipo en la lista, el patrón y las banderas en filas, los separadores en segmentado, los formatos de fecha como casillas y «Activo» como interruptor a la derecha', async () => {
    const nodo = await montar(<FormularioFormato {...formatoProps} />);
    for (const r of [
      tf.campos.institucion,
      tf.campos.nombre,
      tf.campos.tipo,
      tf.campos.patron,
      tf.campos.banderas,
      tf.campos.miles,
      tf.campos.decimal,
      'AAAA/MM/DD',
      tf.campos.activo,
    ])
      expect(enGrupo(fila(nodo, r))).toBe(true);
    expect(segmentado(fila(nodo, tf.campos.institucion))).not.toBeNull();
    expect(disparador(fila(nodo, tf.campos.tipo))).not.toBeNull();
    expect(segmentado(fila(nodo, tf.campos.miles))?.textContent).toBe('ComaPuntoNinguno');
    expect(segmentado(fila(nodo, tf.campos.decimal))).not.toBeNull();
    expect(fila(nodo, tf.campos.patron).querySelector('textarea')?.rows).toBe(4);
    expect(fila(nodo, tf.campos.banderas).textContent).toContain(base.opcional);
    expect(nodo.querySelector('select')).toBeNull();
    const casilla = fila(nodo, 'AAAA/MM/DD');
    const marca = casilla.querySelector<HTMLInputElement>(
      'input[type=checkbox]',
    ) as HTMLInputElement;
    expect(marca.checked).toBe(false);
    // El control nativo cubre la fila: tocar el texto es tocar la casilla.
    await userEvent.click(casilla);
    expect(marca.checked).toBe(true);
    const activo = fila(nodo, tf.campos.activo);
    const interruptor = activo.querySelector<HTMLInputElement>('[role=switch]') as HTMLInputElement;
    expect(interruptor.checked).toBe(true);
    expect(activo.textContent).toContain(tf.campos.activoAyuda);
    const caja = activo.getBoundingClientRect();
    const pista = activo.querySelector('[data-control="interruptor"]')?.getBoundingClientRect();
    expect((pista?.right ?? 0) > caja.left + caja.width / 2).toBe(true);
    expect(
      (await axe.run(nodo)).violations.map(
        (v) => `${v.id}: ${v.nodes.map((n) => n.html.slice(0, 160)).join(' | ')}`,
      ),
    ).toEqual([]);
  });

  it('PRU-CMP-AJUS-943 [C-45, FT-73] CA-K3-13: un formato nuevo sin institución, nombre ni patrón tiene «Guardar formato» apagado con «Corregí 3 campos para guardar.»; al tocarlo no envía, marca los errores y el foco va a la institución', async () => {
    const guardar = vi.fn(() => ok({ formatoId: 'f1' }));
    const nodo = await montar(<FormularioFormato {...formatoProps} guardar={guardar} />);
    const g = boton(nodo, tf.guardar);
    expect(g.getAttribute('aria-disabled')).toBe('true');
    expect(g.disabled).toBe(false);
    expect(motivo(g)).toContain(base.corregirCampos(3));
    await tocar(g);
    expect(guardar).not.toHaveBeenCalled();
    for (const r of [tf.campos.institucion, tf.campos.nombre, tf.campos.patron])
      expect(fila(nodo, r).hasAttribute('data-error')).toBe(true);
    expect(fila(nodo, tf.campos.institucion).contains(document.activeElement)).toBe(true);
  });

  it('PRU-CMP-AJUS-944 [C-45, FT-73] CA-K3-5: «SMS para probar» es la lista propia en un grupo aunque haya un solo SMS, con la fecha y el estado como línea secundaria', async () => {
    const nodo = await montar(<FormularioFormato {...formatoProps} />);
    const f = fila(nodo, tf.probar.elegir);
    expect(enGrupo(f)).toBe(true);
    const d = disparador(f) as HTMLButtonElement;
    expect(d.textContent).toContain('Compra de 4821');
    expect(f.textContent).toContain(tf.probar.noReconocido);
    await userEvent.click(d);
    expect(nodo.querySelectorAll('[role=option]').length).toBe(1);
  });

  it('PRU-CMP-AJUS-945 [C-45, FT-73] CA-K3-13: el nombre de una institución nueva va en un grupo; vacío, «Crear institución» se ve apagado con el motivo y al tocarlo no envía y marca el campo', async () => {
    const guardar = vi.fn(() => ok());
    const nodo = await montar(<FormularioInstitucion guardar={guardar} />);
    const campo = fila(nodo, ti.nombre);
    expect(enGrupo(campo)).toBe(true);
    const crear = boton(nodo, ti.crear);
    expect(crear.getAttribute('aria-disabled')).toBe('true');
    expect(motivo(crear)).toContain(base.corregirCampos(1));
    await tocar(crear);
    expect(guardar).not.toHaveBeenCalled();
    expect(campo.hasAttribute('data-error')).toBe(true);
    expect(document.activeElement).toBe(campo.querySelector('input'));
    await userEvent.type(campo.querySelector('input') as HTMLInputElement, 'Davivienda');
    expect(boton(nodo, ti.crear).getAttribute('aria-disabled')).toBeNull();
  });

  it('PRU-CMP-AJUS-946 [C-45, FT-74] con un solo factor, la hoja de quitar ofrece «Agregar» y «Volver» como enlaces sin subrayado (C-33)', async () => {
    const nodo = await montar(
      <FormularioQuitarFactor
        accion={vi.fn(() => ok())}
        factorId="f1"
        nombre="Autenticador"
        alta="Alta 01/02/2027"
        quedan={[]}
        esUnico
      />,
    );
    expect(nodo.querySelectorAll('a').length).toBe(2);
    expect(subrayados(nodo)).toEqual([]);
    expect(nodo.textContent).toContain(ts.agregar);
  });
});

describe('PRU-CMP-ACCESO factor de respaldo con los campos v3', () => {
  it('PRU-CMP-ACCESO-940 [C-45, FT-02] CA-K3-13: el nombre del factor de respaldo va en un grupo; vacío, «Seguir» se ve apagado con el motivo y al tocarlo marca «Escribí un nombre para el factor.» en la fila con el foco; después queda como fila de solo lectura', async () => {
    const iniciar = vi.fn(() =>
      ok({ factorId: 'f-1', qrSvg: '<svg xmlns="http://www.w3.org/2000/svg"/>', secreto: 'ABCD' }),
    );
    const nodo = await montar(
      <InscribirFactor
        iniciar={iniciar}
        completar={vi.fn(() => ok())}
        nombre="Respaldo"
        esRespaldo
        destino="/ajustes/seguridad"
        rutaIngresar="/ingresar"
        nombresUsados={['Autenticador']}
      />,
    );
    const campo = fila(nodo, ingreso.nombreDelFactor);
    expect(enGrupo(campo)).toBe(true);
    const entrada = campo.querySelector('input') as HTMLInputElement;
    await userEvent.clear(entrada);
    const seguir = boton(nodo, ingreso.seguir);
    expect(seguir.getAttribute('aria-disabled')).toBe('true');
    expect(motivo(seguir)).toContain(base.corregirCampos(1));
    await tocar(seguir);
    expect(iniciar).not.toHaveBeenCalled();
    expect(campo.textContent).toContain(ingreso.escribiNombre);
    expect(document.activeElement).toBe(entrada);
    await userEvent.type(entrada, 'Mi gestor');
    await tocar(boton(nodo, ingreso.seguir));
    await vi.waitFor(() => {
      expect(iniciar).toHaveBeenCalled();
    });
    const fijo = nodo.querySelector('[data-dato-fijo]');
    expect(fijo?.textContent).toContain('Mi gestor');
    expect(fijo?.textContent).toContain(base.soloLectura);
    expect(enGrupo(fijo as Element)).toBe(true);
  });
});

describe('PRU-CMP-BAND reglas con los campos v3', () => {
  it('PRU-CMP-BAND-940 [C-45, FT-39] CA-K3-5 y CA-K3-13: la regla nueva lleva el comercio y la categoría en un grupo, la categoría en la lista propia con sus grupos; vacía, «Guardar» dice «Corregí 2 campos para guardar.», no envía y el foco va al comercio', async () => {
    const nodo = await montar(<FormularioReglaNueva grupos={GRUPOS} />);
    const patron = fila(nodo, tr.patron);
    const categoria = fila(nodo, tr.categoria);
    expect(enGrupo(patron) && enGrupo(categoria)).toBe(true);
    const g = boton(nodo, tr.guardar);
    expect(g.getAttribute('aria-disabled')).toBe('true');
    expect(motivo(g)).toContain(base.corregirCampos(2));
    await tocar(g);
    expect(gestionarRegla).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(patron.querySelector('input'));
    expect(categoria.hasAttribute('data-error')).toBe(true);
    await userEvent.click(disparador(categoria) as HTMLElement);
    const panel = nodo.querySelector('[role=listbox]') as HTMLElement;
    expect(panel.textContent).toContain('Comida');
    expect(panel.textContent).toContain('Casa');
    expect(panel.querySelectorAll('[role=option]').length).toBe(4);
  });

  it('PRU-CMP-BAND-941 [C-45, FT-39] CA-K3-13: editar una regla sin cambios tiene «Guardar» apagado con «Todavía no cambiaste nada.» y al tocarlo no envía', async () => {
    const nodo = await montar(
      <FormularioReglaRegla
        regla={{
          id: 'r1',
          patron: 'PUMA',
          categoriaId: 'c1',
          categoriaNombre: 'Súper',
          categoriaArchivada: false,
          coincideCon: [],
          usos: 0,
        }}
        grupos={GRUPOS}
      />,
    );
    expect(enGrupo(fila(nodo, tr.patron))).toBe(true);
    const g = boton(nodo, tr.guardar);
    expect(g.getAttribute('aria-disabled')).toBe('true');
    expect(motivo(g)).toContain(tr.sinCambios);
    await tocar(g);
    expect(gestionarRegla).not.toHaveBeenCalled();
  });
});

describe('PRU-CMP-TX filtros de Actividad con los campos v3', () => {
  const CUENTAS = [
    { id: 'k1', nombre: 'Cuenta BAC' },
    { id: 'k2', nombre: 'Visa Oro' },
    { id: 'k3', nombre: 'Efectivo' },
  ];
  /** La columna de computadora se ve desde 996 px de contenedor. */
  const filtros = (f: Record<string, string> = {}, cuentas = CUENTAS) =>
    montar(
      <div style={{ containerType: 'inline-size', width: 1100 }}>
        <FormularioFiltros filtros={f} cuentas={cuentas} grupos={GRUPOS} />
      </div>,
    );
  const oculto = (nodo: HTMLElement, nombre: string) =>
    nodo.querySelector<HTMLInputElement>(`input[type=hidden][name="${nombre}"]`);

  it('PRU-CMP-TX-940 [C-45, FT-24] CA-K3-5: «Estado bancario», «Origen» y «Categoría» son la lista propia, sin select; la categoría abre con sus grupos y la elegida con check, flechas e Intro eligen, Escape cierra y el foco vuelve; el valor viaja en el formulario', async () => {
    const nodo = await filtros({ categoria: 'c1', estado: 'pendiente' });
    expect(nodo.querySelector('select')).toBeNull();
    for (const r of [ta.estadoBancario, ta.origen, ta.categoria, ta.tipo, ta.cuenta])
      expect(disparador(fila(nodo, r))).not.toBeNull();
    expect(oculto(nodo, 'estado')?.value).toBe('pendiente');
    const d = disparador(fila(nodo, ta.categoria)) as HTMLButtonElement;
    d.focus();
    await userEvent.keyboard('{Enter}');
    const panel = nodo.querySelector('[role=listbox]') as HTMLElement;
    expect(panel.textContent).toContain('Comida');
    const elegida = panel.querySelector('[aria-selected=true]');
    expect(elegida?.textContent).toContain('Súper');
    expect(elegida?.querySelector('svg')).not.toBeNull();
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{Enter}');
    expect(oculto(nodo, 'categoria')?.value).toBe('c2');
    expect(document.activeElement).toBe(d);
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard('{Escape}');
    expect(nodo.querySelector('[role=listbox]')).toBeNull();
    expect(document.activeElement).toBe(d);
    expect(oculto(nodo, 'categoria')?.value).toBe('c2');
  });

  it('PRU-CMP-TX-941 [C-45, FT-24] CA-K3-6: con dos cuentas, «Cuenta» muestra «Todas» y las dos como segmentado, sin lista, y la elegida viaja en el formulario', async () => {
    const nodo = await filtros({}, CUENTAS.slice(0, 2));
    const f = fila(nodo, ta.cuenta);
    expect(disparador(f)).toBeNull();
    const radios = [...(segmentado(f)?.querySelectorAll<HTMLElement>('[role=radio]') ?? [])];
    expect(radios.map((r) => r.textContent)).toEqual([ta.todas, 'Cuenta BAC', 'Visa Oro']);
    await act(async () => {
      radios[2]?.click();
      await Promise.resolve();
    });
    expect(oculto(nodo, 'cuenta')?.value).toBe('k2');
  });

  it('PRU-CMP-TX-942 [C-45, FT-24] CA-K3-3: Desde, Hasta y los dos montos van en un grupo de una columna sin «Opcional»; el monto pone «$» y comas y viaja sin comas', async () => {
    const nodo = await filtros({ 'monto-desde': '1500' });
    const filas = [ta.desde, ta.hasta, ta.montoDesde, ta.montoHasta].map((r) => fila(nodo, r));
    const grupo = filas[0]?.closest('.grupo-campos');
    expect(filas.every((f) => f.closest('.grupo-campos') === grupo)).toBe(true);
    expect(filas.some((f) => f.textContent.includes(base.opcional))).toBe(false);
    const izquierdas = new Set(filas.map((f) => Math.round(f.getBoundingClientRect().left)));
    expect(izquierdas.size).toBe(1);
    const monto = filas[2]?.querySelector('input') as HTMLInputElement;
    expect(filas[2]?.querySelector('.campo-afijo')?.textContent).toBe(base.moneda);
    expect(monto.value).toBe('1,500');
    await userEvent.clear(monto);
    await userEvent.type(monto, '2500.5');
    expect(monto.value).toBe('2,500.5');
    expect(oculto(nodo, 'monto-desde')?.value).toBe('2500.5');
    expect(monto.name).toBe('');
  });
});
