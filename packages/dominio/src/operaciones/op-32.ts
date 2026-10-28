// OP-32 Condonar (01 §5.5, §4.10, §7.4; 04 §3.5; P9, I4, H8, ajuste 1): una condonación de K sobre
// la línea por cobrar, hacia una categoría normal y activa. Es un consumo en esa categoría (de débito,
// o con la tarjeta de la compra y el reparto D2), que ya da `consumos()`; el saldo abierto lo baja
// `porCobrar`. El archivo de la categoría, la fecha frente a hoy e inv. 9 en el momento del evento
// los verifica `aplicar`.
import type * as H from '../hechos';
import type { Efecto } from './aplicar';
import { buscar } from './op-07';
import { categoriaNormal } from './op-20';
import { esRechazo, rechazo } from './rechazos';

/** La categoría propuesta: la de la primera línea de categoría de la misma compra, si está activa. */
export function propuestaCondonacion(h: H.Hechos, lineaId: H.Uuid): H.Uuid | null {
  const l = h.lineas.find((x) => x.id === lineaId);
  const primera = h.lineas
    .filter((x) => x.transaccionId === l?.transaccionId && x.categoriaId !== null)
    .sort((a, b) => a.orden - b.orden)[0];
  const c = h.categorias.find((x) => x.id === primera?.categoriaId);
  return c !== undefined && !c.archivada ? c.id : null;
}

export function op32(antes: H.Instantanea, x: H.ComandoOp32): Efecto | H.Rechazo {
  const { hechos: h } = antes;
  if (x.monto <= 0) throw new TypeError(`OP-32 ${x.id}: monto no positivo (CB-28)`);
  const l = buscar(h.lineas, x.lineaId, 'lineas');
  if (esRechazo(l)) return l;
  const compra = antes.porCobrar.find((y) => y.lineaId === l.id);
  if (compra === undefined) return { codigo: 'linea_no_es_por_cobrar', datos: { lineaId: l.id } };
  const c = categoriaNormal(h, x.categoriaId);
  if (esRechazo(c)) return c;
  if (x.fecha < compra.fecha) return rechazo('evento_anterior_a_original', { fecha: compra.fecha });
  // CB-22, inv. 9: K ≤ saldo abierto, con todos sus eventos.
  if (x.monto > compra.abierto)
    return {
      codigo: 'condonacion_mayor_que_abierto',
      datos: { lineaId: l.id, abierto: compra.abierto },
    };
  const fila: H.Condonacion = {
    ...{ id: x.id, lineaId: l.id, fecha: x.fecha, monto: x.monto, claveOrden: x.instante },
    ...{ secuencia: null, categoriaId: c.id, revision: null },
  };
  return { cambios: [{ tipo: 'insertar', tabla: 'condonaciones', fila }] };
}
