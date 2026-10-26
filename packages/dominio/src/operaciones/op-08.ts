// OP-08 Renombrar, reordenar o mover de grupo (01 §5.2, 04 §3.2). Sin efectos de cálculo. Reordenar
// deja la lista con posición × 10 y escribe solo las filas cuyo orden cambia. El valor esperado
// (4.6.2) lo compara la aplicación bajo el bloqueo.
import type * as H from '../hechos';
import { porOrden } from '../selectores/estructura';
import type { Efecto } from './aplicar';
import { buscar, grupoValido, nombreOcupado } from './op-07';
import { esRechazo } from './rechazos';

type Fila = { readonly id: H.Uuid; readonly orden: number };

/** El orden nuevo (posición × 10) de la lista con `id` en `posicion`, acotada a la lista. */
function reordenar(xs: readonly Fila[], id: H.Uuid, posicion: number) {
  const resto = xs.filter((y) => y.id !== id).sort(porOrden);
  resto.splice(Math.min(Math.max(posicion, 1), resto.length + 1) - 1, 0, { id, orden: 0 });
  return new Map(resto.map((y, i) => [y.id, (i + 1) * 10]));
}

/** La lista donde queda la fila, su grupo (para el mensaje) y los campos de nombre y grupo. */
function destino(h: H.Hechos, x: H.ComandoOp08, actual: H.Grupo | H.Categoria, nombre: string) {
  const campos: Record<string, unknown> = nombre === actual.nombre ? {} : { nombre };
  if (!('grupoId' in actual)) {
    const r = nombreOcupado(h.grupos, actual.id, nombre);
    return r ?? { lista: h.grupos, campos };
  }
  const grupoId = x.grupoId ?? actual.grupoId;
  const movida = grupoId !== actual.grupoId;
  // Solo el grupo destino tiene que ser válido: una archivada se renombra en su grupo archivado.
  const g = movida ? grupoValido(h, grupoId, actual.clase) : buscar(h.grupos, grupoId, 'grupos');
  if (esRechazo(g)) return g;
  const lista = h.categorias.filter((y) => y.grupoId === grupoId);
  const r = nombreOcupado(lista, actual.id, nombre, g);
  return r ?? { lista, campos: movida ? { ...campos, grupoId } : campos, movida };
}

export function op08(antes: H.Instantanea, x: H.ComandoOp08): Efecto | H.Rechazo {
  const { hechos: h } = antes;
  const grupo = x.tipo === 'grupo';
  const tabla = grupo ? 'grupos' : 'categorias';
  const actual = buscar<H.Grupo | H.Categoria>(grupo ? h.grupos : h.categorias, x.id, tabla);
  if (esRechazo(actual)) return actual;
  const d = destino(h, x, actual, x.nombre ?? actual.nombre);
  if (esRechazo(d)) return d;
  const { lista, campos, movida = false } = d;
  // Al cambiar de grupo sin posición, va al final de su nuevo grupo.
  const posicion = x.orden ?? (movida ? lista.length + 1 : undefined);
  const ordenes = posicion === undefined ? [] : [...reordenar(lista, x.id, posicion)];
  const viejo = new Map<H.Uuid, number>([...lista, actual].map((y) => [y.id, y.orden]));
  const escrituras: { id: H.Uuid; campos: Record<string, unknown> }[] = ordenes
    .filter(([i, orden]) => viejo.get(i) !== orden || (i === x.id && movida))
    .map(([i, orden]) => ({
      id: i,
      campos: i === x.id ? { ...campos, orden } : { orden },
    }));
  if (!escrituras.some((y) => y.id === x.id) && Object.keys(campos).length > 0)
    escrituras.unshift({ id: x.id, campos });
  return { cambios: escrituras.map((y) => ({ tipo: 'actualizar', tabla, ...y })) };
}
