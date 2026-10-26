// Detalle de una transacción (04 §6.7.2): efectos, líneas con sus eventos (§4.5, §4.10), la
// conciliación y las restricciones de OP-28 y OP-29. La nota, los cambios posteriores y el origen por
// SMS son [H] o [I] y llegan como parámetro.
import { periodoDe } from '../calculo/periodos';
import type { CambioPosterior, Instante, Instantanea, Linea, Uuid } from '../hechos';
import type { FechaLocal } from '../valores/fecha-local';
import { filaDe, indice } from './actividad';
import { nombres, periodoDto, type Ref } from './comunes';
import { contexto } from './reportes/comunes';

export interface DatosDeOrigen {
  readonly cambios?: readonly CambioPosterior[];
  /** SMS que originó cada transacción (`movimientos` e `sms_recibidos`), por id de transacción. */
  readonly sms?: ReadonlyMap<
    Uuid,
    { readonly texto: string; readonly recibidoEn: Instante; readonly movimientoId: Uuid }
  >;
}

type Destino =
  | { readonly categoria: Ref }
  | { readonly deudor: Ref }
  | { readonly lineaOriginal: { readonly id: Uuid; readonly transaccionId: Uuid } };

/**
 * `consultas.detalleTransaccion` (6.7.2). Lanza `RangeError` si la transacción no existe (la consulta
 * lo traduce a `NO_ENCONTRADO`).
 */
export function detalleTransaccion(i: Instantanea, transaccionId: Uuid, o: DatosDeOrigen = {}) {
  const h = i.hechos;
  const t = h.transacciones.find((x) => x.id === transaccionId);
  if (t === undefined) throw new RangeError(`la transacción ${transaccionId} no existe`);
  const x = indice(i);
  const n = nombres(i);
  const efectos = x.efectos.get(t.id) ?? [];
  const lineas = [...(x.lineas.get(t.id) ?? [])].sort((a: Linea, b: Linea) => a.orden - b.orden);
  const devoluciones = contexto(i).devoluciones;
  const partes = i.presupuesto.repartos.flatMap((r) => r.partes);

  const detalle = lineas.map((l) => {
    const cobro = i.porCobrar.find((p) => p.lineaId === l.id);
    const destino: Destino =
      l.categoriaId !== null
        ? { categoria: n.categoria(l.categoriaId) }
        : l.deudorId !== null
          ? {
              deudor: {
                id: l.deudorId,
                nombre: h.deudores.find((d) => d.id === l.deudorId)?.nombre ?? '',
              },
            }
          : {
              lineaOriginal: {
                id: l.lineaOriginalId as Uuid,
                transaccionId: x.linea.get(l.lineaOriginalId as Uuid)?.transaccionId as Uuid,
              },
            };
    const reparto = partes.find((p) => p.consumo.fuente === 'linea' && p.consumo.id === l.id);
    const suyas = devoluciones
      .filter((d) => d.lineaOriginalId === l.id)
      .map((d) => ({
        transaccionId: x.linea.get(d.lineaId)?.transaccionId as Uuid,
        fecha: d.fecha,
        monto: d.monto,
        caso: d.caso,
      }));
    const eventos = [...(cobro?.eventos.map((e) => e.fecha) ?? []), ...suyas.map((d) => d.fecha)];
    return {
      eventos,
      linea: {
        id: l.id,
        orden: l.orden,
        monto: l.monto,
        destino,
        ...(reparto === undefined
          ? {}
          : { reparto: { cubierto: reparto.cubierto, noCubierto: reparto.noCubierto } }),
        ...(cobro === undefined
          ? {}
          : {
              porCobrar: {
                abierto: cobro.abierto,
                restituido: cobro.restituido,
                condonado: cobro.condonado,
                devuelto: cobro.devuelto,
                estado:
                  cobro.abierto === 0
                    ? ('cerrado' as const)
                    : cobro.restituido + cobro.condonado + cobro.devuelto > 0
                      ? ('parcial' as const)
                      : ('abierto' as const),
              },
            }),
        cobros: (cobro?.eventos ?? [])
          .filter((e) => e.tipo === 'cobro')
          .map((e) => ({
            transaccionId: e.id,
            fecha: e.fecha,
            monto: e.monto,
            restitucion: e.restituido,
            excedente: e.excedente,
          })),
        condonaciones: h.condonaciones
          .filter((c) => c.lineaId === l.id)
          .map((c) => ({
            id: c.id,
            fecha: c.fecha,
            monto: c.monto,
            categoria: n.categoria(c.categoriaId),
          })),
        devoluciones: suyas,
      },
    };
  });

  const fechasDeEventos = detalle.flatMap((d) => d.eventos);
  const archivada = efectos.some((e) => n.cuenta(e.cuentaId).archivada === true);
  const conEventos = detalle.some((d) => d.eventos.length > 0);
  const programada = h.ocurrencias_resueltas.find((r) => r.transaccionId === t.id);
  const sms = o.sms?.get(t.id);
  const apertura = efectos
    .map((e) => h.cuentas.find((k) => k.id === e.cuentaId)?.fechaApertura)
    .filter((f): f is FechaLocal => f !== undefined)
    .sort();
  const tope = [i.hoy, ...fechasDeEventos].sort()[0] as FechaLocal;

  return {
    transaccion: {
      ...filaDe(i, t),
      nota: t.nota,
      horaRegistro: t.horaRegistro,
      ...(t.monedaOriginal === null ? {} : { monedaOriginal: t.monedaOriginal }),
      ...(t.montoOriginal === null ? {} : { montoOriginal: t.montoOriginal }),
      periodo: periodoDto(i, periodoDe(i.ciclo, t.fecha)),
    },
    efectos: efectos.map((e) => ({
      cuenta: n.cuenta(e.cuentaId),
      monto: e.monto,
      ...(e.interes === null ? {} : { interes: e.interes }),
      ...(e.seguro === null ? {} : { seguro: e.seguro }),
    })),
    lineas: detalle.map((d) => d.linea),
    ...(t.conciliacionId === null
      ? {}
      : {
          conciliacion: {
            id: t.conciliacionId,
            fechaEstado: h.conciliaciones.find((c) => c.id === t.conciliacionId)
              ?.fechaEstado as FechaLocal,
          },
        }),
    cambiosPosteriores: (o.cambios ?? [])
      .filter((c) => c.transaccionId === t.id)
      .map((c) => ({ registradoEn: c.registradoEn, motivos: c.motivos })),
    origenDetalle:
      sms !== undefined
        ? { sms }
        : programada === undefined
          ? undefined
          : {
              programada: {
                programada: {
                  id: programada.programadaId,
                  nombre:
                    h.programadas.find((p) => p.id === programada.programadaId)?.comercio ?? '',
                },
                fechaEsperada: programada.fechaEsperada,
              },
            },
    restricciones: {
      puedeEliminar: !conEventos && !archivada,
      ...(conEventos
        ? { motivoNoEliminar: 'transaccion_con_eventos' as const }
        : archivada
          ? { motivoNoEliminar: 'cuenta_archivada' as const }
          : {}),
      puedeCambiarCuenta: !archivada && !x.conDevoluciones.has(t.id),
      puedeCambiarFecha: {
        minima: apertura[apertura.length - 1] ?? t.fecha,
        maxima: tope,
      },
      lineasConEventos: detalle.filter((d) => d.eventos.length > 0).map((d) => d.linea.id),
      conciliada: t.estadoBancario === 'conciliada',
    },
    esperado: {
      fecha: t.fecha,
      total: t.total,
      comercio: t.comercio,
      nota: t.nota,
      monedaOriginal: t.monedaOriginal,
      montoOriginal: t.montoOriginal,
    },
  };
}
