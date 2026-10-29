// OP-10 Desarchivar categoría (04 §3.2): natural. Si ya está activa, `ya_aplicada`. Una de pago pasa al dominio,
// que la rechaza (`categoria_de_pago_con_tarjeta`).
import { op10, type EntradaOp10, type SalidaCategoria } from '../../contratos/categorias.ts';
import type { DefinicionOperacion } from '../marco.ts';
import { categoriaDe } from './comunes.ts';

export const OP10: DefinicionOperacion<EntradaOp10, EntradaOp10, SalidaCategoria> = {
  id: 'OP-10',
  contrato: op10,
  idempotencia: 'natural',
  comprobarIdempotencia(_tx, e, h) {
    const c = categoriaDe(h, e.categoriaId);
    if (c === undefined) return { tipo: 'no_encontrado' };
    return !c.archivada && c.clase === 'normal'
      ? { tipo: 'ya_aplicada', salida: {} }
      : { tipo: 'aplicar' };
  },
  resolver: (_tx, e) => Promise.resolve(e),
  comando: (e) => ({
    operacion: 'OP-10',
    categoriaId: e.categoriaId,
    ...(e.desarchivarGrupo === undefined ? {} : { desarchivarGrupo: e.desarchivarGrupo }),
  }),
  salida: () => ({}),
};
