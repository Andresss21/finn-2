// Registrar gasto con los campos v3 (C-45 §4.8) y «¿En qué categorías?» (C-49): las dos secciones, los montos que propone la app,
// cuándo se marca cada error, el motivo de «Guardar» y las líneas que viajan a OP-20. Los CA-K3-n (PROMPT-CAMPOS §5) y CA-R-n
// (PROMPT-REPARTO §4) van en el texto del título. La acción y la sugerencia son del servidor: se simulan.
import axe from 'axe-core';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import type { FechaLocal } from '@finn/dominio/valores';
import '../../app/globals.css';
import { registrarGasto as accion } from '../../servidor/acciones/transacciones';
import { sugerencia } from '../../servidor/lecturas/interactivas';
import { base } from '../../textos/base';
import { registrarGasto as t } from '../../textos/registrar-gasto';
import { FormularioRegistrarGasto, type PropsFormularioRegistrarGasto } from './formulario';

vi.mock('next/navigation', () => ({
  usePathname: () => '/registrar/gasto',
  useRouter: () => ({ replace: vi.fn(), back: vi.fn(), push: vi.fn() }),
}));
vi.mock('next/link', async () => {
  const { createElement } = await import('react');
  const Enlace = ({ href, children, ...resto }: { href: string; children?: ReactNode }) =>
    createElement('a', { href, ...resto }, children);
  return Object.assign(Enlace, { default: Enlace, useLinkStatus: () => ({ pending: false }) });
});
vi.mock('../../servidor/acciones/transacciones', () => ({ registrarGasto: vi.fn() }));
vi.mock('../../servidor/lecturas/interactivas', () => ({ sugerencia: vi.fn() }));

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
  vi.mocked(accion).mockReset();
  vi.mocked(sugerencia).mockReset();
  delete document.documentElement.dataset['theme'];
});

const CUENTA = '00000000-0000-4000-8000-0000000000a1';
const SUPER = '00000000-0000-4000-8000-0000000000b1';
const FARMACIA = '00000000-0000-4000-8000-0000000000b2';
const LUZ = '00000000-0000-4000-8000-0000000000b3';
const NETFLIX = '00000000-0000-4000-8000-0000000000b4';
const REST = '00000000-0000-4000-8000-0000000000b5';
const CARLOS = '00000000-0000-4000-8000-0000000000c1';
const ANA = '00000000-0000-4000-8000-0000000000c2';

const categoria = (id: string, nombre: string, grupo: string, disponible: string) => ({
  id,
  nombre,
  grupo,
  disponible,
  negativo: disponible.startsWith('−'),
});
const PROPS: PropsFormularioRegistrarGasto = {
  hoy: '2026-10-15' as FechaLocal,
  // Con 4 cuentas la cuenta es una lista (con 3 o menos, segmentado: CA-K3-6)
  cuentas: [
    { id: CUENTA, nombre: 'Visa Oro', tipo: 'tarjeta', detalle: 'Deuda $642.18' },
    ...['Ahorro', 'Planilla', 'Efectivo'].map((nombre, i) => ({
      id: `00000000-0000-4000-8000-0000000000a${String(i + 2)}`,
      nombre,
      tipo: 'efectivo' as const,
      detalle: 'Saldo $100.00',
    })),
  ],
  categorias: [
    categoria(SUPER, 'Supermercado', 'Casa', '$62.85'),
    categoria(LUZ, 'Luz y agua', 'Casa', '$6.60'),
    categoria(FARMACIA, 'Farmacia', 'Casa', '$27.65'),
    categoria(REST, 'Restaurantes', 'Comida fuera', '−$26.30'),
    categoria(NETFLIX, 'Netflix', 'Suscripciones', '$15.49'),
  ],
  deudores: [
    { id: CARLOS, nombre: 'Carlos' },
    { id: ANA, nombre: 'Ana' },
  ],
  cuentaPropuesta: CUENTA,
};

async function montar(props: Partial<PropsFormularioRegistrarGasto> = {}): Promise<HTMLElement> {
  document.body.style.cssText = 'background: var(--fondo); color: var(--texto)';
  const nodo = document.createElement('div');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  await act(() => {
    raiz.render(<FormularioRegistrarGasto {...PROPS} {...props} />);
    return Promise.resolve();
  });
  montados.push({ raiz, nodo });
  return nodo;
}

const todos = <T extends Element>(selector: string): T[] => [
  ...document.querySelectorAll<T>(selector),
];
const conTexto = (selector: string, texto: string): HTMLElement => {
  const el = todos<HTMLElement>(selector).find((x) => x.textContent.trim() === texto);
  if (el === undefined) throw new Error(`no hay ${selector} con «${texto}»`);
  return el;
};
const etiquetado = (nombre: string): HTMLInputElement => {
  const el = document.querySelector<HTMLInputElement>(`[aria-label="${nombre}"]`);
  if (el === null) throw new Error(`no hay un control «${nombre}»`);
  return el;
};
const total = () =>
  document.querySelector<HTMLInputElement>('.campo-billete input') as HTMLInputElement;
const radio = (grupo: string, texto: string) =>
  conTexto(`[role="radiogroup"][aria-label="${grupo}"] [role="radio"]`, texto);
const tarjeta = (titulo: string) =>
  conTexto('.eleccion-titulo', titulo).closest('label')?.querySelector('input') as HTMLInputElement;
const chip = (nombre: string) =>
  todos<HTMLElement>('[role="checkbox"]').find((x) =>
    [...x.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && n.textContent === nombre),
  ) as HTMLElement;
const disparadores = () => todos<HTMLButtonElement>('button[aria-haspopup="listbox"]');
const opcion = (nombre: string) =>
  todos<HTMLElement>('[role="option"]').find(
    (o) => o.querySelector('.campo-opcion-nombre')?.textContent === nombre,
  ) as HTMLElement;
const resumenes = () => todos<HTMLElement>('.reparto-resumen').map((r) => r.textContent.trim());
const guardar = () =>
  todos<HTMLButtonElement>('button[type="submit"]').find((b) =>
    b.textContent.startsWith('Guardar'),
  ) as HTMLButtonElement;
const motivo = () =>
  document.getElementById(guardar().getAttribute('aria-describedby') ?? '')?.textContent;
const enviado = () => vi.mocked(accion).mock.calls.at(-1)?.[0] as { lineas: unknown[] } | undefined;
/** Apagado (`aria-disabled`) sigue siendo tocable: Playwright lo toma por deshabilitado, así que se fuerza el clic. */
const tocarGuardar = () => userEvent.click(guardar(), { force: true });
const ok = () =>
  vi
    .mocked(accion)
    .mockResolvedValue({ ok: true, valor: { id: 't1' }, yaAplicada: false, avisos: [] } as never);

async function escribir(el: HTMLInputElement, texto: string): Promise<void> {
  await userEvent.clear(el);
  if (texto !== '') await userEvent.type(el, texto);
}
async function elegirEn(disparador: HTMLButtonElement, nombre: string): Promise<void> {
  if (disparador.getAttribute('aria-expanded') !== 'true') await userEvent.click(disparador);
  await userEvent.click(opcion(nombre));
}
/** Total, «Varias» con la primera categoría y la segunda con su monto: el punto de partida de varias pruebas. */
async function variasCon(totalTexto: string, primera: string, segunda: string, monto: string) {
  await escribir(total(), totalTexto);
  await elegirEn(disparadores()[1] as HTMLButtonElement, primera);
  await userEvent.click(radio(t.cuantasCategorias, t.varias));
  await userEvent.click(opcion(segunda));
  await escribir(etiquetado(t.montoPara(segunda)), monto);
}

describe('PRU-CMP-TX registrar gasto con los campos v3', () => {
  it('PRU-CMP-TX-863 [C-49] CA-R-1 y CA-R-14: abre con «Una» y una fila de categoría; con PRICESMART la sugerencia pone Supermercado con su Disponible; la lista dice Restaurantes en negativo; sin «Antes de guardar»; se envía 1 línea por el total', async () => {
    vi.mocked(sugerencia).mockResolvedValue({
      ok: true,
      valor: { sugerencia: { categoria: { id: SUPER, nombre: 'Supermercado' } } },
    } as never);
    ok();
    await montar();
    expect(radio(t.cuantasCategorias, t.una).getAttribute('aria-checked')).toBe('true');
    expect(disparadores()).toHaveLength(2); // Cuenta y Categoría
    await escribir(total(), '148.60');
    const comercio = todos<HTMLLabelElement>('label').find((l) =>
      l.textContent.startsWith(t.comercio),
    );
    await userEvent.type(comercio?.control as HTMLInputElement, 'PRICESMART');
    await vi.waitFor(() => {
      expect(disparadores()[1]?.textContent).toContain('Supermercado');
    }, 3000);
    expect(document.body.textContent).toContain(t.disponible('$62.85'));
    expect(document.querySelector('[data-testid="sugerencia"]')?.textContent).toBe(
      base.sueleIrA('Supermercado'),
    );
    await userEvent.click(disparadores()[1] as HTMLButtonElement);
    const negativo = opcion('Restaurantes').querySelector('.campo-detalle') as HTMLElement;
    expect(negativo.textContent).toBe(t.disponible('−$26.30'));
    expect(negativo.hasAttribute('data-negativo')).toBe(true);
    await userEvent.keyboard('{Escape}');
    expect(document.body.textContent).not.toContain('Antes de guardar');
    expect(guardar().textContent).toBe(t.guardarMonto('$148.60'));
    await tocarGuardar();
    await vi.waitFor(() => {
      expect(enviado()?.lineas).toEqual([{ monto: '148.60', destino: { categoriaId: SUPER } }]);
    });
  });

  it('PRU-CMP-TX-864 [C-49] CA-R-2 y CA-R-3: «Varias» deja Supermercado como «Lo que queda» y abre la lista de la segunda fila con Supermercado deshabilitado; con Farmacia en 52.50, Supermercado pasa a 96.10 solo y se envían 2 líneas', async () => {
    ok();
    await montar();
    await escribir(total(), '148.60');
    await elegirEn(disparadores()[1] as HTMLButtonElement, 'Supermercado');
    await userEvent.click(radio(t.cuantasCategorias, t.varias));
    expect(document.querySelector('[role="status"].sr-only')?.textContent).toBe(t.anuncioVarias);
    expect(etiquetado(t.montoPara('Supermercado')).value).toBe('148.60');
    expect(document.body.textContent).toContain(t.loQueQueda);
    expect(document.body.textContent).toContain(t.repartisElTotal('$148.60'));
    expect(radio(t.comoRepartir, t.montos).getAttribute('aria-checked')).toBe('true');
    // la segunda fila abre su lista: Supermercado está en otra fila
    const lista = document.querySelector('[role="listbox"]') as HTMLElement;
    expect(lista).not.toBeNull();
    expect(opcion('Supermercado').getAttribute('aria-disabled')).toBe('true');
    expect(opcion('Supermercado').textContent).toContain(t.yaEstaEnOtraFila);
    await userEvent.click(opcion('Farmacia'));
    await escribir(etiquetado(t.montoPara('Farmacia')), '52.50');
    expect(etiquetado(t.montoPara('Supermercado')).value).toBe('96.10');
    expect(resumenes()).toEqual([t.repartido('$148.60', '$148.60')]);
    // con dos filas no hay ×
    expect(document.querySelector(`[aria-label="${t.quitarCategoria('Farmacia')}"]`)).toBeNull();
    await tocarGuardar();
    await vi.waitFor(() => {
      expect(enviado()?.lineas).toEqual([
        { monto: '96.10', destino: { categoriaId: SUPER } },
        { monto: '52.50', destino: { categoriaId: FARMACIA } },
      ]);
    });
  });

  it('PRU-CMP-TX-865 [C-49] CA-R-4: con Supermercado escrito en 96.10 y Farmacia en 22.50, al salir dice «Falta repartir $30.00.», Guardar dice por qué y tocarlo no envía', async () => {
    await montar();
    await variasCon('148.60', 'Supermercado', 'Farmacia', '22.50');
    await escribir(etiquetado(t.montoPara('Supermercado')), '96.10');
    await userEvent.tab();
    expect(resumenes()).toEqual([t.faltaRepartirV3('$30.00')]);
    expect(document.querySelector('.reparto-resumen')?.getAttribute('data-estado')).toBe('error');
    expect(guardar().getAttribute('aria-disabled')).toBe('true');
    expect(guardar().hasAttribute('disabled')).toBe(false);
    expect(motivo()).toBe(t.motivoCategorias(false));
    await tocarGuardar();
    expect(accion).not.toHaveBeenCalled();
  });

  it('PRU-CMP-TX-866 [C-49] CA-R-5 y CA-R-6: tres categorías en partes iguales son $49.54, $49.53 y $49.53; porcentaje 60 y 20 dice «Suman 80 %. Falta repartir 20 % ($29.72).», 60 y 40 dan $89.16 y $59.44, y 120 se marca en el momento', async () => {
    await montar();
    await variasCon('148.60', 'Supermercado', 'Farmacia', '50');
    await userEvent.click(conTexto('.reparto-agregar button', t.agregarCategoria));
    expect(document.querySelector('[role="status"].sr-only')?.textContent).toBe(t.anuncioAgregada);
    await userEvent.click(opcion('Luz y agua'));
    await userEvent.click(radio(t.comoRepartir, t.iguales));
    expect(todos('.parte-fija').map((x) => x.textContent)).toEqual(['$49.54', '$49.53', '$49.53']);
    expect(etiquetado(t.quitarCategoria('Luz y agua'))).toBeTruthy();
    await userEvent.click(etiquetado(t.quitarCategoria('Luz y agua')));
    expect(todos('.parte-fija')).toHaveLength(2);
    expect(document.querySelector('[role="status"].sr-only')?.textContent).toBe(t.anuncioQuitada);
    await userEvent.click(radio(t.comoRepartir, t.porcentaje));
    expect(etiquetado(t.porcentajePara('Supermercado')).value).toBe('50');
    await escribir(etiquetado(t.porcentajePara('Supermercado')), '60');
    await escribir(etiquetado(t.porcentajePara('Farmacia')), '20');
    await userEvent.tab();
    expect(resumenes()).toEqual([t.faltaPct('80', '20', '$29.72')]);
    await escribir(etiquetado(t.porcentajePara('Farmacia')), '40');
    expect(todos('.parte-nota').map((x) => x.textContent)).toEqual(['$89.16', '$59.44']);
    expect(resumenes()).toEqual([t.repartido('$148.60', '$148.60')]);
    await escribir(etiquetado(t.porcentajePara('Farmacia')), '120');
    expect(resumenes()).toEqual([t.cadaParte]);
    expect(document.body.textContent).toContain(t.cadaParte);
  });

  it('PRU-CMP-TX-867 [C-45, C-49] CA-K3-9, CA-K3-10 y CA-K3-11: con Carlos y Ana en partes iguales de $1,236.40 las partes son $412.14, $412.13 y $412.13; 40/20/20 dice que faltan 20 % ($247.28); 600/400/300 pasa el total por $63.60 en el momento', async () => {
    await montar();
    await escribir(total(), '1236.40');
    await userEvent.click(tarjeta(t.conAlguien));
    await userEvent.click(chip('Carlos'));
    await userEvent.click(chip('Ana'));
    expect(radio(t.comoRepartirPersonas, t.iguales).getAttribute('aria-checked')).toBe('true');
    expect(todos('.parte-fija').map((x) => x.textContent)).toEqual([
      '$412.14',
      '$412.13',
      '$412.13',
    ]);
    expect(resumenes()).toEqual([t.repartido('$1,236.40', '$1,236.40')]);
    await userEvent.click(radio(t.comoRepartirPersonas, t.porcentaje));
    await escribir(etiquetado(t.tuPorcentaje), '40');
    await escribir(etiquetado(t.porcentajeDe('Carlos')), '20');
    await escribir(etiquetado(t.porcentajeDe('Ana')), '20');
    await userEvent.tab();
    expect(resumenes()[0]).toBe(t.faltaPct('80', '20', '$247.28'));
    // C-49 §3 manda en el motivo (CH-277): «Terminá de repartir el total.» en lugar de «Corregí 1 campo»
    expect(motivo()).toBe(t.motivoPartes);
    await escribir(etiquetado(t.porcentajeDe('Ana')), '120');
    expect(resumenes()[0]).toBe(t.cadaParte);
    await userEvent.click(radio(t.comoRepartirPersonas, t.montos));
    await escribir(etiquetado(t.tuParte), '600');
    await escribir(etiquetado(t.montoDe('Carlos')), '400');
    await escribir(etiquetado(t.montoDe('Ana')), '300');
    expect(resumenes()[0]).toBe(t.pasanElTotal('$63.60'));
  });

  it('PRU-CMP-TX-868 [C-45, C-49] CA-R-7, CA-R-8, CA-R-9 y CA-K3-16: con Carlos las categorías reparten tu parte; «Lo que queda» sigue a Vos y lo escrito no; con Carlos y Luis (nuevo) se envían 3 líneas y Luis va como deudor nuevo', async () => {
    ok();
    await montar();
    await escribir(total(), '148.60');
    await userEvent.click(tarjeta(t.conAlguien));
    await userEvent.click(chip('Carlos'));
    await userEvent.click(radio(t.comoRepartirPersonas, t.montos));
    await escribir(etiquetado(t.tuParte), '118.60');
    await escribir(etiquetado(t.montoDe('Carlos')), '30');
    expect(conTexto('h2', t.enQueCategoriasTuParte)).toBeTruthy();
    await elegirEn(disparadores()[1] as HTMLButtonElement, 'Supermercado');
    expect(document.body.textContent).toContain(t.tuParteEn('Supermercado'));
    await userEvent.click(radio(t.cuantasCategorias, t.varias));
    await userEvent.click(opcion('Farmacia'));
    await escribir(etiquetado(t.montoPara('Farmacia')), '22.50');
    expect(document.body.textContent).toContain(t.repartisTuParte('$118.60', 'Carlos'));
    expect(document.body.textContent).toContain(t.tuParteEn(t.nCategorias(2)));
    expect(resumenes()).toEqual([
      t.repartido('$148.60', '$148.60'),
      t.repartido('$118.60', '$118.60'),
    ]);
    // CA-R-8: Vos baja a 108.60 y Carlos sube a 40; «Lo que queda» se ajusta sola a $86.10
    await escribir(etiquetado(t.tuParte), '108.60');
    await escribir(etiquetado(t.montoDe('Carlos')), '40');
    expect(etiquetado(t.montoPara('Supermercado')).value).toBe('86.10');
    await escribir(etiquetado(t.montoPara('Supermercado')), '96.10');
    expect(resumenes()[1]).toBe(t.categoriasPasan(true, '$10.00'));
    // CA-R-9: Vos 110 y Carlos 30 no cierran el total
    await escribir(etiquetado(t.tuParte), '110');
    await escribir(etiquetado(t.montoDe('Carlos')), '30');
    await userEvent.tab();
    expect(resumenes()[0]).toBe(t.partesSuman('$140.00', '$148.60'));
    expect(motivo()).toBe(t.motivoPartes);
    // CA-K3-16: Carlos y Luis (nuevo), en partes iguales, con una categoría
    await userEvent.click(radio(t.cuantasCategorias, t.una));
    await userEvent.click(radio(t.comoRepartirPersonas, t.iguales));
    await userEvent.click(conTexto('.eleccion-otra', base.otraPersona));
    await userEvent.keyboard('luis{Enter}');
    await vi.waitFor(() => {
      expect(chip('Luis')?.textContent).toContain(base.nueva);
    });
    expect(document.body.textContent).toContain(t.nuevaDestino);
    await tocarGuardar();
    await vi.waitFor(() => {
      expect(enviado()?.lineas).toEqual([
        { monto: '49.54', destino: { categoriaId: SUPER } },
        { monto: '49.53', destino: { deudorId: CARLOS } },
        { monto: '49.53', destino: { deudorNuevo: 'Luis' } },
      ]);
    });
  });

  it('PRU-CMP-TX-869 [C-45, C-49] CA-K3-13, CA-R-10 y CA-R-12: Guardar no envía, marca los errores y lleva el foco al primero; una fila sin categoría muestra «Elegí una categoría.»; volver a «Una» deja la primera y lo anuncia', async () => {
    await montar();
    await tocarGuardar();
    expect(accion).not.toHaveBeenCalled();
    expect(guardar().getAttribute('aria-disabled')).toBe('true');
    expect(motivo()).toBe(base.corregirCampos(2));
    expect(document.body.textContent).toContain(base.montoMayorQueCero);
    expect(document.body.textContent).toContain(t.elegiCategoria);
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(total());
    });
    await escribir(total(), '148.60');
    await elegirEn(disparadores()[1] as HTMLButtonElement, 'Supermercado');
    await userEvent.click(radio(t.cuantasCategorias, t.varias));
    await userEvent.keyboard('{Escape}');
    await tocarGuardar();
    const segunda = disparadores()[2] as HTMLButtonElement;
    expect(segunda.closest('.campo-fila')?.hasAttribute('data-error')).toBe(true);
    expect(segunda.closest('.campo-fila')?.textContent).toContain(t.elegiCategoria);
    expect(motivo()).toBe(t.motivoFilas);
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(segunda);
    });
    expect(accion).not.toHaveBeenCalled();
    await userEvent.click(radio(t.cuantasCategorias, t.una));
    expect(disparadores()).toHaveLength(2);
    expect(disparadores()[1]?.textContent).toContain('Supermercado');
    expect(document.querySelector('[role="status"].sr-only')?.textContent).toBe(
      t.anuncioUna('Supermercado'),
    );
  });

  it('PRU-CMP-TX-870 [C-49] CA-R-11 y CA-R-15: con 16 personas y 4 categorías se llega a 20 partes; el rechazo `suma_lineas_distinta` queda junto al resumen sin perder lo escrito', async () => {
    const deudores = Array.from({ length: 16 }, (_, i) => ({
      id: `00000000-0000-4000-8000-0000000001${String(i).padStart(2, '0')}`,
      nombre: `Persona ${String.fromCharCode(65 + i)}`,
    }));
    vi.mocked(accion).mockResolvedValue({
      ok: false,
      error: {
        categoria: 'DOMINIO',
        codigo: 'suma_lineas_distinta',
        mensaje: 'Las partes suman $148.59 y el total es $148.60.',
      },
    } as never);
    await montar({ deudores });
    await variasCon('148.60', 'Supermercado', 'Farmacia', '50');
    await tocarGuardar();
    await vi.waitFor(() => {
      expect(document.body.textContent).toContain(
        'Las partes suman $148.59 y el total es $148.60.',
      );
    });
    expect(etiquetado(t.montoPara('Farmacia')).value).toBe('50.00');
    expect(motivo()).toBe('Las partes suman $148.59 y el total es $148.60.');
    await userEvent.click(conTexto('.reparto-agregar button', t.agregarCategoria));
    await userEvent.click(opcion('Luz y agua'));
    await userEvent.click(conTexto('.reparto-agregar button', t.agregarCategoria));
    await userEvent.click(opcion('Netflix'));
    await userEvent.click(tarjeta(t.conAlguien));
    for (const d of deudores) await userEvent.click(chip(d.nombre));
    expect(conTexto('.reparto-agregar button', t.agregarCategoria).hasAttribute('disabled')).toBe(
      true,
    );
    expect(conTexto('.eleccion-otra', base.otraPersona).hasAttribute('disabled')).toBe(true);
    expect(document.body.textContent).toContain(t.maximoLineas);
  });

  it('PRU-CMP-TX-871 [C-45, C-49] CA-R-16 y CA-K3-14: «Una · Varias» y los modos son radiogroup con nombre, la lista es un listbox con las usadas en aria-disabled, cada campo tiene su nombre, y axe no reporta violaciones en los dos temas', async () => {
    const nodo = await montar();
    await escribir(total(), '148.60');
    await userEvent.click(tarjeta(t.conAlguien));
    await userEvent.click(chip('Carlos'));
    await elegirEn(disparadores()[1] as HTMLButtonElement, 'Supermercado');
    await userEvent.click(radio(t.cuantasCategorias, t.varias));
    expect(
      document.querySelector('[role="listbox"]')?.getAttribute('aria-labelledby'),
    ).toBeTruthy();
    expect(opcion('Supermercado').getAttribute('aria-disabled')).toBe('true');
    await userEvent.click(opcion('Farmacia'));
    for (const nombre of [t.cuantasCategorias, t.comoRepartir, t.comoRepartirPersonas, t.quienPaga])
      expect(document.querySelector(`[role="radiogroup"][aria-label="${nombre}"]`)).not.toBeNull();
    expect(etiquetado(t.montoPara('Farmacia'))).toBeTruthy();
    expect(etiquetado(t.quitarA('Carlos'))).toBeTruthy();
    for (const tema of ['light', 'dark']) {
      document.documentElement.dataset['theme'] = tema;
      const r = await axe.run(nodo);
      expect(
        r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
      ).toEqual([]);
    }
  });
});
