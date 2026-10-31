// Las clases de vacío que piden una acción (05 §7.2, FE-34). La tercera, «Vacío» de una sección, es `Vacio` con el texto
// de la columna «Notas» de §2 y la acción de crear el primero.
import { estados } from '../../textos/estados';
import { Vacio } from '../base/vacio';
import { EnlaceFinn } from './enlace-finn';

/** Primer uso: no hay ninguna cuenta. Guía hacia los dos primeros pasos. */
export function VacioPrimerUso() {
  return (
    <Vacio
      titulo={estados.primerUso.titulo}
      texto={estados.primerUso.texto}
      accion={
        <div className="flex flex-col gap-2">
          <EnlaceFinn href="/cuentas/nueva">{estados.primerUso.crearCuenta}</EnlaceFinn>
          <EnlaceFinn href="/presupuesto/estructura">
            {estados.primerUso.revisarCategorias}
          </EnlaceFinn>
        </div>
      }
    />
  );
}

/** Hay elementos pero los filtros de la URL no dejan ninguno: `rutaSinFiltros` es la ruta sin esos parámetros. */
export function VacioSinResultados({ rutaSinFiltros }: { readonly rutaSinFiltros: string }) {
  return (
    <Vacio
      titulo={estados.sinResultados.titulo}
      texto={estados.sinResultados.texto}
      accion={<EnlaceFinn href={rutaSinFiltros}>{estados.sinResultados.quitar}</EnlaceFinn>}
    />
  );
}
