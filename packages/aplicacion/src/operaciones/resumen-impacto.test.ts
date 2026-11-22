// El resumen de AV-01 «después» (BE-38) que se ve en Inicio y en Notificaciones: frases legibles, sin «Δ» ni «LPA», sin líneas
// en cero y con una frase propia cuando nada cambió en el período activo.
import { describe, expect, it } from 'vitest';
import type { Impacto } from '@finn/dominio';
import { resumenDelImpacto } from './resumen-impacto.ts';

type Parcial = Pick<
  Impacto,
  'deltaLpa' | 'deltaDisponible' | 'deltaTarjetas' | 'deltaReduccionProyectadaLpaAlCierre'
>;
const SALIDAS = '00000000-0000-4000-8000-000000000001';
const PAGO_T = '00000000-0000-4000-8000-000000000002';
const T = '00000000-0000-4000-8000-000000000003';
const NOMBRES = { [SALIDAS]: 'Salidas', [PAGO_T]: 'Pago T', [T]: 'T' };

const categoria = (categoriaId: string, delta: number) =>
  ({ categoriaId, delta, antes: 0, despues: delta }) as Impacto['deltaDisponible'][number];
const tarjeta = (deltaSaldo: number, deltaReserva: number) =>
  ({
    tarjetaId: T,
    deltaSaldo,
    deltaReserva,
    saldoAntes: 0,
    saldoDespues: 0,
    reservaAntes: 0,
    reservaDespues: 0,
  }) as Impacto['deltaTarjetas'][number];
const impacto = (p: Record<string, unknown>): Parcial =>
  ({
    deltaLpa: 0,
    deltaDisponible: [],
    deltaTarjetas: [],
    deltaReduccionProyectadaLpaAlCierre: 0,
    ...p,
  }) as unknown as Parcial;

describe('PRU-DOM-TX resumen del cambio retroactivo', () => {
  it('PRU-DOM-TX-445 [CA-08.5, ESC-31] el débito olvidado se resume como «Listo para asignar bajó $30.00 · Salidas bajó $20.00»', () => {
    const r = resumenDelImpacto(
      impacto({ deltaLpa: -3000, deltaDisponible: [categoria(SALIDAS, -2000)] }),
      NOMBRES,
    );
    expect(r).toBe('Listo para asignar bajó $30.00 · Salidas bajó $20.00');
  });

  it('PRU-DOM-TX-446 [CA-27.2, ESC-32] sin «Δ» ni «LPA», los aumentos con «subió» y Listo para asignar fuera cuando no cambia', () => {
    const r = resumenDelImpacto(
      impacto({
        deltaDisponible: [categoria(SALIDAS, -2000), categoria(PAGO_T, 2000)],
        deltaTarjetas: [tarjeta(3000, 0)],
        deltaReduccionProyectadaLpaAlCierre: 1500,
      }),
      NOMBRES,
    );
    expect(r).toBe(
      'Salidas bajó $20.00 · Pago T subió $20.00 · Te falta reservar para T subió $30.00 · ' +
        'La reducción proyectada de Listo para asignar al cierre subió $15.00',
    );
    expect(r).not.toMatch(/Δ|LPA|\$0\.00/);
  });

  it('PRU-DOM-TX-447 [CA-08.5] ninguna línea en cero; si todo es cero, «No cambió nada en el período actual.»', () => {
    expect(
      resumenDelImpacto(
        impacto({
          deltaDisponible: [categoria(SALIDAS, 0)],
          deltaTarjetas: [tarjeta(0, -500)],
        }),
        NOMBRES,
      ),
    ).toBe('Reservado de más en T bajó $5.00');
    expect(resumenDelImpacto(impacto({}), NOMBRES)).toBe('No cambió nada en el período actual.');
  });
});
