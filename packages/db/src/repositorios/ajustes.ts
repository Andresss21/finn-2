// Lectura de Ajustes (04 §6.11): `formatos_bancarios` e `instituciones` [H], el conteo de `sms_procesamientos` por
// formato [I] y [T] (`token_webhook`, `suscripciones_push`, `estado_respaldo`, `eventos_sistema`). Nunca devuelve el
// hash del token ni las claves de las suscripciones. Instantes como texto ISO UTC (04 §13.1).
import { ahoraDb } from '../ahora.ts';
import { instanteDeDate } from '../mapeo/fechas.ts';
import { txPrisma, type LectorTx } from '../transacciones.ts';

/** Un respaldo con más de 36 horas está atrasado (ADR-11, ADR-22); una restauración, con más de 35 días (03 §7.5). */
const HORAS_RESPALDO = 36;
const DIAS_RESTAURACION = 35;
const HORA_MS = 3_600_000;
const DIA_MS = 24 * HORA_MS;
/** Eventos del diagnóstico (04 §15): los 50 últimos. */
const DIAGNOSTICO_MAX = 50;

/** Dominio del servicio de push y los últimos 8 caracteres del endpoint (04 §6.11). */
function endpointCorto(endpoint: string): string {
  let host = '';
  try {
    host = new URL(endpoint).host;
  } catch {
    // un endpoint que no es URL solo muestra su final
  }
  return `${host}…${endpoint.slice(-8)}`;
}

const instanteONulo = (d: Date | null | undefined): string | null =>
  d === null || d === undefined ? null : instanteDeDate(d);

export async function leerAjustesTecnicos(tx: LectorTx) {
  const p = txPrisma(tx);
  const ahora = await ahoraDb(tx);
  const token = await p.tokenWebhook.findUnique({ where: { id: 1 } });
  const instituciones = await p.institucion.findMany({
    orderBy: [{ nombre: 'asc' }, { id: 'asc' }],
  });
  const formatos = await p.formatoBancario.findMany({
    orderBy: [{ nombre: 'asc' }, { id: 'asc' }],
  });
  const usos = await p.smsProcesamiento.groupBy({
    by: ['formatoId'],
    where: { formatoId: { not: null } },
    _count: { _all: true },
    _max: { procesadoEn: true },
  });
  const suscripciones = await p.suscripcionPush.findMany({
    orderBy: [{ creadaEn: 'asc' }, { id: 'asc' }],
  });
  const respaldo = await p.estadoRespaldo.findUnique({ where: { id: 1 } });
  const eventos = await p.eventoSistema.findMany({
    where: { nivel: { in: ['aviso', 'error'] } },
    orderBy: [{ ocurridoEn: 'desc' }, { id: 'desc' }],
    take: DIAGNOSTICO_MAX,
  });
  // Sin respaldo o sin restauración registrados no hay nada que cuente: se avisa
  const atrasado = (en: Date | null | undefined, plazoMs: number): boolean =>
    en === null || en === undefined || ahora.getTime() - en.getTime() > plazoMs;
  return {
    webhook: token === null ? null : { rotadoEn: instanteDeDate(token.creadoEn) },
    instituciones: instituciones.map((i) => ({ id: i.id, nombre: i.nombre })),
    formatos: formatos.map((f) => {
      const u = usos.find((x) => x.formatoId === f.id);
      return {
        id: f.id,
        institucionId: f.institucionId,
        nombre: f.nombre,
        tipoMovimiento: f.tipoMovimiento,
        activo: f.activo,
        usos: u?._count._all ?? 0,
        ultimoUso: instanteONulo(u?._max.procesadoEn),
      };
    }),
    suscripciones: suscripciones.map((s) => ({
      endpointCorto: endpointCorto(s.endpoint),
      agente: s.agente,
      renovadaEn: instanteDeDate(s.renovadaEn),
    })),
    respaldo: {
      ultimoRespaldoEn: instanteONulo(respaldo?.ultimoRespaldoEn),
      ultimaRestauracionEn: instanteONulo(respaldo?.ultimaRestauracionEn),
      respaldoAtrasado: atrasado(respaldo?.ultimoRespaldoEn, HORAS_RESPALDO * HORA_MS),
      restauracionAtrasada: atrasado(respaldo?.ultimaRestauracionEn, DIAS_RESTAURACION * DIA_MS),
    },
    diagnostico: eventos.map((e) => {
      const idError =
        typeof e.datos === 'object' && e.datos !== null && !Array.isArray(e.datos)
          ? e.datos['idError']
          : undefined;
      return {
        ocurridoEn: instanteDeDate(e.ocurridoEn),
        nivel: e.nivel as 'aviso' | 'error',
        origen: e.origen,
        mensaje: e.mensaje,
        idError: typeof idError === 'string' ? idError : null,
      };
    }),
  };
}
