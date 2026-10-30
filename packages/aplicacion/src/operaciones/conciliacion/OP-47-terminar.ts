// OP-47 Terminar conciliación (04 §3.8, §9.1): creación de `conciliaciones` (4.6.1). Verifica la carga firmada
// (BE-49) y le pasa al dominio el estado y los pares marcados: el dominio reclasifica (`coincidencia_no_valida`,
// `transaccion_ya_conciliada`), crea el registro (F3) y marca las transacciones (F4) en la misma transacción, que es
// lo que exige el trigger de FN010. AV-21 llega en los avisos si la diferencia no es cero.
import { abrirCarga, movimientoDe, type DepsConciliacion } from '../../conciliacion/carga.ts';
import { op47, type EntradaOp47 } from '../../contratos/conciliacion.ts';
import type { DefinicionOperacion } from '../marco.ts';

type Salida = { readonly id: EntradaOp47['id'] };
type Resuelto = { readonly e: EntradaOp47; readonly estado: ReturnType<typeof abrirCarga> };

/** El estado firmado, con cada movimiento marcado dentro de la carga. */
function estadoDe(d: DepsConciliacion, e: EntradaOp47, conVencimiento: boolean) {
  const estado = abrirCarga(d, e.carga, e.cuentaId, conVencimiento);
  for (const c of e.coincidencias) movimientoDe(estado, c.movimientoIndice, 'coincidencias');
  return estado;
}

export const crearOP47 = (
  d: DepsConciliacion,
): DefinicionOperacion<EntradaOp47, Resuelto, Salida> => ({
  id: 'OP-47',
  contrato: op47,
  idempotencia: 'creacion',
  idPrincipal: (e) => e.id,
  // Repetir compara la cuenta, la fecha y el saldo del estado y el conjunto marcado; sin mirar el vencimiento
  comprobarIdempotencia(_tx, e, h) {
    const c = h.conciliaciones.find((x) => x.id === e.id);
    if (c === undefined) return { tipo: 'aplicar' };
    const estado = estadoDe(d, e, false);
    const marcadas = new Set(
      h.transacciones.filter((t) => t.conciliacionId === e.id).map((t) => t.id),
    );
    const pedidas = new Set(e.coincidencias.map((x) => x.transaccionId));
    const iguales =
      c.cuentaId === e.cuentaId &&
      c.modo === 'estado_cuenta' &&
      c.fechaEstado === estado.fechaEstado &&
      c.saldoEstado === estado.saldoFinal &&
      marcadas.size === pedidas.size &&
      [...pedidas].every((id) => marcadas.has(id));
    return iguales ? { tipo: 'ya_aplicada', salida: { id: e.id } } : { tipo: 'conflicto_id' };
  },
  resolver: (_tx, e) => Promise.resolve({ e, estado: estadoDe(d, e, true) }),
  comando: ({ e, estado }, instante) => ({
    operacion: 'OP-47',
    id: e.id,
    instante,
    cuentaId: e.cuentaId,
    estado,
    coincidencias: e.coincidencias,
  }),
  salida: (_r, { e }) => ({ id: e.id }),
});
