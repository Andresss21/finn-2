// OP-08 Renombrar, reordenar o mover de grupo (04 §3.2): valor absoluto (4.6.2). Cada campo pedido trae el valor que
// vio la interfaz; bajo el bloqueo, todos en el valor pedido es `ya_aplicada`, todos en el visto se aplica y
// cualquier otra mezcla es `conflicto_desactualizado` con los valores actuales. `orden` es la posición desde 1.
import type { Hechos } from '@finn/dominio';
import {
  CLAVES_OP08,
  op08,
  type EntradaOp08,
  type SalidaCategoria,
} from '../../contratos/categorias.ts';
import type { DefinicionOperacion } from '../marco.ts';
import { categoriaDe, grupoDe, posicionEn } from './comunes.ts';

/** Los valores vigentes de la fila con los nombres del contrato; `undefined` si la fila no existe. */
function vigente(h: Hechos, e: EntradaOp08): Record<string, unknown> | undefined {
  if (e.tipo === 'grupo') {
    const g = grupoDe(h, e.id);
    return g && { nombre: g.nombre, orden: posicionEn(h.grupos, g.id) };
  }
  const c = categoriaDe(h, e.id);
  return (
    c && {
      nombre: c.nombre,
      grupoId: c.grupoId,
      orden: posicionEn(
        h.categorias.filter((x) => x.grupoId === c.grupoId),
        c.id,
      ),
    }
  );
}

export const OP08: DefinicionOperacion<EntradaOp08, EntradaOp08, SalidaCategoria> = {
  id: 'OP-08',
  contrato: op08,
  idempotencia: 'valor_absoluto',
  comprobarIdempotencia(_tx, e, h) {
    const actual = vigente(h, e);
    if (actual === undefined) return { tipo: 'no_encontrado' };
    const claves = CLAVES_OP08.filter((k) => e[k] !== undefined);
    if (claves.every((k) => actual[k] === e[k])) return { tipo: 'ya_aplicada', salida: {} };
    if (claves.every((k) => actual[k] === e.esperado[k])) return { tipo: 'aplicar' };
    return {
      tipo: 'conflicto_desactualizado',
      actuales: Object.fromEntries(claves.map((k) => [k, actual[k]])),
    };
  },
  resolver: (_tx, e) => Promise.resolve(e),
  comando: (e) => ({
    operacion: 'OP-08',
    tipo: e.tipo,
    id: e.id,
    ...(e.nombre === undefined ? {} : { nombre: e.nombre }),
    ...(e.grupoId === undefined ? {} : { grupoId: e.grupoId }),
    ...(e.orden === undefined ? {} : { orden: e.orden }),
  }),
  salida: () => ({}),
};
