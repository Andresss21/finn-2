// E6-14 [CH-248]: el resultado de guardar los cambios de una programada, en la lista de Programadas, sin tiempo límite ni salida para
// revertir (05 §4.14). El nombre sale de lo que ya trae el servidor (PF-3). [CH-281] Eliminar es la etiqueta de C-50 en la fila
// que se va (`FilaQueSeFue`); desactivar, la etiqueta en su fila de la lista (`PantallaProgramadas`).
import { FilaQueSeFue } from '../../../componentes/base/etiqueta-al-llegar';
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
      <FilaQueSeFue
        id="programada-eliminada"
        llegada={{
          palabra: t.resultado.eliminadaPalabra,
          frase: t.resultado.eliminadaDe(resultado.nombre),
        }}
      >
        {resultado.nombre}
      </FilaQueSeFue>
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
