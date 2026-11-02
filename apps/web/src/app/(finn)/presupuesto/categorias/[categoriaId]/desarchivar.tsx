'use client';
// «Desarchivar» de un toque (OP-10, 05 §4.14, FE-24): sin datos ni confirmación. Al terminar, la pantalla se actualiza sola
// (la operación revalida) y la categoría vuelve a ofrecer «Archivar», que es la salida. No calcula nada (PF-3).
import { AvisoEnLinea } from '../../../../../componentes/base/aviso';
import { Boton } from '../../../../../componentes/base/boton';
import type { AccionEscritura } from '../../../../../formularios/use-operacion';
import { useUnToque } from '../../../../../formularios/use-un-toque';
import { categoriaDetalle } from '../../../../../textos/categoria-detalle';

const t = categoriaDetalle.acciones;

export function Desarchivar({
  categoriaId,
  accion,
}: {
  readonly categoriaId: string;
  /** `desarchivarCategoria` (OP-10): la pone el lector, así la pantalla se prueba sin servidor. */
  readonly accion: AccionEscritura;
}) {
  const un = useUnToque({ accion });
  return (
    <div className="flex flex-col gap-2">
      <Boton
        variante="secundaria"
        enviando={un.estado === 'enviando'}
        textoEnviando={t.desarchivando}
        onClick={() => void un.tocar({ categoriaId })}
      >
        {t.desarchivar}
      </Boton>
      {un.error === undefined ? null : (
        <AvisoEnLinea estado="problema" aparecioDespues>
          {un.error.mensaje}
        </AvisoEnLinea>
      )}
    </div>
  );
}
