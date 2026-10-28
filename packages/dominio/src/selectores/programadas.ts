// Programadas y próximos pagos (04 §6.12.1, BE-37, CF-20): las programadas con sus ocurrencias
// pendientes, las que ya calculó el motor (`Instantanea.ocurrencias`, que respetan `reactivadaDesde`).
// `calendarioEditable` y `puedeEliminar` leen las referencias de la bandeja ([H]), que llegan por
// parámetro. El `Encabezado` lo agrega la consulta.
import type {
  Frecuencia,
  Instantanea,
  Movimiento,
  Programada,
  TipoProgramada,
  Uuid,
} from '../hechos';
import type { Centavos } from '../valores/centavos';
import { FechaLocal } from '../valores/fecha-local';
import { nombres, type Ref } from './comunes';
import type { OcurrenciaDto } from './inicio';

/** Horizonte por defecto en Programadas: 30 días (BE-37); es también el que calcula el motor. */
export const HORIZONTE_PROGRAMADAS = 30;

/** Lo que la bandeja sabe de las programadas ([H]): movimientos y SMS que las referencian. */
export interface ReferenciasDeProgramadas {
  readonly movimientos?: readonly Movimiento[];
  /** Procesamientos de SMS por programada (OP-51). */
  readonly smsPorProgramada?: ReadonlyMap<Uuid, number>;
}

export interface ProgramadaDto {
  readonly id: Uuid;
  readonly tipo: TipoProgramada;
  readonly comercio: string;
  readonly cuenta: Ref;
  readonly cuentaDestino?: Ref;
  readonly monto: Centavos;
  readonly tolerancia: Centavos;
  readonly frecuencia: Frecuencia;
  readonly frecuenciaDias?: number;
  readonly primeraFecha: FechaLocal;
  readonly fechaFin?: FechaLocal;
  readonly registroAutomatico: boolean;
  readonly activa: boolean;
  readonly lineas: readonly { readonly categoria: Ref; readonly monto: Centavos }[];
  readonly proximas: readonly FechaLocal[];
  readonly atrasadas: readonly FechaLocal[];
  readonly calendarioEditable: boolean;
  readonly puedeEliminar: boolean;
  readonly avisoSinModelo: boolean;
}

export interface ProgramadasSel {
  readonly programadas: readonly ProgramadaDto[];
  readonly proximosPagos: readonly OcurrenciaDto[];
}

/** Sin resoluciones ni coincidencia propuesta: el calendario se puede cambiar (P3-6b, HZ-3). */
export function calendarioEditable(
  i: Instantanea,
  programadaId: Uuid,
  r: ReferenciasDeProgramadas = {},
): boolean {
  return (
    !i.hechos.ocurrencias_resueltas.some((o) => o.programadaId === programadaId) &&
    !(r.movimientos ?? []).some(
      (m) => m.esperadaProgramadaId === programadaId && m.estado === 'con_coincidencia',
    )
  );
}

/** OP-51: sin resoluciones ni referencias desde la bandeja. */
export function puedeEliminar(
  i: Instantanea,
  programadaId: Uuid,
  r: ReferenciasDeProgramadas = {},
): boolean {
  return (
    !i.hechos.ocurrencias_resueltas.some((o) => o.programadaId === programadaId) &&
    !(r.movimientos ?? []).some((m) => m.esperadaProgramadaId === programadaId) &&
    (r.smsPorProgramada?.get(programadaId) ?? 0) === 0
  );
}

/** `consultas.programadas` (6.12.1). Lanza `RangeError` si el horizonte pasa de lo que calculó el motor. */
export function programadas(
  i: Instantanea,
  r: ReferenciasDeProgramadas = {},
  horizonteDias: number = HORIZONTE_PROGRAMADAS,
): ProgramadasSel {
  if (
    !Number.isInteger(horizonteDias) ||
    horizonteDias < 0 ||
    horizonteDias > HORIZONTE_PROGRAMADAS
  )
    throw new RangeError(`horizonte de próximos pagos inválido: ${horizonteDias}`);
  const h = i.hechos;
  const n = nombres(i);
  const limite = FechaLocal.sumarDias(i.hoy, horizonteDias);
  const pendientes = i.ocurrencias.filter((o) => o.fecha <= limite);
  const sinModelo = (p: Programada) =>
    p.tipo === 'cuota_prestamo' &&
    p.registroAutomatico &&
    p.cuentaDestinoId !== null &&
    h.prestamos.find((x) => x.cuentaId === p.cuentaDestinoId)?.modeloCalculo == null;
  const dto = (p: Programada): ProgramadaDto => ({
    id: p.id,
    tipo: p.tipo,
    comercio: p.comercio,
    cuenta: n.cuenta(p.cuentaId),
    ...(p.cuentaDestinoId === null ? {} : { cuentaDestino: n.cuenta(p.cuentaDestinoId) }),
    monto: p.monto,
    tolerancia: p.tolerancia,
    frecuencia: p.frecuencia,
    ...(p.frecuenciaDias === null ? {} : { frecuenciaDias: p.frecuenciaDias }),
    primeraFecha: p.primeraFecha,
    ...(p.fechaFin === null ? {} : { fechaFin: p.fechaFin }),
    registroAutomatico: p.registroAutomatico,
    activa: p.activa,
    lineas: h.programada_lineas
      .filter((l) => l.programadaId === p.id)
      .sort((a, b) => a.orden - b.orden)
      .map((l) => ({ categoria: n.categoria(l.categoriaId), monto: l.monto })),
    proximas: pendientes.filter((o) => o.programadaId === p.id && !o.atrasada).map((o) => o.fecha),
    atrasadas: pendientes.filter((o) => o.programadaId === p.id && o.atrasada).map((o) => o.fecha),
    calendarioEditable: calendarioEditable(i, p.id, r),
    puedeEliminar: puedeEliminar(i, p.id, r),
    avisoSinModelo: sinModelo(p),
  });
  const porId = new Map(h.programadas.map((p) => [p.id, p]));
  return {
    programadas: [...h.programadas]
      .sort((a, b) =>
        a.comercio !== b.comercio ? (a.comercio < b.comercio ? -1 : 1) : a.id < b.id ? -1 : 1,
      )
      .map(dto),
    proximosPagos: pendientes.flatMap((o): OcurrenciaDto[] => {
      const p = porId.get(o.programadaId);
      return p === undefined
        ? []
        : [
            {
              programada: { id: p.id, nombre: p.comercio },
              fechaEsperada: o.fecha,
              monto: p.monto,
              cuenta: n.cuenta(p.cuentaId),
              tipo: p.tipo,
              registroAutomatico: p.registroAutomatico,
              atrasada: o.atrasada,
            },
          ];
    }),
  };
}
