// Límites de la fecha de Registrar [CH-260, 05 §2.2]: el período en contexto es el activo o, con `?periodo=` (que Presupuesto
// agrega al enlace «Registrar»), el que empieza ese día. Los límites salen de las consultas del servidor; aquí solo se acota por
// hoy. Un `?periodo=` que no abre un período cae en el activo. El servidor no cambia: OP-20 y las demás aceptan cualquier fecha.
import { presupuesto } from '@finn/aplicacion/consultas/presupuesto';
import type { PeriodoDto } from '@finn/dominio/selectores';
import type { FechaLocal } from '@finn/dominio/valores';
import { limitesDe, type LimitesDeFecha } from '../formularios/limites-de-fecha';
import { depsDeConsulta } from './consultas';
import type { BusquedaDePagina } from './parametros';

export async function limitesDeFecha(
  busqueda: BusquedaDePagina,
  dto: { readonly hoy: FechaLocal; readonly periodoActivo: PeriodoDto },
): Promise<LimitesDeFecha> {
  const pedido = busqueda['periodo'];
  if (
    typeof pedido === 'string' &&
    /^\d{4}-\d\d-\d\d$/.test(pedido) &&
    pedido !== dto.periodoActivo.inicio
  ) {
    try {
      const p = await presupuesto(await depsDeConsulta(), { periodoInicio: pedido });
      return limitesDe(p.periodo, dto.hoy);
    } catch {
      // Un período que no existe cae en el activo.
    }
  }
  return limitesDe(dto.periodoActivo, dto.hoy);
}
