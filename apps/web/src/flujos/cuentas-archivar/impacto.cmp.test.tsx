// CH-240 (E4-1, E2-13, E2-14, E2-15): archivar y eliminar una cuenta empiezan por el impacto, y verificar saldo de una tarjeta habla de
// deuda. El formulario solo dibuja lo que devuelve la previsualización y arma la entrada: los montos los pone el servidor (PF-3).
// Los formularios que importan Server Actions se prueban por sus piezas (la acción se inyecta).
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import type { Centavos } from '@finn/dominio/valores';
import '../../app/globals.css';
import { FormularioCuentasEliminar } from '../cuentas-eliminar/formulario';
import { FormularioVerificarSaldo } from '../cuentas-verificar-saldo/formulario';
import { FormularioCuentasArchivar } from './formulario';

const replace = vi.fn();
const volver = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ replace, back: volver }),
}));
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
  volver.mockClear();
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

const vista = (extra: Record<string, unknown> = {}) => ({
  revisionVista: 'r1',
  huellaImpacto: 'h1',
  impacto: { deltaLpa: 5000 },
  avisos: [],
  rechazos: [],
  ...extra,
});
const respuesta = (valor: unknown) =>
  Promise.resolve({ ok: true as const, valor, yaAplicada: false, avisos: [] });
const boton = (nodo: HTMLElement, texto: string): HTMLButtonElement | undefined =>
  [...nodo.querySelectorAll('button')].find((x) => x.textContent === texto);

const archivar = {
  cuentaId: 'c1',
  nombre: 'Visa Oro',
  esTarjeta: true,
  saldo: 0 as Centavos,
  deuda: 0 as Centavos,
  reservado: 0 as Centavos,
  bloqueos: [] as string[],
};

describe('PRU-CMP-CTA-741 archivar y eliminar una cuenta empiezan por el impacto', () => {
  it('PRU-CMP-CTA-741 [CA-E4-21] archivar una tarjeta previsualiza al abrir con «Devolverlas» elegida, trae la K4 en la misma pantalla con «Archivar Visa Oro» y vuelve a pedir el impacto al cambiar la decisión', async () => {
    const accion = vi.fn<(e: unknown) => ReturnType<typeof respuesta>>(() => respuesta(vista()));
    const nodo = await montar(<FormularioCuentasArchivar accion={accion} {...archivar} />);
    expect(accion).toHaveBeenCalledTimes(1);
    expect(accion.mock.calls[0]?.[0]).toMatchObject({
      modo: 'previsualizar',
      cuentaId: 'c1',
      devolverAsignacionesFuturas: true,
    });
    // La decisión y la K4 están juntas; el verbo del pie nombra la cuenta
    expect(nodo.textContent).toContain('Asignaciones en períodos futuros de su categoría de pago');
    expect(boton(nodo, 'Archivar Visa Oro')).toBeDefined();
    expect(boton(nodo, 'Cancelar')).toBeDefined();
    await userEvent.click(nodo.querySelector('[role="radio"][value="dejar"]') as HTMLElement);
    expect(accion).toHaveBeenCalledTimes(2);
    expect(accion.mock.calls[1]?.[0]).toMatchObject({
      modo: 'previsualizar',
      devolverAsignacionesFuturas: false,
    });
    await userEvent.click(boton(nodo, 'Archivar Visa Oro') as HTMLElement);
    expect(accion.mock.calls[2]?.[0]).toMatchObject({ modo: 'confirmar' });
  });

  it('PRU-CMP-CTA-741 [CA-E6-16] eliminar previsualiza antes de confirmar y el paso del impacto trae AV-15, el verbo «Eliminar cuenta» en peligro y «Cancelar»', async () => {
    const accion = vi.fn<(e: unknown) => ReturnType<typeof respuesta>>(() =>
      respuesta(
        vista({
          avisos: [{ codigo: 'AV-15', datos: { categoriaId: 'p1', conciliaciones: 0 } }],
        }),
      ),
    );
    const nodo = await montar(
      <FormularioCuentasEliminar
        accion={accion}
        cuentaId="c1"
        nombre="Ahorro navideño"
        archivada={false}
        programadas={0}
        bloqueos={[]}
      />,
    );
    expect(accion).not.toHaveBeenCalled();
    await userEvent.click(boton(nodo, 'Ver qué cambia') as HTMLElement);
    expect(accion.mock.calls[0]?.[0]).toMatchObject({ modo: 'previsualizar', cuentaId: 'c1' });
    expect(nodo.textContent).toContain('Se elimina también la categoría de pago Ahorro navideño.');
    const eliminar = boton(nodo, 'Eliminar cuenta') as HTMLButtonElement;
    expect(eliminar.className).toContain('peligro');
    expect(boton(nodo, 'Cancelar')).toBeDefined();
    await userEvent.click(boton(nodo, 'Cancelar') as HTMLElement);
    expect(replace).toHaveBeenCalledWith('/cuentas/c1');
  });
});

describe('PRU-CMP-CTA-742 verificar el saldo de una tarjeta', () => {
  it('PRU-CMP-CTA-742 [CA-E4-21] una tarjeta pide «Deuda que muestra tu banco» con «Debo / Tengo a favor» y una cuenta de efectivo pide el saldo', async () => {
    const base = {
      accion: vi.fn(() => respuesta(vista())),
      cuentaId: 'c1',
      hoy: '2027-03-10' as never,
      fecha: '2027-03-10',
      cantidad: 0,
      candidatas: [],
    };
    const tarjeta = await montar(<FormularioVerificarSaldo {...base} cuenta="Visa Oro" tarjeta />);
    expect(tarjeta.textContent).toContain('Deuda que muestra tu banco');
    expect(tarjeta.textContent).toContain('Debo');
    expect(tarjeta.textContent).toContain('Tengo a favor');
    const efectivo = await montar(
      <FormularioVerificarSaldo {...base} cuenta="Cuenta corriente" tarjeta={false} />,
    );
    expect(efectivo.textContent).toContain('Saldo que muestra tu banco');
    expect(efectivo.textContent).not.toContain('Tengo a favor');
  });
});
