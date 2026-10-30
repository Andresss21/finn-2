// OP-38 Aprobar todos (04 §3.6, §4.8; RT-03): un `escribir()` por movimiento, en el orden de la entrada y en serie; cada
// uno toma el bloqueo, aplica y confirma por separado, y un fallo no revierte a los demás. Cada elemento es OP-37 con
// las exclusiones del lote: solo `pendiente`, nada de `pago_tarjeta` (necesita `origenId`) y nada que exija
// confirmación (AV-01, retroactivo). Los que no se aprueban quedan como están y AV-19 los lista con su motivo.
import {
  elementoOp38,
  type ElementoOp38,
  op38,
  type EntradaOp38,
  type NoAprobado,
  type SalidaOp38,
  type VistaOp38,
} from '../../contratos/bandeja.ts';
import {
  errorDeValidacion,
  mensajeDeRechazo,
  type ErrorFinn,
  type ResultadoAccion,
} from '../../errores/index.ts';
import {
  confirmar,
  ErrorValidacion,
  previsualizar,
  type DefinicionOperacion,
  type DepsMarco,
} from '../marco.ts';
import {
  aprobacionDe,
  cargarMovimiento,
  resolverMovimiento,
  salidaAprobada,
  veredictoDeAprobacion,
  camposDeMovimiento,
  type ContextoMovimiento,
  type SalidaAprobada,
} from './comunes.ts';

type Elemento = ElementoOp38;
type Resuelto = ContextoMovimiento & { readonly entrada: Elemento };

const rechazo = (codigo: string, datos?: { readonly estado: string }): ErrorValidacion =>
  new ErrorValidacion(codigo, mensajeDeRechazo({ codigo, ...(datos ? { datos } : {}) }) ?? codigo);

/** Un movimiento del lote: OP-37 sin variantes, solo para `pendiente` y sin pago de tarjeta (04 OP-38). */
export const OP38_ELEMENTO: DefinicionOperacion<Elemento, Resuelto, SalidaAprobada> = {
  id: 'OP-38',
  contrato: elementoOp38,
  idempotencia: 'natural',
  idPrincipal: (e) => e.id,
  async comprobarIdempotencia(tx, e, h) {
    const c = await cargarMovimiento(tx, e.movimientoId);
    return c === null
      ? { tipo: 'no_encontrado' }
      : (veredictoDeAprobacion(c.movimiento, h, e.id) ?? { tipo: 'aplicar' });
  },
  async resolver(tx, e) {
    const c = await resolverMovimiento(tx, e.movimientoId);
    const { estado, tipoPropuesto } = c.movimiento;
    if (estado !== 'pendiente') throw rechazo('movimiento_estado_no_valido', { estado });
    if (tipoPropuesto === 'pago_tarjeta') throw rechazo('pago_sin_origen');
    return { ...c, entrada: e };
  },
  comando: (r, instante, ids) => ({
    operacion: 'OP-37',
    ...aprobacionDe(r, { id: r.entrada.id }, instante, ids),
  }),
  salida: (resultado, { movimiento }) =>
    salidaAprobada(resultado.hechosNuevos, {
      ...movimiento,
      ...camposDeMovimiento(resultado.cambios, movimiento.id),
    }),
};

/** El motivo de AV-19 de un error del elemento: su código y el mensaje del catálogo (04 §3.0.6). */
function motivoDe(e: ErrorFinn): NoAprobado {
  if (e.categoria === 'REQUIERE_CONFIRMACION')
    return motivoCatalogo('requiere_revision_individual');
  const [campo] = Object.keys(e.campos ?? {});
  // Las precondiciones del lote llegan como `ErrorValidacion` con el código del motivo en `campo`
  if (e.categoria === 'VALIDACION' && campo !== undefined && campo in MOTIVOS)
    return { codigo: campo, mensaje: e.campos?.[campo] ?? campo };
  return { codigo: e.codigo, mensaje: e.mensaje };
}
const MOTIVOS = {
  movimiento_estado_no_valido: true,
  pago_sin_origen: true,
} as const;
const motivoCatalogo = (codigo: string): NoAprobado => ({
  codigo,
  mensaje: mensajeDeRechazo({ codigo }) ?? codigo,
});

const elementos = (e: EntradaOp38): Elemento[] =>
  e.movimientoIds.map((movimientoId) => ({
    movimientoId,
    id: e.ids[movimientoId] as Elemento['id'],
  }));

/** Aprobar todos: una `confirmar()` por movimiento; devuelve cada resultado y, si alguno no se aprobó, AV-19. */
export async function aprobarTodos(
  cruda: unknown,
  deps: DepsMarco,
): Promise<ResultadoAccion<SalidaOp38>> {
  const analizada = op38.safeParse(cruda);
  if (!analizada.success) return { ok: false, error: errorDeValidacion(analizada.error.issues) };
  const salida: SalidaOp38['elementos'][number][] = [];
  for (const el of elementos(analizada.data)) {
    const r = await confirmar(OP38_ELEMENTO, el, deps);
    salida.push({
      movimientoId: el.movimientoId,
      resultado: r.ok ? (r.yaAplicada ? 'ya_aplicada' : 'aprobado') : motivoDe(r.error),
    });
  }
  const fallidos = salida.some((x) => typeof x.resultado !== 'string');
  return {
    ok: true,
    valor: { elementos: salida },
    yaAplicada: false,
    avisos: fallidos ? [{ codigo: 'AV-19', mensaje: 'AV-19' }] : [],
  };
}

/** `previsualizar` del lote: qué movimientos se aprobarían y el motivo de cada uno que no, sin escribir. */
export async function previsualizarAprobarTodos(
  cruda: unknown,
  deps: DepsMarco,
): Promise<ResultadoAccion<VistaOp38>> {
  const analizada = op38.safeParse(cruda);
  if (!analizada.success) return { ok: false, error: errorDeValidacion(analizada.error.issues) };
  const vistos: VistaOp38['elementos'][number][] = [];
  for (const el of elementos(analizada.data)) {
    const v = await previsualizar(OP38_ELEMENTO, el, deps);
    const motivo = !v.ok
      ? motivoDe(v.error)
      : v.valor.rechazos[0] !== undefined
        ? {
            codigo: v.valor.rechazos[0].codigo,
            mensaje: mensajeDeRechazo(v.valor.rechazos[0]) ?? v.valor.rechazos[0].codigo,
          }
        : v.valor.avisos.some((a) => a.requiereConfirmacion)
          ? motivoCatalogo('requiere_revision_individual')
          : undefined;
    vistos.push({
      movimientoId: el.movimientoId,
      aprobable: motivo === undefined,
      ...(motivo === undefined ? {} : { motivo }),
    });
  }
  return { ok: true, valor: { elementos: vistos }, yaAplicada: false, avisos: [] };
}
