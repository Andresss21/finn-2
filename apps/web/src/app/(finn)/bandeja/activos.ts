// Los movimientos que se revisan: la vista de activos de la Bandeja solo trae estados con fila compacta, y el filtro deja ese hecho en el tipo.
// Lo comparten `/bandeja` y `/bandeja/[movimientoId]` (que muestra la lista en computadora, CH-137).
import type { MovimientoDto } from '../../../componentes/dominio/movimiento-bandeja';

export function soloActivos<T extends { readonly estado: string }>(
  movimientos: readonly T[],
): (T & { estado: MovimientoDto['estado'] })[] {
  return movimientos.filter(
    (m): m is T & { estado: MovimientoDto['estado'] } =>
      m.estado !== 'aprobado' && m.estado !== 'descartado' && m.estado !== 'autodescartado',
  );
}
