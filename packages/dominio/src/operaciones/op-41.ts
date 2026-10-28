// OP-41 Crear, editar o eliminar reglas de comercio (01 §5.6; 04 §3.6). Patrón no vacío y único sin
// mayúsculas (`patron_repetido`); la categoría, normal y activa. `reglas_comercio` es [H]: sin
// efecto en el cálculo. El patrón se guarda como llega (la comparación ignora mayúsculas).
import type * as H from '../hechos';
import type { Efecto } from './aplicar';
import { distintos } from './op-02';
import { buscar } from './op-07';
import { categoriaActiva } from './op-36';
import { esRechazo } from './rechazos';

const tabla = 'reglas_comercio';

export function op41(antes: H.Instantanea, x: H.ComandoOp41): Efecto | H.Rechazo {
  /** Las precondiciones de la regla resultante; `propia` es la que se edita. */
  const valida = (patron: string, categoriaId: H.Uuid, propia?: H.Uuid) => {
    // TextoLimpio (CB-28) ya llega sin espacios de más: un patrón vacío es un comando mal formado.
    if (patron.trim() === '') throw new TypeError('OP-41: patrón vacío');
    const igual = (y: H.ReglaComercio) =>
      y.id !== propia && y.patron.toLowerCase() === patron.toLowerCase();
    if (x.reglas.some(igual)) return { codigo: 'patron_repetido', datos: { patron } };
    const c = categoriaActiva(antes.hechos, categoriaId);
    return esRechazo(c) ? c : undefined;
  };

  if (x.accion === 'crear') {
    const r = valida(x.patron, x.categoriaId);
    if (r) return r;
    const fila = { id: x.id, patron: x.patron, categoriaId: x.categoriaId };
    return { cambios: [{ tipo: 'insertar', tabla, fila }] };
  }
  const previa = buscar(x.reglas, x.reglaId, tabla);
  if (esRechazo(previa)) return previa;
  if (x.accion === 'eliminar') return { cambios: [{ tipo: 'eliminar', tabla, id: previa.id }] };
  const { patron = previa.patron, categoriaId = previa.categoriaId } = x;
  const r = valida(patron, categoriaId, previa.id);
  if (r) return r;
  const campos = distintos(previa, { patron: x.patron, categoriaId: x.categoriaId });
  return { cambios: campos ? [{ tipo: 'actualizar', tabla, id: previa.id, campos }] : [] };
}
