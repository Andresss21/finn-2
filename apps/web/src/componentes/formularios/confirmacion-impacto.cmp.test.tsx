// FT-27 (07 §17: un texto o un estado de un componente es una CMP). `ConfirmacionImpactoDeVista` solo da formato a los Δ que
// trae la previsualización del servidor (PF-3): los números los prueban el dominio, la integración y las E2E.
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import type { ErrorFinn } from '@finn/aplicacion/errores';
import '../../app/globals.css';
import { ConfirmacionImpacto } from './confirmacion-impacto';
import { ConfirmacionImpactoDeVista } from './confirmacion-impacto-de-vista';
import { ErrorDeFlujo } from './error-de-flujo';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const montados: { raiz: Root; nodo: HTMLElement }[] = [];
afterEach(() => {
  for (const { raiz, nodo } of montados.splice(0)) {
    act(() => {
      raiz.unmount();
    });
    nodo.remove();
  }
});

const SALIDAS = '11111111-1111-4111-8111-111111111111';
const PAGO_T = '22222222-2222-4222-8222-222222222222';
const TARJETA = '33333333-3333-4333-8333-333333333333';

function montar(vista: Parameters<typeof ConfirmacionImpactoDeVista>[0]['vista']): HTMLElement {
  const nodo = document.createElement('div');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(
      <ConfirmacionImpactoDeVista
        titulo="Revisá el impacto"
        vista={vista}
        avisos={[]}
        textoConfirmar="Confirmar"
        textoVolver="Volver a editar"
        enviando={false}
        alConfirmar={() => undefined}
        alVolver={() => undefined}
      />,
    );
  });
  montados.push({ raiz, nodo });
  return nodo;
}

const lineas = (nodo: HTMLElement): string[] =>
  [...nodo.querySelectorAll('li')].map((li) => li.textContent);

describe('PRU-CMP-TX-430 ConfirmacionImpactoDeVista', () => {
  it('PRU-CMP-TX-430 [CA-27.2, ESC-32] el impacto de una compra con tarjeta olvidada dice Listo para asignar $0.00, Salidas −$20.00, Pago T +$20.00 y Te falta reservar +$30.00, cada uno con el nombre que trae la previsualización', () => {
    const nodo = montar({
      impacto: {
        deltaLpa: 0,
        deltaDisponible: [
          { categoriaId: SALIDAS, delta: -2000 },
          { categoriaId: PAGO_T, delta: 2000 },
        ],
        deltaTarjetas: [{ tarjetaId: TARJETA, deltaSaldo: 3000, deltaReserva: 0 }],
        deltaReduccionProyectadaLpaAlCierre: 0,
      },
      nombres: { [SALIDAS]: 'Salidas', [PAGO_T]: 'Pago T', [TARJETA]: 'T' },
    });
    expect(lineas(nodo)).toEqual([
      'Listo para asignar cambia $0.00.',
      'Disponible de Salidas cambia −$20.00.',
      'Disponible de Pago T cambia +$20.00.',
      'Te falta reservar para T cambia +$30.00.',
    ]);
  });

  it('PRU-CMP-TX-430 [CA-27.1] el impacto de un débito olvidado dice Listo para asignar −$30.00 y Salidas −$20.00 y no agrega líneas de tarjeta ni de reducción cuando no cambian', () => {
    const nodo = montar({
      impacto: {
        deltaLpa: -3000,
        deltaDisponible: [{ categoriaId: SALIDAS, delta: -2000 }],
        deltaTarjetas: [],
        deltaReduccionProyectadaLpaAlCierre: 0,
      },
      nombres: { [SALIDAS]: 'Salidas' },
    });
    expect(lineas(nodo)).toEqual([
      'Listo para asignar cambia −$30.00.',
      'Disponible de Salidas cambia −$20.00.',
    ]);
  });
});

function montarUI(ui: React.ReactNode): HTMLElement {
  const nodo = document.createElement('div');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(ui);
  });
  montados.push({ raiz, nodo });
  return nodo;
}

const error = (categoria: ErrorFinn['categoria'], codigo: string, mensaje: string): ErrorFinn => ({
  categoria,
  codigo,
  mensaje,
});

describe('PRU-CMP-PWA errores por tipo de flujo y paso de impacto', () => {
  it('PRU-CMP-PWA-751 [CA-E6-6] por cada categoría de 05 §4.7, el flujo corto y el largo muestran su patrón: una alerta con el mensaje del servidor y las salidas de su tipo', async () => {
    const reintentar = vi.fn();
    const verGuardado = vi.fn();
    const comoNuevo = vi.fn();
    const casos: ['corto' | 'largo', ErrorFinn, string[]][] = [
      [
        'corto',
        error('OCUPADO', 'ocupado', 'Finn está terminando otra operación.'),
        ['Intentar de nuevo'],
      ],
      [
        'corto',
        error('INCIERTO', 'red', 'No pudimos confirmar si se guardó.'),
        ['Intentar de nuevo'],
      ],
      [
        'largo',
        error('INTERNO', 'FN003', 'Algo salió mal. Referencia: ABC.'),
        ['Intentar de nuevo'],
      ],
      ['largo', error('VALIDACION', 'validacion', 'Revisá los campos marcados.'), []],
      [
        'largo',
        error('DOMINIO', 'conflicto_id', 'Ya hay algo guardado con este id.'),
        ['Ver lo guardado', 'Guardar como nuevo'],
      ],
    ];
    for (const [tipo, e, botones] of casos) {
      const nodo = montarUI(
        <ErrorDeFlujo
          tipo={tipo}
          error={e}
          alReintentar={reintentar}
          alVerGuardado={verGuardado}
          alGuardarComoNuevo={comoNuevo}
        />,
      );
      const alertas = nodo.querySelectorAll('[role="alert"]');
      expect(alertas).toHaveLength(1);
      expect(alertas[0]?.textContent).toContain(e.mensaje);
      expect(alertas[0]?.querySelector('[data-icono="dang"]')).not.toBeNull();
      expect([...nodo.querySelectorAll('button')].map((b) => b.textContent)).toEqual(botones);
    }
    const nodo = montarUI(
      <ErrorDeFlujo
        tipo="corto"
        error={error('OCUPADO', 'ocupado', 'x')}
        alReintentar={reintentar}
      />,
    );
    await act(async () => {
      await userEvent.click(nodo.querySelector('button') as HTMLElement);
    });
    expect(reintentar).toHaveBeenCalledTimes(1);
  });

  it('PRU-CMP-PWA-752 [CA-E4-21b] el paso «Revisá el impacto» muestra el título, una línea de lo que se confirma, los avisos con su texto (sin códigos), «Volver a editar» tonal y «Confirmar»; en eliminar, «Cancelar» y el verbo de peligro', async () => {
    const confirmar = vi.fn();
    const volver = vi.fn();
    const nodo = montarUI(
      <ConfirmacionImpacto
        titulo="Revisá el impacto"
        descripcion="Vas a archivar la categoría Super."
        impacto={['Listo para asignar cambia +$20.00.']}
        avisos={['Este período ya está cerrado.']}
        textoConfirmar="Archivar"
        textoVolver="Volver a editar"
        enviando={false}
        alConfirmar={confirmar}
        alVolver={volver}
      />,
    );
    expect(nodo.textContent).toContain('Vas a archivar la categoría Super.');
    expect(nodo.textContent).toContain('Este período ya está cerrado.');
    expect(nodo.textContent).not.toMatch(/AV-\d+/);
    expect(nodo.querySelector('h2')?.textContent).toBe('Revisá el impacto');
    const botones = [...nodo.querySelectorAll('button')];
    expect(botones.map((b) => b.textContent)).toEqual(['Volver a editar', 'Archivar']);
    await act(async () => {
      await userEvent.click(botones[1] as HTMLElement);
      await userEvent.click(botones[0] as HTMLElement);
    });
    expect(confirmar).toHaveBeenCalledTimes(1);
    expect(volver).toHaveBeenCalledTimes(1);

    const eliminar = montarUI(
      <ConfirmacionImpacto
        titulo="Revisá el impacto"
        peligro
        impacto={[]}
        avisos={[]}
        textoConfirmar="Eliminar"
        textoVolver="Cancelar"
        enviando={false}
        alConfirmar={confirmar}
        alVolver={volver}
      />,
    );
    const [cancelar, peligro] = [...eliminar.querySelectorAll('button')] as HTMLElement[];
    expect(cancelar?.textContent).toBe('Cancelar');
    const sonda = document.createElement('span');
    sonda.style.backgroundColor = 'var(--peligro)';
    eliminar.append(sonda);
    expect(getComputedStyle(peligro as HTMLElement).backgroundColor).toBe(
      getComputedStyle(sonda).backgroundColor,
    );
  });
});
