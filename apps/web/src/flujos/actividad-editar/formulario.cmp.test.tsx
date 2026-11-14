// FT-25 Editar una transacción (07 §17: un texto o un estado es una CMP). El formulario conserva el lugar de los campos mientras cargan,
// muestra los de una cuenta archivada con los bloqueados en «Solo lectura» y pide confirmar con los dos textos de AV-16 (E3-15). Los
// montos y los rechazos los pone el servidor (PF-3).
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import '../../app/globals.css';
import type { AccionEscritura } from '../../formularios/use-operacion';
import { registrarGasto as g } from '../../textos/registrar-gasto';
import { transaccion as t } from '../../textos/transaccion';
import { parteVacia, type Parte } from '../registrar-gasto/campos';
import type { Campos } from './campos';
import { FormularioActividadEditar, type PropsFormularioActividadEditar } from './formulario';

// `next/link` y `next/navigation` necesitan `process` y el enrutador de Next: se simulan (el enrutado se prueba en E2E).
const replace = vi.fn();
vi.mock('next/navigation', () => ({ usePathname: () => '/', useRouter: () => ({ replace }) }));
vi.mock('next/link', async () => {
  const { createElement } = await import('react');
  const Enlace = ({ href, children, ...resto }: { href: string; children?: ReactNode }) =>
    createElement('a', { href, ...resto }, children);
  return Object.assign(Enlace, { default: Enlace, useLinkStatus: () => ({ pending: false }) });
});

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const montados: { raiz: Root; nodo: HTMLElement }[] = [];
afterEach(() => {
  for (const { raiz, nodo } of montados.splice(0)) {
    act(() => {
      raiz.unmount();
    });
    nodo.remove();
  }
  replace.mockClear();
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

const CUENTA = '11111111-1111-4111-8111-111111111111';
const CATEGORIA = '22222222-2222-4222-8222-222222222222';
const OTRA = '33333333-3333-4333-8333-333333333333';
const LUZ = '44444444-4444-4444-8444-444444444444';
const REST = '55555555-5555-4555-8555-555555555555';
const CARLOS = '66666666-6666-4666-8666-666666666666';
const inicial: Campos = {
  cuentaId: CUENTA,
  fecha: '2027-02-20',
  total: '30.00',
  comercio: 'PRICESMART',
  nota: '',
  tipo: 'gasto',
  lineas: [{ ...parteVacia(), monto: '30.00', categoriaId: CATEGORIA }],
};
const base: Omit<PropsFormularioActividadEditar, 'accion'> = {
  transaccionId: 't1',
  inicial,
  cuentas: [{ id: CUENTA, nombre: 'Visa Oro', tipo: 'tarjeta', detalle: 'Deuda $642.18' }],
  // Con 4 categorías o más, la categoría es una lista (con 3 o menos, segmentado: CA-K3-6)
  categorias: [
    { id: CATEGORIA, nombre: 'Supermercado', grupo: 'Casa', disponible: '$62.85', negativo: false },
    { id: OTRA, nombre: 'Farmacia', grupo: 'Casa', disponible: '$27.65', negativo: false },
    { id: LUZ, nombre: 'Luz y agua', grupo: 'Casa', disponible: '$6.60', negativo: false },
    { id: REST, nombre: 'Restaurantes', grupo: 'Fuera', disponible: '−$26.30', negativo: true },
  ],
  deudores: [{ id: CARLOS, nombre: 'Carlos' }],
  sinCuenta: false,
  soloEtiquetas: false,
  detalle: '/actividad/t1',
};

const ok = (valor: unknown = {}) =>
  Promise.resolve({ ok: true as const, valor, yaAplicada: false, avisos: [] });
const guardar = (): HTMLButtonElement => {
  const b = [...document.querySelectorAll('button')].find((x) => x.textContent === t.guardar);
  if (b === undefined) throw new Error('no hay un botón «Guardar cambios»');
  return b;
};
const campo = (nodo: HTMLElement, nombre: string): HTMLInputElement => {
  const c = nodo.querySelector<HTMLInputElement>(`input[name="${nombre}"]`);
  if (c === null) throw new Error(`no hay un campo «${nombre}»`);
  return c;
};
const pideConfirmar = Promise.resolve({
  ok: false as const,
  error: {
    categoria: 'REQUIERE_CONFIRMACION' as const,
    codigo: 'requiere_confirmacion',
    mensaje: 'Confirmá.',
    previsualizacion: vistaConAv16(),
  },
});
function vistaConAv16() {
  return {
    revisionVista: 'r1',
    huellaImpacto: 'h1',
    impacto: { deltaLpa: 3000, deltaDisponible: [{ categoriaId: CATEGORIA, delta: 2000 }] },
    nombres: { [CATEGORIA]: 'Supermercado' },
    avisos: [{ codigo: 'AV-16' }],
  };
}

describe('PRU-CMP-TX editar una transacción', () => {
  it('PRU-CMP-TX-733 [CA-25.5] con la cuenta archivada se ven los campos con Cuenta, Fecha y Total en solo lectura y mientras cargan hay un esqueleto con «Guardar cambios» deshabilitado', async () => {
    const accion = vi.fn<AccionEscritura>(() => ok());
    const nodo = await montar(
      <FormularioActividadEditar
        {...base}
        soloEtiquetas
        motivoCuenta="Cuenta vieja está archivada. Desarchivala para registrar o cambiar movimientos."
        accion={accion}
      />,
    );
    // Al montar, los campos todavía no llegaron: el lugar está reservado y no se puede guardar
    expect(nodo.querySelector('[data-cargando-campos]')).not.toBeNull();
    expect(guardar().disabled).toBe(true);
    expect(document.body.textContent).toContain(t.cargandoCampos);

    await vi.waitFor(() => {
      expect(nodo.querySelector('input[name="fecha"]')).not.toBeNull();
    });
    expect(nodo.querySelector('[data-cargando-campos]')).toBeNull();
    expect(campo(nodo, 'fecha').disabled).toBe(true);
    expect(campo(nodo, 'total').disabled).toBe(true);
    expect(nodo.querySelector('[data-dato-fijo="cuenta"]')?.textContent).toContain(t.soloLectura);
    expect(campo(nodo, 'comercio').disabled).toBe(false);
    await vi.waitFor(() => {
      expect(guardar().disabled).toBe(false);
    });
  });

  it('PRU-CMP-TX-734 [CA-25.4] AV-16 pide la confirmación con la advertencia si cambia la fecha', async () => {
    const accion = vi.fn<AccionEscritura>(() => pideConfirmar);
    const nodo = await montar(<FormularioActividadEditar {...base} accion={accion} />);
    await vi.waitFor(() => {
      expect(nodo.querySelector('input[name="fecha"]')).not.toBeNull();
    });
    await userEvent.fill(campo(nodo, 'fecha'), '21/02/2027');
    await userEvent.click(guardar());
    await vi.waitFor(() => {
      expect(document.body.textContent).toContain(t.conciliadaAdvertencia('Visa Oro', 'la fecha'));
    });
    expect(document.body.textContent).not.toContain('Sigue conciliada');
  });

  it('PRU-CMP-TX-735 [CA-25.4] cambiar solo el comercio muestra AV-16 de información: la conciliación no se toca', async () => {
    const accion = vi.fn<AccionEscritura>(() => pideConfirmar);
    const nodo = await montar(<FormularioActividadEditar {...base} accion={accion} />);
    await vi.waitFor(() => {
      expect(nodo.querySelector('input[name="comercio"]')).not.toBeNull();
    });
    await userEvent.fill(campo(nodo, 'comercio'), 'COSTCO');
    await userEvent.click(guardar());
    await vi.waitFor(() => {
      expect(document.body.textContent).toContain(t.conciliadaInformacion('Visa Oro'));
    });
    expect(document.body.textContent).not.toContain('Está conciliada. Al guardar');
  });

  it('PRU-CMP-TX-736 [CA-25.4] un rechazo del servidor deja «Guardar cambios» deshabilitado con su motivo hasta que se corrige lo escrito', async () => {
    const accion = vi.fn<AccionEscritura>(() =>
      Promise.resolve({
        ok: false as const,
        error: {
          categoria: 'DOMINIO' as const,
          codigo: 'suma_lineas_distinta',
          mensaje: 'Las partes no suman el total.',
        },
      }),
    );
    const nodo = await montar(<FormularioActividadEditar {...base} accion={accion} />);
    await vi.waitFor(() => {
      expect(nodo.querySelector('input[name="comercio"]')).not.toBeNull();
    });
    await userEvent.fill(campo(nodo, 'comercio'), 'COSTCO');
    await userEvent.click(guardar());
    await vi.waitFor(() => {
      expect(guardar().disabled).toBe(true);
    });
    expect(document.body.textContent).toContain(t.corregiParaGuardar);
    await userEvent.fill(campo(nodo, 'comercio'), 'COSTCO 2');
    await vi.waitFor(() => {
      expect(guardar().disabled).toBe(false);
    });
  });
});

/** La transacción de CA-R-13: Supermercado $96.10, Farmacia $22.50 y Carlos $30.00, cada parte con su línea. */
const parte = (lineaId: string, monto: string, destino: Partial<Parte>): Parte =>
  ({ ...parteVacia(), lineaId, monto, ...destino }) as Parte;
const dividida: Campos = {
  ...inicial,
  total: '148.60',
  lineas: [
    parte('l1', '96.10', { categoriaId: CATEGORIA }),
    parte('l2', '22.50', { categoriaId: OTRA }),
    parte('l3', '30.00', { destino: 'por_cobrar', deudorId: CARLOS }),
  ],
};
const MOTIVO_E3_16 = 'Esa parte tiene cobros o devoluciones; no puede cambiar de destino.';
const etiquetado = (nombre: string): HTMLInputElement => {
  const el = document.querySelector<HTMLInputElement>(`[aria-label="${nombre}"]`);
  if (el === null) throw new Error(`no hay un control «${nombre}»`);
  return el;
};
const radio = (grupo: string, texto: string): HTMLElement => {
  const r = [
    ...document.querySelectorAll<HTMLElement>(
      `[role="radiogroup"][aria-label="${grupo}"] [role="radio"]`,
    ),
  ].find((x) => x.textContent.trim() === texto);
  if (r === undefined) throw new Error(`no hay «${texto}» en «${grupo}»`);
  return r;
};
const motivo = () =>
  document.getElementById(guardar().getAttribute('aria-describedby') ?? '')?.textContent;
async function escribir(el: HTMLInputElement, texto: string): Promise<void> {
  await userEvent.clear(el);
  await userEvent.type(el, texto);
}
async function montarDividida(accion: AccionEscritura): Promise<HTMLElement> {
  const nodo = await montar(
    <FormularioActividadEditar
      {...base}
      inicial={dividida}
      bloqueo={{ lineas: ['l2', 'l3'], motivo: MOTIVO_E3_16 }}
      accion={accion}
    />,
  );
  await vi.waitFor(() => {
    expect(document.querySelector(`[aria-label="${g.cuantasCategorias}"]`)).not.toBeNull();
  });
  return nodo;
}

describe('PRU-CMP-TX editar una transacción con los campos v3', () => {
  it('PRU-CMP-TX-880 [C-49, C-45] CA-R-13: Supermercado $96.10, Farmacia $22.50 y Carlos $30.00 abren con «Varias» en Montos y esos montos, sin «Lo que queda», en una columna de 720 con «Guardar cambios»; las partes con eventos no cambian de destino ni se quitan (E3-16) y cada parte viaja con su línea', async () => {
    const accion = vi.fn<AccionEscritura>(() => ok());
    const nodo = await montarDividida(accion);
    expect(document.querySelector('h1')?.textContent).toBe(t.editarGasto);
    // C-30: una columna de 720, no las dos de Registrar gasto
    expect(document.querySelector('[data-pagina-flujo]')?.className).not.toContain(
      '--ancho-pantalla:none',
    );
    expect(nodo.querySelector<HTMLInputElement>('.campo-billete input')?.value).toBe('148.60');
    expect(radio(g.cuantasCategorias, g.varias).getAttribute('aria-checked')).toBe('true');
    expect(radio(g.comoRepartir, g.montos).getAttribute('aria-checked')).toBe('true');
    expect(etiquetado(g.montoPara('Supermercado')).value).toBe('96.10');
    expect(etiquetado(g.montoPara('Farmacia')).value).toBe('22.50');
    expect(document.body.textContent).not.toContain(g.loQueQueda);
    expect(etiquetado(g.tuParte).value).toBe('118.60');
    expect(etiquetado(g.montoDe('Carlos')).value).toBe('30.00');
    expect(guardar().textContent).toBe(t.guardar);
    // E3-16: Farmacia no cambia de categoría y Carlos no se quita
    const farmacia = etiquetado(g.montoPara('Farmacia')).closest('.campo-fila');
    expect(farmacia?.querySelector<HTMLButtonElement>('[aria-haspopup="listbox"]')?.disabled).toBe(
      true,
    );
    expect(farmacia?.textContent).toContain(MOTIVO_E3_16);
    expect(document.querySelector(`[aria-label="${g.quitarA('Carlos')}"]`)).toBeNull();
    expect(document.querySelector(`[role="img"][aria-label="${MOTIVO_E3_16}"]`)).not.toBeNull();
    await userEvent.click(
      [...document.querySelectorAll<HTMLElement>('[role="checkbox"]')].find((x) =>
        x.textContent.includes('Carlos'),
      ) as HTMLElement,
    );
    expect(etiquetado(g.montoDe('Carlos')).value).toBe('30.00');
    // Repartir distinto entre las categorías: cada parte viaja con su línea (OP-28, CB-03)
    await escribir(etiquetado(g.montoPara('Supermercado')), '86.10');
    await escribir(etiquetado(g.montoPara('Farmacia')), '32.50');
    await userEvent.click(guardar());
    await vi.waitFor(() => {
      expect(accion).toHaveBeenCalledTimes(1);
    });
    expect(accion.mock.calls[0]?.[0]).toMatchObject({
      lineas: [
        { lineaId: 'l1', monto: '86.10', destino: { categoriaId: CATEGORIA } },
        { lineaId: 'l2', monto: '32.50', destino: { categoriaId: OTRA } },
        { lineaId: 'l3', monto: '30.00', destino: { deudorId: CARLOS } },
      ],
    });
  });

  it('PRU-CMP-TX-881 [C-49, C-45] CA-K3-13 al editar: las categorías que pasan tu parte se marcan en el momento, «Guardar cambios» queda apagado con el motivo de C-49 y tocarlo no envía; una transacción que no es gasto no tiene las secciones', async () => {
    const accion = vi.fn<AccionEscritura>(() => ok());
    await montarDividida(accion);
    await escribir(etiquetado(g.montoPara('Farmacia')), '30');
    expect(document.body.textContent).toContain(g.categoriasPasan(true, '$7.50'));
    expect(guardar().getAttribute('aria-disabled')).toBe('true');
    expect(motivo()).toBe(g.motivoCategorias(true));
    await userEvent.click(guardar(), { force: true });
    expect(accion).not.toHaveBeenCalled();

    for (const { raiz, nodo } of montados.splice(0)) {
      act(() => {
        raiz.unmount();
      });
      nodo.remove();
    }
    const ingreso = await montar(
      <FormularioActividadEditar
        {...base}
        inicial={{ ...inicial, tipo: 'ingreso', lineas: [] }}
        accion={accion}
      />,
    );
    await vi.waitFor(() => {
      expect(ingreso.querySelector('.campo-billete input[name="total"]')).not.toBeNull();
    });
    expect(document.querySelector('h1')?.textContent).toBe(t.editarTitulo);
    expect(ingreso.querySelector(`[aria-label="${g.cuantasCategorias}"]`)).toBeNull();
    expect(ingreso.querySelector('.grupo-campos input[name="fecha"]')).not.toBeNull();
    expect(ingreso.querySelector('.grupo-campos input[name="comercio"]')).not.toBeNull();
  });
});
