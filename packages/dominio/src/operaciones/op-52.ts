// OP-52 Renombrar deudor (04 §3.5, QB-2): valor absoluto sobre `deudores.nombre`, único sin
// mayúsculas entre los deudores. Sin efecto en los cálculos: el nombre solo se muestra.
import type * as H from '../hechos';
import type { Efecto } from './aplicar';
import { buscar } from './op-07';
import { esRechazo } from './rechazos';

export function op52(antes: H.Instantanea, x: H.ComandoOp52): Efecto | H.Rechazo {
  const { deudores } = antes.hechos;
  const d = buscar(deudores, x.deudorId, 'deudores');
  if (esRechazo(d)) return d;
  const nombre = x.nombre.toLowerCase();
  if (deudores.some((y) => y.id !== d.id && y.nombre.toLowerCase() === nombre))
    return { codigo: 'nombre_repetido', campo: 'nombre', datos: { nombre: x.nombre, deudorId: d.id } };
  if (d.nombre === x.nombre) return { cambios: [] };
  const campos = { nombre: x.nombre };
  return { cambios: [{ tipo: 'actualizar', tabla: 'deudores', id: d.id, campos }] };
}
