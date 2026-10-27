// OP-37 Aprobar movimiento (01 §5.6, §7.1; 04 §3.6; error 9, M2, P11, D2) y su variante "aprobar con
// categoría" (CF-21). Ejecuta la operación de su tipo con origen SMS y hora de registro = clave de
// orden = recepción del SMS (D2). Con coincidencia: empareja la esperada pendiente con la transacción
// nueva, o se vincula a la que la programada ya registró y le da el monto del SMS con OP-28 (B-9).
import type * as H from '../hechos';
import type { Centavos } from '../valores/centavos';
import type { FechaLocal } from '../valores/fecha-local';
import type { Efecto } from './aplicar';
import { buscar } from './op-07';
import { op20 } from './op-20';
import { op21 } from './op-21';
import { op23 } from './op-23';
import { op28 } from './op-28';
import { categoriaActiva, estadoNoValido } from './op-36';
import { esRechazo, rechazo } from './rechazos';

type R = H.Rechazo;
type Aprobacion = Omit<H.ComandoOp37, 'operacion'>;
type Lineas = readonly H.MovimientoLinea[];

/** Estados desde los que se aprueba (04 OP-37; `error` es OP-50, la misma operación). */
const APROBABLES = new Set(['pendiente', 'con_coincidencia', 'no_reconocido', 'error']);

/** PM: el movimiento aprobado, vinculado a su transacción. */
const aprobado = (m: H.Movimiento, transaccionId: H.Uuid): H.Cambio => ({
  ...{ tipo: 'actualizar', tabla: 'movimientos', id: m.id },
  campos: { estado: 'aprobado', transaccionId },
});

/** "Recordar esta categoría para este comercio": F3 o F4 de la regla (patrón sin mayúsculas, OP-41). */
function recordar(h: H.Hechos, x: Aprobacion, lineas: Lineas): H.Cambio[] | R {
  const [l, ...resto] = lineas;
  const patron = x.movimiento.comercio;
  if (x.recordarRegla !== true || patron === null || l?.categoriaId == null || resto.length > 0)
    return [];
  if (x.reglas === undefined) throw new TypeError(`OP-37 ${x.movimiento.id}: faltan las reglas`);
  const c = categoriaActiva(h, l.categoriaId);
  if (esRechazo(c)) return c;
  const previa = x.reglas.find((y) => y.patron.toLowerCase() === patron.toLowerCase());
  if (previa?.categoriaId === c.id) return [];
  const tabla = 'reglas_comercio';
  if (previa) return [{ tipo: 'actualizar', tabla, id: previa.id, campos: { categoriaId: c.id } }];
  return [{ tipo: 'insertar', tabla, fila: { id: x.ids.siguiente(), patron, categoriaId: c.id } }];
}

/** La operación del tipo (04 §3.6, tabla de OP-37), con los datos que toma del movimiento. */
function ejecutarTipo(
  antes: H.Instantanea,
  x: Aprobacion,
  m: { readonly cuentaId: H.Uuid; readonly fecha: FechaLocal; readonly total: Centavos },
  lineas: Lineas,
): Efecto | R {
  const { id, recibidoEn: instante, ids, movimiento: v } = x;
  const comun = { id, instante, ids, fecha: m.fecha, total: m.total, origen: 'sms' } as const;
  const { cuentaId } = m;
  switch (v.tipoPropuesto) {
    case 'gasto': {
      const sin = lineas.find((l) => l.categoriaId === null && l.deudorId === null);
      if (sin !== undefined) return { codigo: 'linea_sin_destino', datos: { lineaId: sin.id } };
      const destino = ({ categoriaId: c, deudorId: d }: H.MovimientoLinea) =>
        c !== null ? { categoriaId: c } : { deudorId: d as H.Uuid };
      return op20(antes, {
        ...{ operacion: 'OP-20', ...comun, cuentaId },
        ...(v.comercio !== null && { comercio: v.comercio }),
        ...(v.nota !== null && { nota: v.nota }),
        lineas: lineas.map((l) => ({ monto: l.monto, destino: destino(l) })),
      });
    }
    case 'ingreso':
      return op21(antes, { operacion: 'OP-21', ...comun, cuentaId });
    case 'pago_tarjeta':
      // El origen no lo informa el SMS (03 §3.19): llega en la entrada.
      if (x.origenId === undefined) throw new TypeError(`OP-37 ${v.id}: pago sin origenId`);
      return op23(antes, {
        operacion: 'OP-23',
        ...comun,
        origenId: x.origenId,
        tarjetaId: cuentaId,
      });
    default:
      // `devolucion` ejecuta OP-33a u OP-33b, que todavía no existen (TA-138).
      throw new TypeError(`OP-37 ${v.id}: tipo ${v.tipoPropuesto} sin operación`);
  }
}

export function op37(antes: H.Instantanea, x: Aprobacion): Efecto | R {
  const { hechos: h } = antes;
  const m = x.movimiento;
  let lineas = x.lineas;
  const previos: H.Cambio[] = [];

  // CF-21: precondiciones propias, la categoría y, si hay monto, la única línea hacia ella.
  if (x.categoriaId !== undefined) {
    if (x.recordarRegla !== undefined) throw new TypeError(`OP-37 ${m.id}: recordarRegla en CF-21`);
    const [l, ...resto] = lineas;
    const otra = l !== undefined && (l.deudorId !== null || l.lineaOriginalId !== null);
    if (m.estado !== 'pendiente' || m.tipoPropuesto !== 'gasto' || resto.length > 0 || otra)
      return { codigo: 'arrastre_no_permitido', datos: { movimientoId: m.id } };
    const c = categoriaActiva(h, x.categoriaId);
    if (esRechazo(c)) return c;
    if (m.monto !== null) {
      const fila = { id: x.ids.siguiente(), movimientoId: m.id, orden: (l?.orden ?? 0) + 1 };
      const nueva = { ...fila, monto: m.monto, categoriaId: c.id, deudorId: null };
      const linea = { ...nueva, lineaOriginalId: null };
      lineas = [linea];
      if (l !== undefined) previos.push({ tipo: 'eliminar', tabla: 'movimiento_lineas', id: l.id });
      previos.push({ tipo: 'insertar', tabla: 'movimiento_lineas', fila: linea });
    }
  }

  if (!APROBABLES.has(m.estado)) return estadoNoValido(m);
  if (m.cuentaId === null)
    return { codigo: 'movimiento_sin_cuenta', datos: { movimientoId: m.id } };
  const { fecha, monto: total, tipoPropuesto: tipo } = m;
  if (fecha === null || total === null || tipo === null) {
    const campos = Object.entries({ fecha, monto: total, tipo }).filter((e) => e[1] === null);
    return {
      codigo: 'movimiento_incompleto',
      datos: { campos: campos.map((e) => e[0]).join(', ') },
    };
  }
  const k = buscar(h.cuentas, m.cuentaId, 'cuentas');
  if (esRechazo(k)) return k;
  if (k.archivada) return rechazo('cuenta_archivada', { cuentaId: k.id });

  // M2: la esperada propuesta; si ya se resolvió de otra forma, la coincidencia quedó vieja.
  const { esperadaProgramadaId: programadaId, esperadaFecha: fechaEsperada } = m;
  const coincide = m.estado === 'con_coincidencia';
  const resuelta = h.ocurrencias_resueltas.find(
    (o) => o.programadaId === programadaId && o.fechaEsperada === fechaEsperada,
  );
  const registrada = resuelta?.estado === 'registrada' ? resuelta.transaccionId : null;
  if (coincide && (programadaId === null || fechaEsperada === null || (resuelta && !registrada)))
    return { codigo: 'conflicto_desactualizado', campo: 'esperada' };

  const regla = recordar(h, x, lineas);
  if (esRechazo(regla)) return regla;

  // Sobre la transacción ya registrada: no se crea otra; su total pasa a ser el del SMS (OP-28).
  if (coincide && resuelta && registrada) {
    const { instante, ids } = x;
    const e = op28(antes, { operacion: 'OP-28', transaccionId: registrada, instante, ids, total });
    if (esRechazo(e)) return e;
    const emparejada: H.Cambio = {
      ...{ tipo: 'actualizar', tabla: 'ocurrencias_resueltas', id: resuelta.id },
      campos: { estado: 'emparejada' },
    };
    return { ...e, cambios: [...e.cambios, emparejada, aprobado(m, registrada), ...regla] };
  }

  const e = ejecutarTipo(antes, x, { cuentaId: k.id, fecha, total }, lineas);
  if (esRechazo(e)) return e;
  const cambios = [...previos, ...e.cambios];
  if (coincide && programadaId !== null && fechaEsperada !== null) {
    const fila = { id: x.ids.siguiente(), programadaId, fechaEsperada, transaccionId: x.id };
    const ocurrencia = { ...fila, estado: 'emparejada', revision: null } as const;
    cambios.push({ tipo: 'insertar', tabla: 'ocurrencias_resueltas', fila: ocurrencia });
  }
  return { ...e, cambios: [...cambios, aprobado(m, x.id), ...regla] };
}
