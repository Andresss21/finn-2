// Emparejamiento con una esperada (01 §4.17, M2, supuesto 8; OP-35 paso 7): misma cuenta,
// |Δ monto| ≤ tolerancia de la programada, |Δ fecha| ≤ 5 días, y la ocurrencia pendiente o
// registrada y todavía sin emparejar. Desempates: fecha más cercana, menor Δ monto, fecha esperada
// más antigua (y, a igual fecha, la programada de menor id, para que sea determinista).
import { ocurrencias } from '../calculo/ocurrencias';
import type { Hechos, Movimiento, Uuid } from '../hechos';
import type { Centavos } from '../valores/centavos';
import { FechaLocal } from '../valores/fecha-local';

const DIAS_EMPAREJAMIENTO = 5;

/** Lo que se compara del SMS: su cuenta (ya identificada), su monto y su fecha (pasos 4 y 5). */
export interface Comparable {
  readonly cuentaId: Uuid;
  readonly monto: Centavos;
  readonly fecha: FechaLocal;
}

export type Esperada = { readonly programadaId: Uuid; readonly fecha: FechaLocal };

const clave = (programadaId: Uuid | null, fecha: FechaLocal | null) => `${programadaId}|${fecha}`;

/**
 * Ocurrencias que ya tienen un SMS (inv. 15, CB-16): las emparejadas u omitidas, y las que un
 * movimiento con coincidencia o aprobado ya propone o resolvió.
 */
function tomadas(h: Pick<Hechos, 'ocurrencias_resueltas'>, movimientos: readonly Movimiento[]) {
  return new Set([
    ...h.ocurrencias_resueltas
      .filter((r) => r.estado !== 'registrada')
      .map((r) => clave(r.programadaId, r.fechaEsperada)),
    ...movimientos
      .filter((m) => m.estado === 'con_coincidencia' || m.estado === 'aprobado')
      .map((m) => clave(m.esperadaProgramadaId, m.esperadaFecha)),
  ]);
}

/** La esperada con la que empareja el SMS, o `undefined` si ninguna cumple. */
export function emparejar(
  h: Pick<Hechos, 'programadas' | 'ocurrencias_resueltas'>,
  movimientos: readonly Movimiento[],
  sms: Comparable,
): Esperada | undefined {
  const ocupadas = tomadas(h, movimientos);
  const desde = FechaLocal.sumarDias(sms.fecha, -DIAS_EMPAREJAMIENTO);
  const hasta = FechaLocal.sumarDias(sms.fecha, DIAS_EMPAREJAMIENTO);
  const candidatas = h.programadas
    .filter((p) => p.cuentaId === sms.cuentaId && Math.abs(sms.monto - p.monto) <= p.tolerancia)
    .flatMap((p) =>
      ocurrencias(p, hasta)
        .filter((fecha) => fecha >= desde && !ocupadas.has(clave(p.id, fecha)))
        .map((fecha) => ({
          programadaId: p.id,
          fecha,
          dias: Math.abs(FechaLocal.diasEntre(fecha, sms.fecha)),
          monto: Math.abs(sms.monto - p.monto),
        })),
    );
  candidatas.sort(
    (a, b) =>
      a.dias - b.dias ||
      a.monto - b.monto ||
      FechaLocal.comparar(a.fecha, b.fecha) ||
      (a.programadaId < b.programadaId ? -1 : 1),
  );
  const elegida = candidatas[0];
  return elegida && { programadaId: elegida.programadaId, fecha: elegida.fecha };
}
