// OP-49 Reprocesar un SMS con error (04 §3.6, N-02): pasos 2 a 11 de OP-35 sobre el mismo SMS, con su instante de
// recepción original. Natural (4.6): si el SMS ya tiene un intento más nuevo que `intentoVisto`, `ya_aplicada`. Como en
// OP-35, `interpretar()` va fuera del bloqueo (BE-45): `definirOP49` lee el texto y los formatos y devuelve la definición
// para ese resultado; `reprocesar` la confirma y, si la escritura falla por un error interno, deja un nuevo intento `error`.
import { interpretar, type FormatoSms, type Interpretacion } from '@finn/sms';
import {
  escribir as escribirDb,
  guardarProcesamiento,
  leer as leerDb,
  leerDatosDeBandeja,
  leerSmsParaProcesar,
  sanearMensaje,
} from '@finn/db';
import type { Uuid } from '@finn/dominio';
import { op49, type EntradaOp49, type SalidaOp49 } from '../../contratos/bandeja.ts';
import { errorDeValidacion, type ResultadoAccion } from '../../errores/index.ts';
import { uuidv5 } from '../../ids.ts';
import { intentoDe, paraDominio } from '../../sms/procesar.ts';
import { fechaLocalDeInstante } from '../../tiempo/index.ts';
import { confirmar, ErrorValidacion, type DefinicionOperacion, type DepsMarco } from '../marco.ts';
import { cargarMovimiento, camposDeMovimiento, type ContextoMovimiento } from './comunes.ts';

type Leido = NonNullable<Awaited<ReturnType<typeof leerSmsParaProcesar>>>;
type Resuelto = ContextoMovimiento & Pick<Leido, 'sms' | 'anteriores' | 'intentos'>;

const NO_REPROCESABLE = 'Este SMS no tiene un error que reprocesar.';

/** OP-49 en el marco, con la interpretación hecha fuera del bloqueo; el SMS y el intento visto dan el id principal (BE-31). */
export const OP49 = (
  i: Interpretacion,
): DefinicionOperacion<EntradaOp49, Resuelto, SalidaOp49> => ({
  id: 'OP-49',
  contrato: op49,
  idempotencia: 'natural',
  idPrincipal: (e) => uuidv5(`op49:${e.intentoVisto}`, e.smsId),
  async comprobarIdempotencia(tx, e) {
    const s = await leerSmsParaProcesar(tx, e.smsId);
    if (s === null) return { tipo: 'no_encontrado' };
    if (s.intentos <= e.intentoVisto || s.movimientoId === null) return { tipo: 'aplicar' };
    const c = await cargarMovimiento(tx, s.movimientoId as Uuid);
    if (c === null) return { tipo: 'no_encontrado' };
    return {
      tipo: 'ya_aplicada',
      salida: {
        smsId: e.smsId,
        movimientoId: c.movimiento.id,
        estado: c.movimiento.estado,
        intento: s.intentos,
      },
    };
  },
  async resolver(tx, e) {
    const s = await leerSmsParaProcesar(tx, e.smsId);
    const c = s?.movimientoId ? await cargarMovimiento(tx, s.movimientoId as Uuid) : null;
    if (s === null || c === null) throw new ErrorValidacion('smsId', NO_REPROCESABLE);
    return { ...c, sms: s.sms, anteriores: s.anteriores, intentos: s.intentos };
  },
  comando: (r, _instante, ids) => ({
    operacion: 'OP-49',
    movimiento: r.movimiento,
    lineas: r.lineas,
    ids,
    sms: { ...r.sms, fechaRecepcion: fechaLocalDeInstante(r.sms.recibidoEn) },
    interpretacion: paraDominio(i),
    anteriores: r.anteriores,
    movimientos: r.movimientos,
    reglas: r.reglas,
  }),
  async extra(tx, r, res) {
    await guardarProcesamiento(tx, intentoDe(r, i, res));
  },
  salida: (res, r) => ({
    smsId: r.sms.id as Uuid,
    movimientoId: r.movimiento.id,
    estado: camposDeMovimiento(res.cambios, r.movimiento.id).estado ?? r.movimiento.estado,
    intento: r.intentos + 1,
  }),
});

/** Paso b (BE-45): lee el texto del SMS y los formatos sin bloqueo, interpreta y arma la definición. */
export async function definirOP49(
  smsId: string,
  d: DepsMarco,
): Promise<DefinicionOperacion<EntradaOp49, Resuelto, SalidaOp49>> {
  const { texto, formatos } = await (d.leer ?? leerDb)(
    async (tx) => ({
      texto: (await leerSmsParaProcesar(tx, smsId))?.sms.texto ?? '',
      formatos: (await leerDatosDeBandeja(tx)).formatos as unknown as FormatoSms[],
    }),
    d.opciones?.(),
  );
  return OP49(interpretar(texto, formatos));
}

/** El nuevo intento `error` (N-02): el movimiento ya está en `error`; solo se agrega la fila, sin pisar las anteriores. */
async function registrarErrorDeReproceso(smsId: string, detalle: string, d: DepsMarco) {
  await (d.escribir ?? escribirDb)(async (tx) => {
    const s = await leerSmsParaProcesar(tx, smsId);
    if (s === null) return;
    await guardarProcesamiento(tx, {
      smsId,
      intento: s.intentos + 1,
      resultado: 'error',
      errorDetalle: detalle.slice(0, 500),
    });
  }, d.opciones?.());
}

/** OP-49 completa: interpreta fuera del bloqueo, confirma en el marco y, ante un error interno, deja el intento `error`. */
export async function reprocesar(
  cruda: unknown,
  d: DepsMarco,
): Promise<ResultadoAccion<SalidaOp49>> {
  const analizada = op49.safeParse(cruda);
  if (!analizada.success) return { ok: false, error: errorDeValidacion(analizada.error.issues) };
  const r = await confirmar(await definirOP49(analizada.data.smsId, d), cruda, d);
  if (!r.ok && r.error.categoria === 'INTERNO') {
    const detalle = `INTERNO ${r.error.codigo} ${sanearMensaje(r.error.mensaje)}`;
    await registrarErrorDeReproceso(analizada.data.smsId, detalle, d).catch(() => undefined);
  }
  return r;
}
