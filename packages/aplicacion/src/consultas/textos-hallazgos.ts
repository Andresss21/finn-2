// [CH-251] El texto de los hallazgos (06 §3.5.2: `HallazgoDto.texto`, «del servidor»): los selectores entregan datos y la
// aplicación arma la frase con el catálogo y los formatos de 04 §7.10 (CF-04, CF-15). La interfaz la muestra tal cual (E5-22).
import type { reportes } from '@finn/dominio/selectores';
import { formatearFecha, formatearMonto, formatearPorcentaje } from '../errores/formato.ts';

export type HallazgoSinTexto =
  | ReturnType<typeof reportes.hallazgos>['hallazgos'][number]
  | ReturnType<typeof reportes.flujoEfectivo>['hallazgos'][number];

const $ = formatearMonto;

/** La frase de 06 §3.5.4 a §3.5.10 (y §3.3 para el flujo de efectivo). */
export function textoDeHallazgo(h: HallazgoSinTexto): string {
  switch (h.tipo) {
    case 'ritmo': {
      const fin = formatearFecha(h.fin).slice(0, 5);
      return h.sobregiroActual === 0
        ? `Vas camino a pasarte ${$(h.exceso)} en ${h.categoria.nombre} antes del ${fin}.`
        : `Ya te pasaste ${$(h.sobregiroActual)} en ${h.categoria.nombre} y, a este ritmo, llegarías a ${$(h.exceso)} el ${fin}.`;
    }
    case 'promedio':
      return `En ${h.categoria.nombre} vas camino a ${$(h.gasto)} este período, ${formatearPorcentaje(Math.abs(h.variacion))} ${h.variacion >= 0 ? 'más' : 'menos'} que tu promedio de ${$(h.promedio)}.`;
    case 'realidad':
      return h.causa === 'pasas'
        ? `En los últimos 3 períodos gastaste en promedio ${$(h.promedioGastado)} en ${h.categoria.nombre} y asignaste ${$(h.asignadoPromedio)}. ¿Ajustar a ${$(h.sugerido)}?`
        : `En los últimos 3 períodos gastaste en promedio ${$(h.promedioGastado)} en ${h.categoria.nombre} y te sobró dinero cada vez. ¿Ajustar a ${$(h.sugerido)}?`;
    case 'hormiga':
      return h.agrupacion === 'categoria'
        ? `${h.compras} compras pequeñas en ${h.etiqueta} este período: ${$(h.total)}.`
        : `${h.compras} compras en ${h.etiqueta} este período: ${$(h.total)}.`;
    case 'suscripcion':
      return h.desactivada
        ? `${h.comercio} te sigue cobrando ${$(h.mensual)} cada mes, pero su programada está desactivada.`
        : `${h.comercio} te cobra ${$(h.mensual)} cada mes (${$(h.anual)} al año) y no la tenés programada.`;
    case 'tarjeta':
      return `Con ${h.tarjeta.nombre} quedaron ${$(h.arrastre)} sin pagar del corte del ${formatearFecha(h.corte)}: esa deuda puede generar intereses.`;
    case 'flujo':
      return `Con tarjeta compraste ${$(h.comprasConTarjeta)} y pagaste ${$(h.pagosTarjeta)} de tarjetas en este período: te falta reservar ${$(h.accion.monto)} para ${h.tarjeta.nombre}.`;
  }
}

/** Los hallazgos del selector con su `texto`. */
export const conTexto = <H extends HallazgoSinTexto>(
  hs: readonly H[],
): (H & { readonly texto: string })[] => hs.map((h) => ({ ...h, texto: textoDeHallazgo(h) }));
