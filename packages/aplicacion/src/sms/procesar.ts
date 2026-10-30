// OP-35 pasos 2 a 11 sobre un SMS ya guardado (04 §3.6, §8.4, §8.6; ADR-09, N-02; BE-45, BE-62). a: lectura sin
// bloqueo; b: `interpretar()` fuera del bloqueo; c: `confirmar()` del marco, con `escribir()`, que vuelve a mirar bajo
// el bloqueo que el SMS siga sin resultado; d: si algo falla, otro `escribir()` registra el intento `error` y el
// movimiento en `error`. Cada intento es una fila nueva de `sms_procesamientos` (N-02): nunca se sobrescribe.
import { interpretar, type FormatoSms, type Interpretacion } from '@finn/sms';
import {
  escribir as escribirDb,
  escribirTecnico as escribirTecnicoDb,
  guardarProcesamiento,
  leer as leerDb,
  leerDatosDeBandeja,
  leerSmsParaProcesar,
  registrarEvento,
  sanearMensaje,
  smsSinResultado,
  type NuevoEvento,
  type NuevoProcesamiento,
} from '@finn/db';
import type { InterpretacionSms, Movimiento, MovimientoLinea, Uuid } from '@finn/dominio';
import { entradaOp35, type EntradaOp35 } from '../contratos/webhook.ts';
import { uuidv5 } from '../ids.ts';
import {
  confirmar,
  type DefinicionOperacion,
  type DepsMarco,
  type Exito,
} from '../operaciones/marco.ts';
import { notificar, type DepsEnvio } from '../push/enviar.ts';
import { avisoDeMovimiento } from '../push/politica.ts';
import { fechaLocalDeInstante } from '../tiempo/index.ts';

/** BE-62: SMS sin resultado por petición, y el tope de tiempo de la función (`maxDuration` = 30 s). */
export const BARRIDO_POR_PETICION = 5;
export const TOPE_BARRIDO_MS = 20_000;

type Leido = NonNullable<Awaited<ReturnType<typeof leerSmsParaProcesar>>>;
type Resuelto = Leido &
  Pick<Awaited<ReturnType<typeof leerDatosDeBandeja>>, 'reglas'> & {
    readonly movimientos: readonly (Movimiento & { readonly texto: string })[];
  };

/** Lo que el dominio usa de la interpretación (el dominio no importa `@finn/sms`). */
export const paraDominio = (i: Interpretacion): InterpretacionSms =>
  i.resultado === 'reconocido'
    ? {
        resultado: 'reconocido',
        institucionId: i.formato.institucionId as Uuid,
        tipoMovimiento: i.formato.tipoMovimiento,
        ...i.campos,
      }
    : { resultado: 'no_reconocido' };

/** La fila del intento (03 §3.18) con la interpretación de b y el movimiento que escribió el dominio. */
export function intentoDe(
  r: Pick<Leido, 'sms' | 'intentos'>,
  i: Interpretacion,
  res: Exito,
): NuevoProcesamiento {
  const fila = (tabla: string): unknown => {
    const c = res.cambios.find((x) => x.tipo === 'insertar' && x.tabla === tabla);
    return c?.tipo === 'insertar' ? c.fila : undefined;
  };
  // OP-49 reprocesa el mismo movimiento: el dominio lo actualiza (F4) en vez de insertarlo
  const cambio = res.cambios.find((x) => x.tipo === 'actualizar' && x.tabla === 'movimientos');
  const m = (cambio?.tipo === 'actualizar' ? cambio.campos : fila('movimientos')) as Movimiento;
  const linea = fila('movimiento_lineas') as MovimientoLinea | undefined;
  const rec = i.resultado === 'reconocido' ? i : null;
  return {
    smsId: r.sms.id,
    intento: r.intentos + 1,
    resultado: m.estado,
    formatoId: rec?.formato.id ?? null,
    // Varios formatos solo con `no_reconocido` (P3-8): un autodescartado termina en el paso 2, antes de elegir
    formatosCoincidentes:
      m.estado === 'no_reconocido' || i.coincidentes.length <= 1 ? i.coincidentes : [],
    tipoMovimiento: rec?.formato.tipoMovimiento ?? null,
    ultimos4: rec?.campos.ultimos4 ?? null,
    monto: rec?.campos.monto ?? null,
    comercio: rec?.campos.comercio ?? null,
    fecha: rec?.campos.fecha ?? null,
    cuentaId: m.cuentaId,
    esperadaProgramadaId: m.esperadaProgramadaId,
    esperadaFecha: m.esperadaFecha,
    duplicadoTransaccionId: m.duplicadoTransaccionId,
    duplicadoMovimientoId: m.duplicadoMovimientoId,
    categoriaSugeridaId: linea?.categoriaId ?? null,
  };
}

type DepsProcesar = DepsMarco & DepsEnvio;

/** 8.4 e: AV-23 con push; solo después del COMMIT. Sin aviso en `autodescartado`, y nunca con el texto del SMS (11.4). */
async function avisar(m: Parameters<typeof avisoDeMovimiento>[0], d: DepsProcesar): Promise<void> {
  const av = avisoDeMovimiento(m);
  if (av !== null) await notificar(d, av.motivo, av.aviso);
}

/** OP-35 en el marco, con la interpretación hecha fuera del bloqueo (BE-45) y el SMS como id principal (BE-31). */
const op35 = (
  i: Interpretacion,
  d: DepsProcesar,
): DefinicionOperacion<EntradaOp35, Resuelto, null> => ({
  id: 'OP-35',
  contrato: entradaOp35,
  idempotencia: 'natural',
  idPrincipal: (e) => e.smsId as Uuid,
  async comprobarIdempotencia(tx, e) {
    const s = await leerSmsParaProcesar(tx, e.smsId);
    if (s === null) return { tipo: 'no_encontrado' };
    // BE-62: otra petición o la tarea diaria ya le dio un resultado
    return s.intentos === 0 ? { tipo: 'aplicar' } : { tipo: 'ya_aplicada', salida: null };
  },
  async resolver(tx, e) {
    const s = await leerSmsParaProcesar(tx, e.smsId);
    if (s === null) throw new Error(`OP-35: el SMS ${e.smsId} no existe`);
    const b = await leerDatosDeBandeja(tx);
    const textos = new Map(b.sms.map((x) => [x.id, x.texto]));
    const movimientos = b.movimientos.map(({ movimiento: m }) => ({
      ...m,
      texto: textos.get(m.smsId) ?? '',
    }));
    return { ...s, reglas: b.reglas, movimientos };
  },
  comando: (r, _instante, ids) => ({
    operacion: 'OP-35',
    id: ids.siguiente(),
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
  // El marco los corre tras el COMMIT; si uno falla, deja un evento y el movimiento sigue (4.9)
  posteriores: (res) =>
    res.cambios.flatMap((c) =>
      c.tipo === 'insertar' && c.tabla === 'movimientos'
        ? [{ nombre: 'AV-23', ejecutar: () => avisar(c.fila, d) }]
        : [],
    ),
  salida: () => null,
});

const MOVIMIENTO_VACIO = {
  cuentaId: null,
  fecha: null,
  monto: null,
  comercio: null,
  tipoPropuesto: null,
  nota: null,
  duplicadoTransaccionId: null,
  duplicadoMovimientoId: null,
  esperadaProgramadaId: null,
  esperadaFecha: null,
  transaccionId: null,
} as const;

/**
 * Paso d (03 §5.1, nota; N-02): con el bloqueo, el intento `error` y el movimiento en `error` (el mismo id que le daría
 * OP-35). Si el SMS ya tiene resultado, no hace nada; si no obtiene el bloqueo, el SMS queda sin resultado (8.6).
 */
async function registrarError(smsId: string, detalle: string, d: DepsProcesar): Promise<void> {
  const escrito = await (d.escribir ?? escribirDb)(async (tx) => {
    const s = await leerSmsParaProcesar(tx, smsId);
    if (s === null || s.intentos > 0) return null;
    await guardarProcesamiento(tx, {
      smsId,
      intento: 1,
      resultado: 'error',
      errorDetalle: detalle,
    });
    if (s.movimientoId !== null) return null;
    const id = uuidv5('1', smsId);
    const fila = { id, smsId: s.sms.id, estado: 'error', ...MOVIMIENTO_VACIO } as const;
    await tx.aplicarCambios([{ tipo: 'insertar', tabla: 'movimientos', fila }]);
    return fila;
  }, d.opciones?.());
  if (escrito === null) return;
  // 8.4 e: ya pasó el COMMIT. Como en el marco (4.9): si falla, un evento, y ni revierte ni deja el SMS sin resultado
  try {
    await avisar(escrito, d);
  } catch (e) {
    const evento: NuevoEvento = {
      nivel: 'error',
      origen: 'app',
      mensaje: 'EFECTO AV-23 OP-35',
      datos: { mensajeSaneado: sanearMensaje(e instanceof Error ? e.message : '') },
    };
    const guardar = d.registrar
      ? d.registrar(evento)
      : (d.escribirTecnico ?? escribirTecnicoDb)(async (tx) => {
          await registrarEvento(tx, evento);
        }, d.opciones?.());
    await guardar.catch(() => undefined);
  }
}

/**
 * Procesa un SMS guardado (04 §8.4). `cuerpoInvalido` (BE-60) va directo al paso d sin interpretar. Nunca lanza: lo
 * que no se pudo registrar queda sin resultado y lo recupera el barrido o la tarea diaria (8.6); devuelve ese error,
 * para el evento `procesar_fallido` (15.2), o `undefined`.
 */
export async function procesar(
  smsId: string,
  d: DepsProcesar,
  cuerpoInvalido?: string,
): Promise<unknown> {
  let detalle = `cuerpo_invalido: ${cuerpoInvalido ?? ''}`;
  try {
    if (cuerpoInvalido === undefined) {
      // a, sin bloqueo; b, fuera de él (BE-45). Las CHECK de 03 §3.21 fijan separadores y formatos de fecha
      const { texto, formatos } = await (d.leer ?? leerDb)(
        async (tx) => ({
          texto: (await leerSmsParaProcesar(tx, smsId))?.sms.texto ?? '',
          formatos: (await leerDatosDeBandeja(tx)).formatos as unknown as FormatoSms[],
        }),
        d.opciones?.(),
      );
      const r = await confirmar(op35(interpretar(texto, formatos), d), { smsId }, d);
      if (r.ok) return undefined;
      detalle = `${r.error.categoria} ${r.error.codigo}${r.error.idError ? ` ${r.error.idError}` : ''}`;
    }
  } catch (e) {
    detalle = `INTERNO ${sanearMensaje(e instanceof Error ? e.message : '')}`;
  }
  try {
    await registrarError(smsId, detalle.slice(0, 500), d);
    return undefined;
  } catch (e) {
    return e ?? new Error('paso d'); // sin el bloqueo: queda sin resultado (03 §5.1, nota)
  }
}

/** BE-62 (04 §8.6): hasta 5 SMS sin resultado, en orden de llegada, uno por uno, mientras la función tenga tiempo. */
export async function barrer(
  d: DepsProcesar,
  transcurridoMs: () => number,
  alFallar: (smsId: string, e: unknown) => Promise<void>,
): Promise<number> {
  const ids = await (d.leer ?? leerDb)(
    (tx) => smsSinResultado(tx, BARRIDO_POR_PETICION),
    d.opciones?.(),
  );
  let procesados = 0;
  for (const id of ids) {
    if (transcurridoMs() > TOPE_BARRIDO_MS) break;
    const e = await procesar(id, d);
    if (e !== undefined) await alFallar(id, e);
    procesados++;
  }
  return procesados;
}
