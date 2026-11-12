// FT-13 Auto-asignar (07 §17: un texto o un estado es una CMP). El formulario solo dibuja lo que trae la previsualización de OP-17 y
// arma su entrada: los montos los pone el servidor y los prueban el dominio y las E2E (PF-3).
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import '../../app/globals.css';
import { presupuestoAutoAsignar as t } from '../../textos/presupuesto-auto-asignar';
import { FormularioAutoAsignar, type PropsFormularioAutoAsignar } from './formulario';

// `next/navigation` necesita `process`: el enrutador se simula para ver adónde manda el marco del flujo.
const replace = vi.fn();
vi.mock('next/navigation', () => ({ usePathname: () => '/', useRouter: () => ({ replace }) }));

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
  // Asíncrona: deja correr el efecto que pide la previsualización y su respuesta.
  await act(() => {
    raiz.render(ui);
    return Promise.resolve();
  });
  montados.push({ raiz, nodo });
  return nodo;
}

const SUPER = '11111111-1111-4111-8111-111111111111';
const MASCOTA = '22222222-2222-4222-8222-222222222222';
const ok = (valor: unknown) =>
  Promise.resolve({ ok: true as const, valor, yaAplicada: false, avisos: [] });
const vista = (extra: Record<string, unknown> = {}) => ({
  revisionVista: 'r1',
  huellaImpacto: 'h1',
  impacto: { deltaLpa: -30000, deltaDisponible: [{ categoriaId: SUPER, delta: 30000 }] },
  avisos: [],
  rechazos: [],
  ...extra,
});
const sinCubrir = { codigo: 'AV-18', datos: { [MASCOTA]: 5000 } };
const base: Omit<PropsFormularioAutoAsignar, 'accion'> = {
  periodoInicio: '2027-02-01',
  revision: 'r1',
  periodo: '01/02 – 28/02/2027',
  lpa: '$300.00',
  nombres: { [SUPER]: 'Super', [MASCOTA]: 'Mascota' },
  hayFalta: true,
  rutaPadre: '/presupuesto',
  superpuesto: false,
};

const boton = (nodo: HTMLElement, texto: string): HTMLButtonElement => {
  const b = [...nodo.querySelectorAll('button')].find((x) => x.textContent === texto);
  if (b === undefined) throw new Error(`no hay un botón «${texto}»`);
  return b;
};
const tocar = async (nodo: HTMLElement, texto: string): Promise<void> => {
  await userEvent.click(boton(nodo, texto));
};
/** El texto de la fila de la tarjeta de una categoría (nombre, «falta para la meta» y el monto). */
const filaDe = (nodo: HTMLElement, id: string): string | undefined =>
  nodo.querySelector(`li [data-categoria="${id}"]`)?.textContent;
const alto = (e: Element): number => e.getBoundingClientRect().height;

describe('PRU-CMP-PRES', () => {
  it('PRU-CMP-PRES-130 [AV-18, CA-E6-13] al abrir previsualiza sola con la revisión vista, dibuja lo que asignaría y lo que queda sin cubrir; confirmar envía la misma entrada con la huella y el aviso sigue a la vista', async () => {
    const accion = vi.fn((entrada: unknown) =>
      (entrada as { modo: string }).modo === 'previsualizar'
        ? ok(vista({ avisos: [sinCubrir] }))
        : ok({}),
    );
    const nodo = await montar(<FormularioAutoAsignar {...base} accion={accion} />);
    expect(accion).toHaveBeenCalledTimes(1);
    expect(accion).toHaveBeenLastCalledWith({
      periodoInicio: '2027-02-01',
      modo: 'previsualizar',
      esperado: { revision: 'r1' },
    });
    expect(nodo.textContent).toContain(t.revisar);
    expect(filaDe(nodo, SUPER)).toBe(`Super${t.faltaParaLaMeta}+$300.00`);
    expect(nodo.textContent).toContain(t.quedaSinCubrir('Mascota', '$50.00'));

    await tocar(nodo, t.confirmarMonto('$300.00'));
    expect(accion).toHaveBeenLastCalledWith({
      periodoInicio: '2027-02-01',
      modo: 'confirmar',
      esperado: { revision: 'r1' },
      revisionVista: 'r1',
      huellaImpacto: 'h1',
    });
    // Después (AV-18): no se cierra solo, para que se lea lo que quedó sin cubrir
    expect(nodo.textContent).toContain(t.listo);
    expect(nodo.textContent).toContain(t.sinCubrir('Mascota', '$50.00'));
    expect(replace).not.toHaveBeenCalled();
    await tocar(nodo, t.entendido);
    expect(replace).toHaveBeenCalledWith('/presupuesto');
  });

  it('PRU-CMP-PRES-131 sin avisos de lo que quedó sin cubrir, confirmar cierra el flujo y manda a Presupuesto', async () => {
    const accion = vi.fn((entrada: unknown) =>
      (entrada as { modo: string }).modo === 'previsualizar' ? ok(vista()) : ok({}),
    );
    const nodo = await montar(<FormularioAutoAsignar {...base} accion={accion} />);
    expect(nodo.textContent).not.toContain('quedó sin cubrir');
    await tocar(nodo, t.confirmarMonto('$300.00'));
    expect(replace).toHaveBeenCalledWith('/presupuesto');
  });

  it('PRU-CMP-PRES-132 sin metas con falta lo dice, no llama al servidor y no ofrece confirmar', async () => {
    const accion = vi.fn(() => ok(vista()));
    const nodo = await montar(<FormularioAutoAsignar {...base} hayFalta={false} accion={accion} />);
    expect(nodo.textContent).toContain(t.sinFalta);
    expect(accion).not.toHaveBeenCalled();
    expect(() => boton(nodo, t.confirmarMonto('$300.00'))).toThrow();
  });

  it('PRU-CMP-PRES-133 [AV-18] con Listo para asignar en cero o negativo la previsualización dice que no asignará nada, muestra lo que falta y no ofrece confirmar', async () => {
    const accion = vi.fn(() =>
      ok(vista({ impacto: { deltaLpa: 0, deltaDisponible: [] }, avisos: [sinCubrir] })),
    );
    const nodo = await montar(<FormularioAutoAsignar {...base} accion={accion} />);
    expect(nodo.textContent).toContain(t.nadaQueAsignar);
    expect(nodo.textContent).toContain(t.quedaSinCubrir('Mascota', '$50.00'));
    expect(() => boton(nodo, t.confirmarMonto('$300.00'))).toThrow();
  });

  it('PRU-CMP-PRES-134 si el estado cambió después de previsualizar, confirmar responde conflicto_desactualizado y "Volver a calcular" previsualiza de nuevo con la revisión actual', async () => {
    let pasos = 0;
    const accion = vi.fn((entrada: unknown) => {
      const { modo } = entrada as { modo: string };
      if (modo === 'previsualizar') return ok(vista());
      pasos += 1;
      return Promise.resolve({
        ok: false as const,
        error: {
          categoria: 'CONFLICTO' as const,
          codigo: 'conflicto_desactualizado',
          mensaje: 'Este valor cambió mientras lo editabas. Recargá para ver el valor actual.',
          datos: { actuales: { revision: 'r2' } },
        },
      });
    });
    const nodo = await montar(<FormularioAutoAsignar {...base} accion={accion} />);
    await tocar(nodo, t.confirmarMonto('$300.00'));
    expect(pasos).toBe(1);
    expect(nodo.textContent).toContain('Este valor cambió mientras lo editabas');
    expect(() => boton(nodo, t.confirmarMonto('$300.00'))).toThrow();

    await tocar(nodo, t.volverACalcular);
    expect(accion).toHaveBeenLastCalledWith({
      periodoInicio: '2027-02-01',
      modo: 'previsualizar',
      esperado: { revision: 'r2' },
    });
    expect(nodo.textContent).toContain(t.revisar);
  });
  it('PRU-CMP-PRES-280 [CA-E6-13] la confirmación de Auto-asignar dibuja el período, la introducción con Listo para asignar, una fila por categoría con «+$…» en una tarjeta, lo que queda sin cubrir como advertencia y «Cancelar» y «Asignar $300.00» en dos columnas de 44 px o más, sin «antes → después»', async () => {
    const accion = vi.fn(() => ok(vista({ avisos: [sinCubrir] })));
    const nodo = await montar(<FormularioAutoAsignar {...base} accion={accion} />);
    expect(nodo.textContent).toContain(t.periodo('01/02 – 28/02/2027'));
    expect(nodo.textContent).toContain(t.intro('$300.00'));
    const tarjeta = nodo.querySelector('section ul');
    expect(tarjeta?.className).toContain('rounded-contenedor');
    const filas = [...(tarjeta?.querySelectorAll(':scope > li') ?? [])].map((li) => li.textContent);
    expect(filas).toEqual([`Super${t.faltaParaLaMeta}+$300.00`, t.impactoLpa('−$300.00')]);
    const aviso = nodo.querySelector('[data-estado="advertencia"]');
    expect(aviso?.textContent).toContain(t.quedaSinCubrir('Mascota', '$50.00'));
    // El foco va al título de la confirmación, como antes (05 §4.4)
    expect(document.activeElement?.textContent).toBe(t.revisar);
    const pie = boton(nodo, t.confirmarMonto('$300.00')).parentElement;
    expect(pie?.className).toContain('grid-cols-2');
    expect([...(pie?.querySelectorAll('button') ?? [])].map((b) => b.textContent)).toEqual([
      t.cancelar,
      t.confirmarMonto('$300.00'),
    ]);
    for (const b of pie?.querySelectorAll('button') ?? [])
      expect(alto(b)).toBeGreaterThanOrEqual(44);
    expect(nodo.textContent).not.toContain('→');
  });

  it('PRU-CMP-PRES-281 [FT-13] sin metas con falta lo dice en un aviso positivo con su título y «Cerrar», de 44 px o más, cierra el flujo', async () => {
    const accion = vi.fn(() => ok(vista()));
    const nodo = await montar(<FormularioAutoAsignar {...base} hayFalta={false} accion={accion} />);
    const aviso = nodo.querySelector('[data-estado="positivo"]');
    expect(aviso?.textContent).toContain(t.nadaQueAutoAsignar);
    expect(aviso?.textContent).toContain(t.sinFalta);
    expect(alto(boton(nodo, 'Cerrar'))).toBeGreaterThanOrEqual(44);
    await tocar(nodo, 'Cerrar');
    expect(replace).toHaveBeenCalledWith('/presupuesto');
    expect(accion).not.toHaveBeenCalled();
  });
});
