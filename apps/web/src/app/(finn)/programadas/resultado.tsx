// E6-14 [CH-248]: el resultado de eliminar una programada o de guardar sus cambios, en la lista de Programadas, sin tiempo límite ni
// salida para revertir (05 §4.14: ninguno tiene operación inversa). El nombre sale de lo que ya trae el servidor (PF-3).
import { Resultado } from '../../../componentes/base/resultado';
import type { ResultadoProgramada } from '../../../flujos/programadas-nueva/resultado';
import { programadas as t } from '../../../textos/programadas';

export function ResultadoDeProgramada({
  resultado,
  programadas,
}: {
  readonly resultado: ResultadoProgramada | undefined;
  readonly programadas: readonly { readonly id: string; readonly comercio: string }[];
}) {
  if (resultado?.tipo === 'eliminada')
    return (
      <div data-resultado-flujo="eliminada">
        <Resultado texto={t.resultado.eliminada} />
      </div>
    );
  const nombre =
    resultado?.tipo === 'ajustada'
      ? programadas.find((p) => p.id === resultado.programadaId)?.comercio
      : undefined;
  if (nombre === undefined) return null;
  return (
    <div data-resultado-flujo="ajustada">
      <Resultado texto={t.resultado.ajustada(nombre)} />
    </div>
  );
}
