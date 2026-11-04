// FT-27 (07 §17: un texto o un estado de un componente es una CMP). `ConfirmacionImpactoDeVista` solo da formato a los Δ que
// trae la previsualización del servidor (PF-3): los números los prueban el dominio, la integración y las E2E.
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import '../../app/globals.css';
import { ConfirmacionImpactoDeVista } from './confirmacion-impacto';

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
