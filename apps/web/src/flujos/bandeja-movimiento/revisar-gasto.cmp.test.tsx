// Revisar movimiento de un gasto con «¿Quién paga?» y «¿En qué categorías?» de Registrar gasto (C-49; 07 §17: un estado de un
// componente es una CMP). Lo que importa es lo que viaja a OP-36 antes de aprobar: una línea por categoría y una por persona, con
// `deudorId` o `deudorNuevo`. Las acciones son del servidor: se simulan, y la suma la sigue validando él (PF-3).
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import type { Centavos, FechaLocal } from '@finn/dominio/valores';
import '../../app/globals.css';
import { aprobarMovimiento, editarMovimiento } from '../../servidor/acciones/bandeja';
import { base } from '../../textos/base';
import { bandeja as b } from '../../textos/bandeja';
import { registrarGasto as t } from '../../textos/registrar-gasto';
import { FormularioMovimiento, type PropsFormularioMovimiento } from './formulario';

vi.mock('next/navigation', () => ({
  usePathname: () => '/bandeja/m1',
  useRouter: () => ({ replace: vi.fn(), back: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock('next/link', async () => {
  const { createElement } = await import('react');
  const Enlace = ({ href, children, ...resto }: { href: string; children?: ReactNode }) =>
    createElement('a', { href, ...resto }, children);
  return Object.assign(Enlace, { default: Enlace, useLinkStatus: () => ({ pending: false }) });
});
vi.mock('../../servidor/acciones/bandeja', () => ({
  editarMovimiento: vi.fn(),
  aprobarMovimiento: vi.fn(),
  crearAMano: vi.fn(),
  resolverCoincidencia: vi.fn(),
  descartarMovimiento: vi.fn(),
  reprocesarSms: vi.fn(),
  aprobarTodos: vi.fn(),
  gestionarRegla: vi.fn(),
}));
vi.mock('../../servidor/lecturas/interactivas', () => ({ buscarComprasDevolucion: vi.fn() }));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const montados: { raiz: Root; nodo: HTMLElement }[] = [];
afterEach(() => {
  for (const { raiz, nodo } of montados.splice(0)) {
    act(() => {
      raiz.unmount();
    });
    nodo.remove();
  }
  vi.mocked(editarMovimiento).mockReset();
  vi.mocked(aprobarMovimiento).mockReset();
});

const VISA = '00000000-0000-4000-8000-0000000000a1';
const AHORRO = '00000000-0000-4000-8000-0000000000a2';
const SUPER = '00000000-0000-4000-8000-0000000000b1';
const FARMACIA = '00000000-0000-4000-8000-0000000000b2';
const LUZ = '00000000-0000-4000-8000-0000000000b3';
const REST = '00000000-0000-4000-8000-0000000000b4';
const CARLOS = '00000000-0000-4000-8000-0000000000c1';

const categoria = (id: string, nombre: string) => ({
  id,
  nombre,
  grupo: 'Casa',
  disponible: '$62.85',
  negativo: false,
});
const PROPS: PropsFormularioMovimiento = {
  movimiento: {
    id: 'm1',
    estado: 'pendiente',
    sms: 'BAC: Compra SUPER SELECTOS ESCALON por USD 60.00 con tarjeta Visa Oro',
    esperado: {
      cuentaId: VISA,
      fecha: '2027-02-20',
      monto: 6000,
      comercio: 'SUPER SELECTOS ESCALON',
      tipoPropuesto: 'gasto',
      nota: null,
      lineas: [],
    },
    resumen: {
      vista: 'listo',
      comercio: 'SUPER SELECTOS ESCALON',
      monto: 6000 as Centavos,
      sale: true,
      cuenta: 'Visa Oro',
      fecha: '2027-02-20',
      sugerida: null,
    },
    nota: null,
  },
  traspaso: false,
  cuentas: [
    { id: VISA, nombre: 'Visa Oro', tipo: 'tarjeta', detalle: 'Deuda $642.18' },
    { id: AHORRO, nombre: 'Ahorro', tipo: 'efectivo', detalle: 'Saldo $900.00' },
  ],
  // Con 4 categorías la de «Una» es una lista (con 3 o menos, segmentado: CA-K3-6)
  categorias: [
    categoria(SUPER, 'Supermercado'),
    categoria(FARMACIA, 'Farmacia'),
    categoria(LUZ, 'Luz y agua'),
    categoria(REST, 'Restaurantes'),
  ],
  deudores: [{ id: CARLOS, nombre: 'Carlos' }],
  hoy: '2027-02-20' as FechaLocal,
  candidatas: [],
};

async function montar(props: Partial<PropsFormularioMovimiento> = {}): Promise<HTMLElement> {
  document.body.style.cssText = 'background: var(--fondo); color: var(--texto)';
  const nodo = document.createElement('div');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  await act(() => {
    raiz.render(<FormularioMovimiento {...PROPS} {...props} />);
    return Promise.resolve();
  });
  montados.push({ raiz, nodo });
  // los campos se cargan aparte (05 §13.1)
  await vi.waitFor(() => {
    expect(document.querySelector(`[aria-label="${t.cuantasCategorias}"]`)).not.toBeNull();
  });
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
const etiquetado = (nombre: string): HTMLInputElement =>
  document.querySelector<HTMLInputElement>(`[aria-label="${nombre}"]`) as HTMLInputElement;
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
const aprobar = () =>
  todos<HTMLButtonElement>('button[type="submit"]').find((x) =>
    x.textContent.startsWith(b.revisar.aprobar),
  ) as HTMLButtonElement;
const motivo = () =>
  document.getElementById(aprobar().getAttribute('aria-describedby') ?? '')?.textContent;
/** Apagado (`aria-disabled`) sigue siendo tocable: Playwright lo toma por deshabilitado, así que se fuerza el clic. */
const tocarAprobar = () => userEvent.click(aprobar(), { force: true });
const ok = (valor: unknown) =>
  Promise.resolve({ ok: true as const, valor, yaAplicada: false, avisos: [] }) as never;
const editado = () =>
  vi.mocked(editarMovimiento).mock.calls.at(-1)?.[0] as { lineas?: unknown[] } | undefined;
function responder(): void {
  vi.mocked(editarMovimiento).mockImplementation(() =>
    ok({ movimientoId: 'm1', estado: 'pendiente' }),
  );
  vi.mocked(aprobarMovimiento).mockImplementation(() => ok({ transaccionId: 't1' }));
}

describe('PRU-CMP-BAND revisar un gasto con las secciones de Registrar gasto', () => {
  it('PRU-CMP-BAND-942 [FT-35, C-49] un gasto muestra «¿Quién paga?» con «Solo yo» y «¿En qué categorías?» con «Una» en lugar de las líneas compactas; la sugerencia llena la categoría y «Aprobar $60.00» la envía en una línea', async () => {
    responder();
    await montar({ movimiento: { ...PROPS.movimiento, sugeridaId: SUPER } });
    expect(conTexto('h2', t.quienPaga)).toBeTruthy();
    expect(conTexto('h2', t.enQueCategorias)).toBeTruthy();
    expect(tarjeta(t.soloYo).checked).toBe(true);
    expect(radio(t.cuantasCategorias, t.una).getAttribute('aria-checked')).toBe('true');
    expect(document.querySelector('[data-parte]')).toBeNull();
    expect(document.body.textContent).not.toContain(t.agregarLinea);
    expect(disparadores()[0]?.textContent).toContain('Supermercado');
    expect(aprobar().textContent).toBe(b.revisar.aprobarMonto('$60.00'));
    expect(aprobar().getAttribute('aria-disabled')).not.toBe('true');
    await tocarAprobar();
    await vi.waitFor(() => {
      expect(aprobarMovimiento).toHaveBeenCalled();
    });
    expect(editado()?.lineas).toEqual([{ monto: '60.00', destino: { categoriaId: SUPER } }]);
  });

  it('PRU-CMP-BAND-943 [FT-35, C-45, C-49] «Con alguien» con Carlos y una persona nueva en partes iguales envía la línea de tu parte y una por cobrar por cada uno, la nueva como deudor nuevo', async () => {
    responder();
    await montar({ movimiento: { ...PROPS.movimiento, sugeridaId: SUPER } });
    await userEvent.click(tarjeta(t.conAlguien));
    await userEvent.click(chip('Carlos'));
    expect(radio(t.comoRepartirPersonas, t.iguales).getAttribute('aria-checked')).toBe('true');
    await userEvent.click(conTexto('.eleccion-otra', base.otraPersona));
    await userEvent.keyboard('luis{Enter}');
    await vi.waitFor(() => {
      expect(chip('Luis').textContent).toContain(base.nueva);
    });
    expect(conTexto('h2', t.enQueCategoriasTuParte)).toBeTruthy();
    await tocarAprobar();
    await vi.waitFor(() => {
      expect(aprobarMovimiento).toHaveBeenCalled();
    });
    expect(editado()?.lineas).toEqual([
      { monto: '20.00', destino: { categoriaId: SUPER } },
      { monto: '20.00', destino: { deudorId: CARLOS } },
      { monto: '20.00', destino: { deudorNuevo: 'Luis' } },
    ]);
  });

  it('PRU-CMP-BAND-944 [FT-35, C-49] «Varias» con Supermercado como «Lo que queda» y Farmacia en 15.50 envía una línea por categoría', async () => {
    responder();
    await montar({ movimiento: { ...PROPS.movimiento, sugeridaId: SUPER } });
    await userEvent.click(radio(t.cuantasCategorias, t.varias));
    await userEvent.click(opcion('Farmacia'));
    await userEvent.type(etiquetado(t.montoPara('Farmacia')), '15.50');
    expect(etiquetado(t.montoPara('Supermercado')).value).toBe('44.50');
    await tocarAprobar();
    await vi.waitFor(() => {
      expect(aprobarMovimiento).toHaveBeenCalled();
    });
    expect(editado()?.lineas).toEqual([
      { monto: '44.50', destino: { categoriaId: SUPER } },
      { monto: '15.50', destino: { categoriaId: FARMACIA } },
    ]);
  });

  it('PRU-CMP-BAND-945 [FT-35, C-49] sin categoría «Aprobar» queda apagado (aria-disabled) con el motivo de C-49 §3; tocarlo no envía y marca la fila; «Con alguien» sin persona da su propio motivo', async () => {
    responder();
    await montar();
    expect(aprobar().getAttribute('aria-disabled')).toBe('true');
    expect(aprobar().hasAttribute('disabled')).toBe(false);
    expect(motivo()).toBe(t.motivoCategoria);
    await tocarAprobar();
    expect(editarMovimiento).not.toHaveBeenCalled();
    expect(aprobarMovimiento).not.toHaveBeenCalled();
    const fila = disparadores()[0]?.closest('.campo-fila');
    expect(fila?.hasAttribute('data-error')).toBe(true);
    expect(fila?.textContent).toContain(t.elegiCategoria);
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(disparadores()[0]);
    });
    await userEvent.click(disparadores()[0] as HTMLButtonElement);
    await userEvent.click(opcion('Restaurantes'));
    expect(aprobar().getAttribute('aria-disabled')).not.toBe('true');
    await userEvent.click(tarjeta(t.conAlguien));
    expect(aprobar().getAttribute('aria-disabled')).toBe('true');
    expect(motivo()).toBe(t.elegiConQuien);
  });
});
