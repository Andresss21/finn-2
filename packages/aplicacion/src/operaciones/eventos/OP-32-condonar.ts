// OP-32 Condonar (04 §3.5): creación de una fila de `condonaciones` (clave de orden = instante). La huella de 4.6.1
// compara la línea, el monto, la fecha y la categoría: el mismo id con otros datos es `conflicto_id`. Los rechazos
// (`linea_no_es_por_cobrar`, `condonacion_mayor_que_abierto`, `categoria_archivada`, ...) los decide el dominio.
import { op32, type EntradaOp32 } from '../../contratos/eventos.ts';
import type { DefinicionOperacion } from '../marco.ts';

export const OP32: DefinicionOperacion<EntradaOp32, EntradaOp32, { readonly id: string }> = {
  id: 'OP-32',
  contrato: op32,
  idempotencia: 'creacion',
  idPrincipal: (e) => e.id,
  comprobarIdempotencia(_tx, e, h) {
    const c = h.condonaciones.find((x) => x.id === e.id);
    if (c === undefined) return { tipo: 'aplicar' };
    const igual =
      c.lineaId === e.lineaId &&
      c.monto === e.monto &&
      c.fecha === e.fecha &&
      c.categoriaId === e.categoriaId;
    return igual ? { tipo: 'ya_aplicada', salida: { id: e.id } } : { tipo: 'conflicto_id' };
  },
  resolver: (_tx, e) => Promise.resolve(e),
  comando: (e, instante) => ({
    operacion: 'OP-32',
    id: e.id,
    instante,
    lineaId: e.lineaId,
    monto: e.monto,
    fecha: e.fecha,
    categoriaId: e.categoriaId,
  }),
  salida: (_r, e) => ({ id: e.id }),
};
