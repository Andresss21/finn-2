// OP-09 Archivar categoría (04 §3.2; CH-31): natural. Ya archivada es `ya_aplicada`. Deja Disp(c, A) en 0 contra el
// destino elegido, devuelve las asignaciones futuras y decide las programadas; el traductor escribe el archivo al
// final de F4. Una categoría de pago pasa al dominio, que la rechaza (`categoria_de_pago_con_tarjeta`).
import { op09, type EntradaOp09, type SalidaCategoria } from '../../contratos/categorias.ts';
import type { DefinicionOperacion } from '../marco.ts';
import { categoriaDe } from './comunes.ts';

export const OP09: DefinicionOperacion<EntradaOp09, EntradaOp09, SalidaCategoria> = {
  id: 'OP-09',
  contrato: op09,
  idempotencia: 'natural',
  comprobarIdempotencia(_tx, e, h) {
    const c = categoriaDe(h, e.categoriaId);
    if (c === undefined) return { tipo: 'no_encontrado' };
    return c.archivada && c.clase === 'normal'
      ? { tipo: 'ya_aplicada', salida: {} }
      : { tipo: 'aplicar' };
  },
  resolver: (_tx, e) => Promise.resolve(e),
  comando: (e, _instante, ids) => ({
    operacion: 'OP-09',
    categoriaId: e.categoriaId,
    ids,
    ...(e.destinoDisponible === undefined ? {} : { destinoDisponible: e.destinoDisponible }),
    ...(e.cubrirSobregiroCon === undefined ? {} : { cubrirSobregiroCon: e.cubrirSobregiroCon }),
    ...(e.devolverAsignacionesFuturas === undefined
      ? {}
      : { devolverAsignacionesFuturas: e.devolverAsignacionesFuturas }),
    ...(e.programadas === undefined ? {} : { programadas: e.programadas }),
  }),
  salida: () => ({}),
};
