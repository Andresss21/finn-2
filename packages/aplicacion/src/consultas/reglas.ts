// `consultas.reglas()` (04 §6.12.2): las reglas de comercio [H] con su categoría. Las que apuntan a una categoría
// archivada se marcan, porque se ignoran al sugerir (§4.17, B-10). Es una búsqueda de nombres, sin fórmulas.
// [CH-251] «Coincide con» (E4-22) sale del selector `coincidenciasDeReglas`; [CH-254] «Usada N veces», del conteo de los
// movimientos que guardan la regla que los categorizó (`movimientos.regla_id`, desde m_datos_entrega_4).
import { coincidenciasDeReglas, type Ref } from '@finn/dominio/selectores';
import { contarUsosDeReglas, leerReglasComercio } from '@finn/db';
import { sinParametros } from '../contratos/consultas.ts';
import { consultar, type DepsConsulta, type Encabezado } from './comun.ts';

export interface ReglaDto {
  readonly id: string;
  readonly patron: string;
  readonly categoria: Ref;
  readonly categoriaArchivada: boolean;
  /** [CH-251] Hasta 3 comercios de transacciones que contienen el patrón, del más reciente al más antiguo. */
  readonly coincideCon: readonly string[];
  /** [CH-254] Movimientos que categorizó desde m_datos_entrega_4; lo de antes no se reconstruye. */
  readonly usos: number;
}
export type ReglasDto = Encabezado & { readonly reglas: readonly ReglaDto[] };

export function reglas(d: DepsConsulta): Promise<ReglasDto> {
  return consultar(
    d,
    { nombre: 'reglas', contrato: sinParametros, parametros: undefined },
    async ({ tx, i, encabezado }) => {
      const categorias = new Map(i.hechos.categorias.map((c) => [c.id, c]));
      const todas = await leerReglasComercio(tx);
      const coincidencias = coincidenciasDeReglas(i, todas);
      const usos = await contarUsosDeReglas(tx);
      return {
        ...encabezado,
        reglas: todas.map((r): ReglaDto => {
          const c = categorias.get(r.categoriaId);
          if (c === undefined)
            throw new RangeError(`la regla ${r.id} apunta a una categoría inexistente`);
          return {
            id: r.id,
            patron: r.patron,
            categoria: c.archivada
              ? { id: c.id, nombre: c.nombre, archivada: true }
              : { id: c.id, nombre: c.nombre },
            categoriaArchivada: c.archivada,
            coincideCon: coincidencias.get(r.id) ?? [],
            usos: usos.get(r.id) ?? 0,
          };
        }),
      };
    },
  );
}
