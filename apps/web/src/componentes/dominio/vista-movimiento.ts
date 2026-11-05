// La vista de un movimiento de la Bandeja (06 2.12): `pendiente` se parte en listo, falta la categoría y datos faltantes. Sin JSX ni
// 'use client', para que la usen la lista, el lector de `/bandeja/[movimientoId]` (servidor) y el encabezado de ese flujo.
import type { cuentas } from '../../textos/cuentas';

export type VistaMovimiento = keyof typeof cuentas.bandeja.estados;

interface DatosDeVista {
  readonly estado:
    'pendiente' | 'con_coincidencia' | 'posible_duplicado' | 'no_reconocido' | 'error';
  readonly aprobacion: { readonly posible: boolean; readonly faltantes: readonly string[] };
}

/**
 * Los siete estados de la fila (06 2.12): `pendiente` se parte en listo, falta la categoría y datos faltantes. Los
 * descartados no tienen fila compacta aquí: su vista (con "Restaurar") es de la pantalla de la Bandeja.
 */
export function vistaDe(m: DatosDeVista): VistaMovimiento {
  switch (m.estado) {
    case 'pendiente':
      if (m.aprobacion.posible) return 'listo';
      return m.aprobacion.faltantes.length === 0 || m.aprobacion.faltantes.includes('destino')
        ? 'falta'
        : 'faltaOtro';
    case 'con_coincidencia':
      return 'coincidencia';
    case 'posible_duplicado':
      return 'duplicado';
    case 'no_reconocido':
      return 'noReconocido';
    case 'error':
      return 'error';
  }
}
