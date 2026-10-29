// Lectura de la bandeja de SMS (04 §6.8): `movimientos` y `movimiento_lineas` [H], `sms_recibidos` y el último
// `sms_procesamientos` de cada SMS [I], y `formatos_bancarios` [H] (nombres). No entran en la instantánea del motor:
// la consulta se los pasa al selector `bandeja`, que es puro. Fechas e instantes salen como texto (04 §13.2).
import type { FormatoBancario, Instante, Movimiento, MovimientoLinea, Uuid } from '@finn/dominio';
import { fechaLocalDeDate, instanteDeDate } from '../mapeo/fechas.ts';
import { txPrisma, type LectorTx } from '../transacciones.ts';
import { leerReglasComercio } from './reglas.ts';

const uuid = (t: string): Uuid => t as Uuid;
const uuidONulo = (t: string | null): Uuid | null => (t === null ? null : uuid(t));
const fecha = (d: Date | null) => (d === null ? null : fechaLocalDeDate(d));

/** Lo que el selector `bandeja` recibe como parámetro. */
export async function leerDatosDeBandeja(tx: LectorTx) {
  const p = txPrisma(tx);
  const movimientos = await p.movimiento.findMany({ orderBy: { id: 'asc' } });
  const lineas = await p.movimientoLinea.findMany({
    orderBy: [{ movimientoId: 'asc' }, { orden: 'asc' }],
  });
  const sms = await p.smsRecibido.findMany({
    where: { id: { in: movimientos.map((m) => m.smsId) } },
    orderBy: { id: 'asc' },
  });
  // El resultado vigente de cada SMS: el intento más alto (03 §3.18)
  const procesamientos = await p.smsProcesamiento.findMany({
    where: { smsId: { in: sms.map((s) => s.id) } },
    distinct: ['smsId'],
    orderBy: [{ smsId: 'asc' }, { intento: 'desc' }],
  });
  const formatos = await p.formatoBancario.findMany({ orderBy: { id: 'asc' } });
  const reglas = await leerReglasComercio(tx);
  return {
    movimientos: movimientos.map((m) => ({
      movimiento: {
        id: uuid(m.id),
        smsId: uuid(m.smsId),
        estado: m.estado,
        cuentaId: uuidONulo(m.cuentaId),
        fecha: fecha(m.fecha),
        monto: m.monto as Movimiento['monto'],
        comercio: m.comercio,
        tipoPropuesto: m.tipoPropuesto,
        nota: m.nota,
        duplicadoTransaccionId: uuidONulo(m.duplicadoTransaccionId),
        duplicadoMovimientoId: uuidONulo(m.duplicadoMovimientoId),
        esperadaProgramadaId: uuidONulo(m.esperadaProgramadaId),
        esperadaFecha: fecha(m.esperadaFecha),
        transaccionId: uuidONulo(m.transaccionId),
      } satisfies Movimiento,
      lineas: lineas
        .filter((l) => l.movimientoId === m.id)
        .map(
          (l) =>
            ({
              id: uuid(l.id),
              movimientoId: uuid(l.movimientoId),
              orden: l.orden,
              monto: l.monto as MovimientoLinea['monto'],
              categoriaId: uuidONulo(l.categoriaId),
              deudorId: uuidONulo(l.deudorId),
              lineaOriginalId: uuidONulo(l.lineaOriginalId),
            }) satisfies MovimientoLinea,
        ),
    })),
    sms: sms.map((s) => ({
      id: uuid(s.id),
      texto: s.texto,
      remitente: s.remitente,
      recibidoEn: instanteDeDate(s.recibidoEn) as Instante,
    })),
    procesamientos: procesamientos.map((x) => ({
      smsId: uuid(x.smsId),
      intento: x.intento,
      resultado: x.resultado,
      ...(x.formatoId === null ? {} : { formatoId: uuid(x.formatoId) }),
      formatosCoincidentes: x.formatosCoincidentes.map(uuid),
      ...(x.errorDetalle === null ? {} : { errorDetalle: x.errorDetalle }),
    })),
    formatos: formatos.map(
      (f) =>
        ({
          id: uuid(f.id),
          institucionId: uuid(f.institucionId),
          nombre: f.nombre,
          tipoMovimiento: f.tipoMovimiento,
          patron: f.patron,
          banderas: f.banderas,
          montoSeparadorMiles: f.montoSeparadorMiles,
          montoSeparadorDecimal: f.montoSeparadorDecimal,
          formatosFecha: f.formatosFecha,
          activo: f.activo,
        }) satisfies FormatoBancario,
    ),
    reglas,
  };
}
