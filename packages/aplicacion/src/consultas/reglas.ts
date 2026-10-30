// `consultas.reglas()` (04 §6.12.2): las reglas de comercio [H] con su categoría. Las que apuntan a una categoría
// archivada se marcan, porque se ignoran al sugerir (§4.17, B-10). Es una búsqueda de nombres, sin fórmulas.
import type { Ref } from '@finn/dominio/selectores';
import { leerReglasComercio } from '@finn/db';
import { sinParametros } from '../contratos/consultas.ts';
import { consultar, type DepsConsulta, type Encabezado } from './comun.ts';

export interface ReglaDto {
  readonly id: string;
  readonly patron: string;
  readonly categoria: Ref;
  readonly categoriaArchivada: boolean;
}
export type ReglasDto = Encabezado & { readonly reglas: readonly ReglaDto[] };

export function reglas(d: DepsConsulta): Promise<ReglasDto> {
  return consultar(
    d,
    { nombre: 'reglas', contrato: sinParametros, parametros: undefined },
    async ({ tx, i, encabezado }) => {
      const categorias = new Map(i.hechos.categorias.map((c) => [c.id, c]));
      return {
        ...encabezado,
        reglas: (await leerReglasComercio(tx)).map((r): ReglaDto => {
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
          };
        }),
      };
    },
  );
}
