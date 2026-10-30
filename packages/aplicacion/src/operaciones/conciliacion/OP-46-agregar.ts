// OP-46 Agregar desde el estado (04 §3.8, §9.1): verifica la carga firmada (BE-49) y ejecuta el alta elegida con la
// fecha del movimiento y `origen = 'importada'` (estado `confirmada`); el dominio reclasifica y exige que el alta deje
// en la cuenta el monto del movimiento (§9.5). Todo lo demás es la definición del alta (OP-20 a OP-24, OP-27, OP-31):
// su idempotencia de creación, su `resolver`, su comando y su `propuesta` (la de OP-24 en una cuota, CH-36).
import type { EstadoNormalizado } from '@finn/conciliacion';
import type { AltaDesdeEstado, Hechos, Uuid } from '@finn/dominio';
import { abrirCarga, movimientoDe, type DepsConciliacion } from '../../conciliacion/carga.ts';
import { op46, type EntradaOp46 } from '../../contratos/conciliacion.ts';
import type { SalidaTransaccion } from '../../contratos/transacciones.ts';
import { OP31 } from '../eventos/index.ts';
import type { DefinicionOperacion } from '../marco.ts';
import { OP20, OP21, OP22, OP23, OP24, OP27 } from '../transacciones/index.ts';

type Alta = DefinicionOperacion<unknown, unknown, SalidaTransaccion>;
const ALTAS = [OP20, OP21, OP22, OP23, OP24, OP27, OP31] as readonly unknown[] as readonly Alta[];
const altaDe = (e: EntradaOp46): Alta => ALTAS.find((x) => x.id === e.operacion) as Alta;

type Resuelto = {
  readonly e: EntradaOp46;
  readonly estado: EstadoNormalizado;
  readonly alta: unknown;
};

/**
 * Los datos del alta con la fecha del movimiento. Con `conVencimiento` en falso no se mira el vencimiento: en la
 * comprobación de idempotencia, para que repetir después de 24 h devuelva lo ya aplicado.
 */
function datosDe(d: DepsConciliacion, e: EntradaOp46, conVencimiento: boolean) {
  const estado = abrirCarga(d, e.carga, e.cuentaId, conVencimiento);
  const m = movimientoDe(estado, e.movimientoIndice, 'movimientoIndice');
  return { estado, datos: { ...e.datos, fecha: m.fecha } };
}

/** La huella de creación del alta compara `origen` con `manual`: la transacción importada se compara como manual. */
const comoManual = (h: Hechos, id: Uuid): Hechos => ({
  ...h,
  transacciones: h.transacciones.map((t) =>
    t.id === id && t.origen === 'importada' ? { ...t, origen: 'manual' } : t,
  ),
});

export const crearOP46 = (
  d: DepsConciliacion,
): DefinicionOperacion<EntradaOp46, Resuelto, SalidaTransaccion> => ({
  id: 'OP-46',
  contrato: op46,
  idempotencia: 'creacion',
  idPrincipal: (e) => e.datos.id,
  async comprobarIdempotencia(tx, e, h) {
    const t = h.transacciones.find((x) => x.id === e.datos.id);
    if (t === undefined) return { tipo: 'aplicar' };
    if (t.origen !== 'importada') return { tipo: 'conflicto_id' };
    const { datos } = datosDe(d, e, false);
    const v = await altaDe(e).comprobarIdempotencia?.(tx, datos, comoManual(h, t.id));
    return v ?? { tipo: 'conflicto_id' };
  },
  async resolver(tx, e, h) {
    const { estado, datos } = datosDe(d, e, true);
    return { e, estado, alta: await altaDe(e).resolver(tx, datos, h) };
  },
  proponer: (tx, e, h) => altaDe(e).proponer?.(tx, datosDe(d, e, false).datos, h),
  comando: (r, instante, ids) => ({
    operacion: 'OP-46',
    cuentaId: r.e.cuentaId,
    estado: r.estado,
    movimientoIndice: r.e.movimientoIndice,
    alta: altaDe(r.e).comando(r.alta, instante, ids) as AltaDesdeEstado,
  }),
  // Ninguna de esas altas tiene `extra`, `posteriores` ni `exigeConfirmacion` (AV-01 pide confirmar desde `aplicar`)
  salida: (resultado, r) => altaDe(r.e).salida(resultado, r.alta),
});
