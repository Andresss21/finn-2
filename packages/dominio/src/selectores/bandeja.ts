// Bandeja de SMS (04 §6.8): los movimientos con su aprobación posible (precondiciones de OP-37 y
// exclusiones de OP-38), la cuenta de origen propuesta para un pago de tarjeta (BE-41) y los datos del
// arrastre (CF-22). Los movimientos, los SMS y sus procesamientos son [H] e [I]: llegan como parámetro.
import { estadoDe, periodoDe } from '../calculo/periodos';
import type {
  EstadoMovimiento,
  FormatoBancario,
  Instante,
  Instantanea,
  Movimiento,
  MovimientoLinea,
  ReglaComercio,
  TipoTransaccion,
  Uuid,
} from '../hechos';
import type { Centavos } from '../valores/centavos';
import { FechaLocal } from '../valores/fecha-local';
import { claveDe, indice } from './actividad';
import { nombres, type Ref } from './comunes';
import { porOrden } from './estructura';
import { ARRASTRE_FRECUENTES_DIAS, ARRASTRE_FRECUENTES_MAX } from './reportes/umbrales';
import { sugerencia } from './sugerencia';

export interface SmsDeBandeja {
  readonly id: Uuid;
  readonly texto: string;
  readonly remitente: string;
  readonly recibidoEn: Instante;
}

/** El último intento de procesamiento de un SMS ([I]). */
export interface ProcesamientoDeSms {
  readonly smsId: Uuid;
  readonly intento: number;
  readonly resultado: string;
  readonly formatoId?: Uuid;
  readonly formatosCoincidentes: readonly Uuid[];
  /** Detalle ya saneado (7.8). */
  readonly errorDetalle?: string;
}

export interface DatosDeBandeja {
  readonly movimientos: readonly {
    readonly movimiento: Movimiento;
    readonly lineas: readonly MovimientoLinea[];
  }[];
  readonly sms: readonly SmsDeBandeja[];
  readonly procesamientos: readonly ProcesamientoDeSms[];
  readonly formatos: readonly FormatoBancario[];
  readonly reglas: readonly ReglaComercio[];
}

export interface OpcionesDeBandeja {
  readonly vista?: 'activos' | 'descartados';
  readonly cursor?: string;
  /** Tamaño de página de los descartados (por defecto 50). */
  readonly limite?: number;
}

type Faltante = 'cuenta' | 'fecha' | 'monto' | 'tipo' | 'destino' | 'origen';

export interface AprobacionDto {
  readonly posible: boolean;
  readonly faltantes: readonly Faltante[];
  readonly requiereConfirmacion: boolean;
  readonly elegibleAprobarTodos: boolean;
  readonly motivoNoElegible?: string;
  readonly arrastrable: boolean;
}

const ACTIVOS = new Set([
  'pendiente',
  'con_coincidencia',
  'posible_duplicado',
  'no_reconocido',
  'error',
]);
/** Los activos de la bandeja: todos, hasta este máximo (04 §6.8). */
const MAXIMO_ACTIVOS = 200;
/** Estados desde los que OP-37 aprueba (`error` es OP-50). */
const APROBABLES = new Set(['pendiente', 'con_coincidencia', 'no_reconocido', 'error']);

/**
 * BE-41: la cuenta de efectivo del último pago a la tarjeta (por fecha, clave de orden y secuencia),
 * si sigue abierta. Sin pagos anteriores o con la cuenta archivada, no hay propuesta.
 */
export function origenPropuestoPagoTarjeta(i: Instantanea, tarjetaId: Uuid): Ref | undefined {
  const x = indice(i);
  const efectos = (id: Uuid) => x.efectos.get(id) ?? [];
  const [ultimo] = i.hechos.transacciones
    .filter(
      (t) =>
        t.tipo === 'pago_tarjeta' &&
        efectos(t.id).some((e) => e.cuentaId === tarjetaId && e.monto > 0),
    )
    .sort((a, b) => (claveDe(a) < claveDe(b) ? 1 : -1));
  const origen = ultimo === undefined ? undefined : efectos(ultimo.id).find((e) => e.monto < 0);
  if (origen === undefined) return undefined;
  const ref = nombres(i).cuenta(origen.cuentaId);
  return ref.archivada === true ? undefined : ref;
}

/** Las categorías normales y activas, en el orden del presupuesto (grupo y categoría). */
function normalesPorOrden(i: Instantanea) {
  return [...i.hechos.grupos]
    .sort(porOrden)
    .flatMap((g) =>
      i.hechos.categorias
        .filter((c) => c.grupoId === g.id && c.clase === 'normal' && !c.archivada)
        .sort(porOrden),
    );
}

/** CF-22: frecuentes (líneas de gastos de los últimos 90 días) y todas las normales por grupo. */
export function destinosDeArrastre(i: Instantanea) {
  const n = nombres(i);
  const normales = normalesPorOrden(i);
  const desde = FechaLocal.sumarDias(i.hoy, 1 - ARRASTRE_FRECUENTES_DIAS);
  const x = indice(i);
  const cuentas = new Map<Uuid, { veces: number; reciente: string }>();
  for (const t of i.hechos.transacciones) {
    if (t.tipo !== 'gasto' || t.fecha < desde || t.fecha > i.hoy) continue;
    for (const l of x.lineas.get(t.id) ?? []) {
      if (l.categoriaId === null) continue;
      const c = cuentas.get(l.categoriaId) ?? { veces: 0, reciente: '' };
      c.veces += 1;
      if (claveDe(t) > c.reciente) c.reciente = claveDe(t);
      cuentas.set(l.categoriaId, c);
    }
  }
  const conHistorial = normales
    .flatMap((c, pos) => {
      const u = cuentas.get(c.id);
      return u === undefined ? [] : [{ c, pos, ...u }];
    })
    .sort(
      (a, b) =>
        b.veces - a.veces ||
        (a.reciente < b.reciente ? 1 : a.reciente > b.reciente ? -1 : 0) ||
        a.pos - b.pos,
    )
    .map((x) => x.c);
  const frecuentes = (conHistorial.length > 0 ? conHistorial : normales).slice(
    0,
    ARRASTRE_FRECUENTES_MAX,
  );
  return {
    frecuentes: frecuentes.map((c) => n.categoria(c.id)),
    grupos: [...i.hechos.grupos]
      .sort(porOrden)
      .map((g) => ({
        grupo: n.grupo(g.id),
        categorias: normales.filter((c) => c.grupoId === g.id).map((c) => n.categoria(c.id)),
      }))
      .filter((g) => g.categorias.length > 0),
  };
}

function aprobacionDe(
  i: Instantanea,
  m: Movimiento,
  lineas: readonly MovimientoLinea[],
  origen: Ref | undefined,
): AprobacionDto {
  const sinDestino =
    lineas.length === 0 ||
    lineas.some((l) => l.categoriaId === null && l.deudorId === null && l.lineaOriginalId === null);
  const faltantes: Faltante[] = [];
  if (m.cuentaId === null) faltantes.push('cuenta');
  if (m.fecha === null) faltantes.push('fecha');
  if (m.monto === null) faltantes.push('monto');
  if (m.tipoPropuesto === null) faltantes.push('tipo');
  if (m.tipoPropuesto === 'gasto' && sinDestino) faltantes.push('destino');
  if (m.tipoPropuesto === 'pago_tarjeta' && m.cuentaId !== null && origen === undefined)
    faltantes.push('origen');
  const archivada = m.cuentaId !== null && nombres(i).cuenta(m.cuentaId).archivada === true;
  const posible = APROBABLES.has(m.estado) && faltantes.length === 0 && !archivada;
  const requiereConfirmacion =
    m.fecha !== null && estadoDe(periodoDe(i.ciclo, m.fecha), i.hoy) === 'cerrado';
  const motivo =
    m.estado !== 'pendiente'
      ? 'movimiento_estado_no_valido'
      : m.tipoPropuesto === 'pago_tarjeta'
        ? 'pago_sin_origen'
        : m.cuentaId === null
          ? 'movimiento_sin_cuenta'
          : archivada
            ? 'cuenta_archivada'
            : faltantes.includes('destino')
              ? 'linea_sin_destino'
              : faltantes.length > 0
                ? 'movimiento_incompleto'
                : requiereConfirmacion
                  ? 'requiere_revision_individual'
                  : undefined;
  const elegible = motivo === undefined;
  const [unica, ...otras] = lineas;
  return {
    posible,
    faltantes,
    requiereConfirmacion,
    elegibleAprobarTodos: elegible,
    ...(elegible ? {} : { motivoNoElegible: motivo }),
    arrastrable:
      m.estado === 'pendiente' &&
      m.tipoPropuesto === 'gasto' &&
      otras.length === 0 &&
      (unica === undefined || (unica.deudorId === null && unica.lineaOriginalId === null)),
  };
}

export interface MovimientoDto {
  readonly id: Uuid;
  readonly estado: EstadoMovimiento;
  readonly sms: SmsDeBandeja;
  readonly procesamiento: {
    readonly intento: number;
    readonly resultado: string;
    readonly formato?: string;
    readonly formatosCoincidentes: readonly string[];
    readonly errorDetalle?: string;
  };
  readonly cuenta: Ref | null;
  readonly fecha: FechaLocal | null;
  readonly monto: Centavos | null;
  readonly comercio: string | null;
  readonly tipoPropuesto: TipoTransaccion | null;
  readonly nota: string | null;
  readonly lineas: readonly {
    readonly monto: Centavos;
    readonly destino:
      (Ref & { readonly tipo: 'categoria' | 'deudor' }) | { readonly lineaOriginalId: Uuid } | null;
  }[];
  readonly categoriaSugerida: (Ref & { readonly porRegla: boolean }) | null;
  readonly coincidencia?: {
    readonly programada: Ref;
    readonly fechaEsperada: FechaLocal;
    readonly montoEsperado: Centavos;
    readonly ocurrencia: 'pendiente' | 'registrada';
    readonly transaccionRegistradaId?: Uuid;
  };
  readonly duplicado?: {
    readonly tipo: 'transaccion' | 'movimiento';
    readonly id: Uuid;
    readonly fecha: FechaLocal;
    readonly monto: Centavos;
    readonly comercio: string | null;
    readonly cuenta: Ref | null;
  };
  /** Solo en un pago de tarjeta (BE-41). */
  readonly origenPropuesto?: Ref;
  readonly aprobacion: AprobacionDto;
  /** Los valores vigentes del movimiento, para OP-36. */
  readonly esperado: Readonly<Record<string, unknown>>;
}

export function movimientoDeBandeja(
  i: Instantanea,
  d: DatosDeBandeja,
  m: Movimiento,
  lineas: readonly MovimientoLinea[],
): MovimientoDto {
  const h = i.hechos;
  const n = nombres(i);
  const sms = d.sms.find((s) => s.id === m.smsId);
  if (sms === undefined) throw new RangeError(`el movimiento ${m.id} no tiene SMS`);
  const proc = d.procesamientos.find((p) => p.smsId === m.smsId);
  const formato = (id: Uuid) => d.formatos.find((f) => f.id === id)?.nombre ?? '';
  const cuenta = m.cuentaId === null ? null : n.cuenta(m.cuentaId);
  const ordenadas = [...lineas].sort((a, b) => a.orden - b.orden);
  const origen =
    m.tipoPropuesto === 'pago_tarjeta' && m.cuentaId !== null
      ? origenPropuestoPagoTarjeta(i, m.cuentaId)
      : undefined;
  const programada = h.programadas.find((p) => p.id === m.esperadaProgramadaId);
  const resuelta = h.ocurrencias_resueltas.find(
    (o) => o.programadaId === m.esperadaProgramadaId && o.fechaEsperada === m.esperadaFecha,
  );
  const dupTx = h.transacciones.find((t) => t.id === m.duplicadoTransaccionId);
  const dupMov = d.movimientos.find((x) => x.movimiento.id === m.duplicadoMovimientoId)?.movimiento;
  const sugerida =
    m.comercio === null || !ACTIVOS.has(m.estado) ? null : sugerencia(i, d.reglas, m.comercio);
  const cuentaDeTx = (id: Uuid) => {
    const efectos = indice(i).efectos.get(id) ?? [];
    const e = efectos.find((x) => x.cuentaId === m.cuentaId) ?? efectos[0];
    return e === undefined ? null : n.cuenta(e.cuentaId);
  };
  return {
    id: m.id,
    estado: m.estado,
    sms: { id: sms.id, texto: sms.texto, remitente: sms.remitente, recibidoEn: sms.recibidoEn },
    procesamiento: {
      intento: proc?.intento ?? 0,
      resultado: proc?.resultado ?? '',
      ...(proc?.formatoId === undefined ? {} : { formato: formato(proc.formatoId) }),
      formatosCoincidentes: (proc?.formatosCoincidentes ?? []).map(formato),
      ...(proc?.errorDetalle === undefined ? {} : { errorDetalle: proc.errorDetalle }),
    },
    cuenta,
    fecha: m.fecha,
    monto: m.monto,
    comercio: m.comercio,
    tipoPropuesto: m.tipoPropuesto,
    nota: m.nota,
    lineas: ordenadas.map((l) => ({
      monto: l.monto,
      destino:
        l.categoriaId !== null
          ? { ...n.categoria(l.categoriaId), tipo: 'categoria' as const }
          : l.deudorId !== null
            ? {
                id: l.deudorId,
                nombre: h.deudores.find((x) => x.id === l.deudorId)?.nombre ?? '',
                tipo: 'deudor' as const,
              }
            : l.lineaOriginalId !== null
              ? { lineaOriginalId: l.lineaOriginalId }
              : null,
    })),
    categoriaSugerida:
      sugerida === null ? null : { ...sugerida.categoria, porRegla: sugerida.origen === 'regla' },
    ...(programada === undefined || m.esperadaFecha === null
      ? {}
      : {
          coincidencia: {
            programada: { id: programada.id, nombre: programada.comercio },
            fechaEsperada: m.esperadaFecha,
            montoEsperado: programada.monto,
            ocurrencia:
              resuelta?.estado === 'registrada' ? ('registrada' as const) : ('pendiente' as const),
            ...(resuelta?.estado === 'registrada' && resuelta.transaccionId !== null
              ? { transaccionRegistradaId: resuelta.transaccionId }
              : {}),
          },
        }),
    ...(dupTx !== undefined
      ? {
          duplicado: {
            tipo: 'transaccion' as const,
            id: dupTx.id,
            fecha: dupTx.fecha,
            monto: dupTx.total,
            comercio: dupTx.comercio,
            cuenta: cuentaDeTx(dupTx.id),
          },
        }
      : dupMov !== undefined && dupMov.fecha !== null && dupMov.monto !== null
        ? {
            duplicado: {
              tipo: 'movimiento' as const,
              id: dupMov.id,
              fecha: dupMov.fecha,
              monto: dupMov.monto,
              comercio: dupMov.comercio,
              cuenta: dupMov.cuentaId === null ? null : n.cuenta(dupMov.cuentaId),
            },
          }
        : {}),
    ...(origen === undefined ? {} : { origenPropuesto: origen }),
    aprobacion: aprobacionDe(i, m, ordenadas, origen),
    esperado: {
      cuentaId: m.cuentaId,
      fecha: m.fecha,
      monto: m.monto,
      comercio: m.comercio,
      tipoPropuesto: m.tipoPropuesto,
      nota: m.nota,
      lineas: ordenadas.map((l) => ({
        monto: l.monto,
        categoriaId: l.categoriaId,
        deudorId: l.deudorId,
        lineaOriginalId: l.lineaOriginalId,
      })),
    },
  };
}

/** `consultas.bandeja` (6.8): sin `Encabezado`, que agrega la consulta. */
export function bandeja(i: Instantanea, d: DatosDeBandeja, o: OpcionesDeBandeja = {}) {
  const recibido = new Map(d.sms.map((s) => [s.id, s.recibidoEn]));
  // La clave de orden de la bandeja y del cursor: recepción del SMS e id del movimiento.
  const filas = d.movimientos.flatMap((x) => {
    const en = recibido.get(x.movimiento.smsId);
    return en === undefined ? [] : [{ ...x, clave: `${en}|${x.movimiento.id}` }];
  });
  const porClave = (a: { clave: string }, b: { clave: string }) =>
    a.clave < b.clave ? -1 : a.clave > b.clave ? 1 : 0;
  const dto = (x: (typeof filas)[number]) => movimientoDeBandeja(i, d, x.movimiento, x.lineas);
  const activos = filas.filter((x) => ACTIVOS.has(x.movimiento.estado)).sort(porClave);
  const de = (e: string) => activos.filter((x) => x.movimiento.estado === e).length;
  const dtos = activos.map(dto);
  const base = {
    contadores: {
      pendientes: de('pendiente'),
      conCoincidencia: de('con_coincidencia'),
      posiblesDuplicados: de('posible_duplicado'),
      noReconocidos: de('no_reconocido'),
      errores: de('error'),
    },
    elegiblesAprobarTodos: dtos.filter((m) => m.aprobacion.elegibleAprobarTodos).map((m) => m.id),
    destinosArrastre: destinosDeArrastre(i),
  };
  if (o.vista !== 'descartados') return { ...base, movimientos: dtos.slice(0, MAXIMO_ACTIVOS) };

  const limite = o.limite ?? 50;
  const cursor = o.cursor;
  const descartados = filas
    .filter((x) => x.movimiento.estado === 'descartado' || x.movimiento.estado === 'autodescartado')
    .sort((a, b) => porClave(b, a))
    .filter((x) => cursor === undefined || x.clave < cursor);
  const pagina = descartados.slice(0, limite);
  const ultima = pagina[pagina.length - 1];
  return {
    ...base,
    movimientos: pagina.map(dto),
    ...(descartados.length > limite && ultima !== undefined
      ? { siguienteCursor: ultima.clave }
      : {}),
  };
}
