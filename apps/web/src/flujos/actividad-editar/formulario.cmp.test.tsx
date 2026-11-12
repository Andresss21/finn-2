// FT-25 Editar una transacción (07 §17: un texto o un estado es una CMP). El formulario conserva el lugar de los campos mientras cargan,
// muestra los de una cuenta archivada con los bloqueados en «Solo lectura» y pide confirmar con los dos textos de AV-16 (E3-15). Los
// montos y los rechazos los pone el servidor (PF-3).
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import '../../app/globals.css';
import type { AccionEscritura } from '../../formularios/use-operacion';
import { transaccion as t } from '../../textos/transaccion';
import { parteVacia } from '../registrar-gasto/campos';
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
  categorias: [
    { id: CATEGORIA, nombre: 'Supermercado' },
    { id: OTRA, nombre: 'Farmacia' },
  ],
  deudores: [],
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
    expect(nodo.querySelector('[data-cuenta-fija]')?.textContent).toContain(t.soloLectura);
    expect(campo(nodo, 'comercio').disabled).toBe(false);
    expect(guardar().disabled).toBe(false);
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
