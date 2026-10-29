// OP-13 Eliminar categoría o grupo; archivar grupo (04 §3.2): eliminación (4.6.3) o natural. Una fila que ya no
// existe pero está en `eliminaciones` es `ya_aplicada`; un grupo ya archivado también. Para eliminar una categoría,
// `resolver` entrega sus reglas de comercio [H], que el dominio cuenta como historial.
import { fueEliminada, leerReglasComercio } from '@finn/db';
import type { ReglaComercio } from '@finn/dominio';
import { op13, type EntradaOp13, type SalidaCategoria } from '../../contratos/categorias.ts';
import type { DefinicionOperacion } from '../marco.ts';
import { categoriaDe, grupoDe } from './comunes.ts';

type Resuelto = { readonly entrada: EntradaOp13; readonly reglas: readonly ReglaComercio[] };

export const OP13: DefinicionOperacion<EntradaOp13, Resuelto, SalidaCategoria> = {
  id: 'OP-13',
  contrato: op13,
  idempotencia: 'eliminacion',
  async comprobarIdempotencia(tx, e, h) {
    const eliminar = e.accion !== 'archivar_grupo';
    const tabla = e.accion === 'eliminar_categoria' ? 'categorias' : 'grupos';
    const fila = e.accion === 'eliminar_categoria' ? categoriaDe(h, e.id) : grupoDe(h, e.id);
    if (fila !== undefined) {
      const archivado = 'archivado' in fila && fila.archivado;
      return !eliminar && archivado ? { tipo: 'ya_aplicada', salida: {} } : { tipo: 'aplicar' };
    }
    return eliminar && (await fueEliminada(tx, tabla, e.id))
      ? { tipo: 'ya_aplicada', salida: {} }
      : { tipo: 'no_encontrado' };
  },
  async resolver(tx, e) {
    if (e.accion !== 'eliminar_categoria') return { entrada: e, reglas: [] };
    const reglas = (await leerReglasComercio(tx)).filter((r) => r.categoriaId === e.id);
    return { entrada: e, reglas };
  },
  comando: ({ entrada, reglas }) => ({
    operacion: 'OP-13',
    accion: entrada.accion,
    id: entrada.id,
    ...(entrada.accion === 'eliminar_categoria' ? { reglas } : {}),
  }),
  salida: () => ({}),
};
