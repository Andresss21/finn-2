// Límites de la fecha de Registrar [CH-260]: los da el servidor (`servidor/limites-de-fecha.ts`); la interfaz solo los pasa al
// campo de fecha. Sin ellos (pruebas, otros formularios) el campo queda con el tope de hoy de siempre.
import type { FechaLocal } from '@finn/dominio/valores';

export interface LimitesDeFecha {
  /** Primer día elegible: el inicio del período en contexto. */
  readonly minima: FechaLocal;
  /** Último día elegible: el fin del período en contexto, y nunca después de hoy. */
  readonly maxima: FechaLocal;
  /** La fecha con la que abre el formulario: hoy si cae en el período; si no, `maxima`. */
  readonly inicial: FechaLocal;
}

/** Acota un período por hoy y elige la fecha inicial. Pura: no calcula períodos, recibe los que da el servidor. */
export function limitesDe(
  periodo: { readonly inicio: FechaLocal; readonly fin: FechaLocal },
  hoy: FechaLocal,
): LimitesDeFecha {
  const maxima = periodo.fin > hoy ? hoy : periodo.fin;
  const dentro = hoy >= periodo.inicio && hoy <= maxima;
  return { minima: periodo.inicio, maxima, inicial: dentro ? hoy : maxima };
}
