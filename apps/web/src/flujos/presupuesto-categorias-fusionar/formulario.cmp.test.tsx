// FT-20 Fusionar categorías (07 §17: un texto, un estado o el foco de un componente es una CMP). El formulario solo dibuja lo que
// trae `formulario({ operacion: 'fusionar' })` y arma la entrada de OP-12: los números del impacto los pone el servidor y los
// prueban el dominio, la integración y las E2E (PF-3).
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import '../../app/globals.css';
import { categoriasFusionar as t } from '../../textos/categorias-fusionar';
import { FormularioFusionar, type PropsFormularioFusionar } from './formulario';

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

function montar(ui: ReactNode): HTMLElement {
  document.body.style.cssText = 'background: var(--fondo); color: var(--texto)';
  const nodo = document.createElement('div');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(ui);
  });
  montados.push({ raiz, nodo });
  return nodo;
}

const ORIGEN = '11111111-1111-4111-8111-111111111111';
const DESTINO = '33333333-3333-4333-8333-333333333333';
const ok = (valor: unknown) =>
  Promise.resolve({ ok: true as const, valor, yaAplicada: false, avisos: [] });
const vista = (extra: Record<string, unknown> = {}) => ({
  revisionVista: 'r1',
  huellaImpacto: 'h1',
  impacto: { deltaLpa: 3000, deltaDisponible: [{ categoriaId: DESTINO, delta: -3000 }] },
  avisos: [
    {
      codigo: 'AV-13',
      datos: { 'asignado:2027-01-21': 5000, metaDescartada: 'mensual' },
    },
    { codigo: 'AV-01' },
  ],
  rechazos: [],
  ...extra,
});
const base: Omit<PropsFormularioFusionar, 'accion'> = {
  origen: { id: ORIGEN, nombre: 'Café' },
  destinos: [{ id: DESTINO, nombre: 'Salidas' }],
  resumen: {
    periodosConAsignacion: 1,
    transacciones: 2,
    condonaciones: 0,
    programadas: 0,
    reglas: 1,
    meta: { tipo: 'mensual', monto: 5000 },
  },
};

const boton = (nodo: HTMLElement, texto: string): HTMLButtonElement => {
  const b = [...nodo.querySelectorAll('button')].find((x) => x.textContent === texto);
  if (b === undefined) throw new Error(`no hay un botón «${texto}»`);
  return b;
};
const tocar = async (nodo: HTMLElement, texto: string): Promise<void> => {
  await userEvent.click(boton(nodo, texto));
};
/** Elige `opcion` en el `<select>` nativo cuya etiqueta contiene `grupo`. */
const elegirDestinoEn = async (nodo: HTMLElement, grupo: string, opcion: string): Promise<void> => {
  const etiqueta = [...nodo.querySelectorAll('label')].find((l) => l.textContent.includes(grupo));
  const select = nodo.querySelector<HTMLSelectElement>(`select[id="${etiqueta?.htmlFor}"]`);
  if (select === null) throw new Error(`no hay «${grupo}»`);
  const o = [...select.options].find((x) => x.text === opcion);
  if (o === undefined) throw new Error(`no hay «${opcion}» en «${grupo}»`);
  await userEvent.selectOptions(select, o.value);
};
const elegirDestino = (nodo: HTMLElement, nombre: string): Promise<void> =>
  elegirDestinoEn(nodo, 'Fusionar con', nombre);

describe('PRU-CMP-CATEG', () => {
  it('PRU-CMP-CATEG-120 sin otra categoría activa el flujo lo explica y no ofrece fusionar', () => {
    const accion = vi.fn(() => ok(vista()));
    const nodo = montar(<FormularioFusionar {...base} destinos={[]} accion={accion} />);
    expect(nodo.textContent).toContain(t.sinDestinos);
    expect([...nodo.querySelectorAll('button')].some((b) => b.textContent === t.fusionar)).toBe(
      false,
    );
    expect(accion).not.toHaveBeenCalled();
  });

  it('PRU-CMP-CATEG-121 muestra el resumen de lo que se mueve y pide elegir el destino antes de enviar', async () => {
    const accion = vi.fn(() => ok(vista()));
    const nodo = montar(<FormularioFusionar {...base} accion={accion} />);
    for (const linea of [
      t.periodos(1),
      t.transacciones(2),
      t.condonaciones(0),
      t.programadas(0),
      t.reglas(1),
      t.metaDescartada('Café'),
    ])
      expect(nodo.textContent).toContain(linea);

    await tocar(nodo, t.fusionar);
    expect(accion).not.toHaveBeenCalled();
    expect(nodo.textContent).toContain(t.destino);
  });

  it('PRU-CMP-CATEG-122 [AV-13, AV-01] previsualiza primero, dibuja el impacto del servidor, confirma con la huella y vuelve al detalle del destino', async () => {
    const accion = vi.fn((entrada: unknown) =>
      (entrada as { modo: string }).modo === 'previsualizar' ? ok(vista()) : ok({}),
    );
    const nodo = montar(<FormularioFusionar {...base} accion={accion} />);
    await elegirDestino(nodo, 'Salidas');
    await tocar(nodo, t.fusionar);
    expect(accion).toHaveBeenLastCalledWith({
      origenId: ORIGEN,
      destinoId: DESTINO,
      modo: 'previsualizar',
    });
    for (const linea of [
      t.revisar,
      t.deltaLpa('+$30.00'),
      t.deltaDisponible('Salidas', '−$30.00'),
      t.deltaPeriodo('21 ene 2027', 'Salidas', '+$50.00'),
      t.metaDescartada('Café'),
      t.periodoCerrado,
    ])
      expect(nodo.textContent).toContain(linea);

    await tocar(nodo, t.confirmar);
    expect(accion).toHaveBeenLastCalledWith({
      origenId: ORIGEN,
      destinoId: DESTINO,
      modo: 'confirmar',
      revisionVista: 'r1',
      huellaImpacto: 'h1',
    });
    expect(nodo.textContent).toContain(t.listo);
    expect(replace).toHaveBeenCalledWith(`/presupuesto/categorias/${DESTINO}`);
  });

  it('PRU-CMP-CATEG-123 con impacto nulo igual muestra la confirmación y lo dice', async () => {
    const accion = vi.fn(() =>
      ok(
        vista({
          impacto: { deltaLpa: 0, deltaDisponible: [] },
          avisos: [{ codigo: 'AV-13', datos: { metaDescartada: false } }],
        }),
      ),
    );
    const nodo = montar(<FormularioFusionar {...base} accion={accion} />);
    await elegirDestino(nodo, 'Salidas');
    await tocar(nodo, t.fusionar);
    expect(nodo.textContent).toContain(t.sinCambios);
    expect(nodo.textContent).not.toContain(t.periodoCerrado);
    expect(boton(nodo, t.confirmar)).toBeDefined();
  });

  it('PRU-CMP-CATEG-124 si el servidor rechaza la fusión, la confirmación se reemplaza por el aviso y deja volver a editar', async () => {
    const accion = vi.fn(() =>
      ok(
        vista({
          huellaImpacto: null,
          impacto: null,
          rechazos: [{ codigo: 'fusion_destino_archivado' }],
        }),
      ),
    );
    const nodo = montar(<FormularioFusionar {...base} accion={accion} />);
    await elegirDestino(nodo, 'Salidas');
    await tocar(nodo, t.fusionar);
    expect(nodo.textContent).toContain(t.rechazos.otro);
    expect([...nodo.querySelectorAll('button')].some((b) => b.textContent === t.confirmar)).toBe(
      false,
    );
    await tocar(nodo, t.volverAEditar);
    expect(nodo.textContent).toContain(t.resumenTitulo);
  });
});
