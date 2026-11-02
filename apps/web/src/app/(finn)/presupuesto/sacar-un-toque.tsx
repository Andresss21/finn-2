'use client';
// La propuesta de AV-14 de un toque (05 §0.9 CP-8, §4.14, FE-24): OP-11 con todo el Disponible de la archivada hacia Listo para
// asignar y `esperado` con el Asignado que trajo la consulta. No calcula nada (PF-3): los dos montos son los del DTO. No tiene
// inversa (inv. 20: no se puede volver a asignar a una archivada), así que no ofrece «Deshacer».
import type { Centavos } from '@finn/dominio/valores';
import { AvisoEnLinea } from '../../../componentes/base/aviso';
import { Boton } from '../../../componentes/base/boton';
import { centavosATextoDecimal, formatearMonto } from '../../../formato';
import type { AccionEscritura } from '../../../formularios/use-operacion';
import { useUnToque } from '../../../formularios/use-un-toque';
import { categoriasArchivar } from '../../../textos/categorias-archivar';

const t = categoriasArchivar.sacar;

export function SacarDeUnToque({
  categoriaId,
  asignado,
  disponible,
  accion,
}: {
  readonly categoriaId: string;
  readonly asignado: Centavos;
  readonly disponible: Centavos;
  /** `sacarDisponible` (OP-11): la pone el lector, así la pantalla se prueba sin servidor. */
  readonly accion: AccionEscritura;
}) {
  const un = useUnToque({ accion });
  return (
    <div className="flex flex-col gap-2">
      <Boton
        variante="secundaria"
        enviando={un.estado === 'enviando'}
        textoEnviando={t.sacando}
        onClick={() =>
          void un.tocar({
            categoriaId,
            monto: centavosATextoDecimal(disponible),
            destino: 'lpa',
            esperado: { asignacionOrigen: centavosATextoDecimal(asignado) },
          })
        }
      >
        {t.unToque(formatearMonto(disponible))}
      </Boton>
      {un.error === undefined ? null : (
        <AvisoEnLinea estado="problema" aparecioDespues>
          {un.error.mensaje}
        </AvisoEnLinea>
      )}
    </div>
  );
}
