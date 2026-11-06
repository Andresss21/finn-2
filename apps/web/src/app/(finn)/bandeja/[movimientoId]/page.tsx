// `/bandeja/[movimientoId]` (05 §2.5, FT-35): revisar un movimiento completo, editarlo y aprobarlo (OP-36, OP-37). Flujo largo:
// siempre página completa (05 §1.4). En computadora es el panel derecho de la Bandeja (S4 del export, CH-137): la lista a la izquierda,
// con el movimiento marcado, y «1 de N» con las flechas en el panel. La lista y el orden son los de `bandeja()`; es una sola
// página, no una ruta interceptada (FE-04).
import { bandeja } from '@finn/aplicacion/consultas/bandeja';
import type { Metadata } from 'next';
import { LectorMovimiento } from '../../../../flujos/bandeja-movimiento/lector';
import type { NavegacionDelPanel } from '../../../../flujos/bandeja-movimiento/panel-navegacion';
import { consultar } from '../../../../servidor/consultar';
import { depsDeConsulta } from '../../../../servidor/consultas';
import type { BusquedaDePagina } from '../../../../servidor/parametros';
import { bandeja as t } from '../../../../textos/bandeja';
import { soloActivos } from '../activos';
import { ListaBandeja } from '../lista';
import { SelectorVista } from '../selector-vista';

export const metadata: Metadata = { title: t.revisar.titulo };

export default async function PaginaMovimiento({
  params,
  searchParams,
}: {
  readonly params: Promise<{ movimientoId: string }>;
  readonly searchParams: Promise<BusquedaDePagina>;
}) {
  const { traspaso, categoria } = await searchParams;
  const { movimientoId } = await params;
  const dto = await consultar(async () => bandeja(await depsDeConsulta()));
  const movimientos = soloActivos(dto.movimientos);
  const i = movimientos.findIndex((m) => m.id === movimientoId);
  const anterior = movimientos[i - 1]?.id;
  const siguiente = movimientos[i + 1]?.id;
  const navegacion: NavegacionDelPanel | undefined =
    i < 0
      ? undefined
      : {
          posicion: i + 1,
          total: movimientos.length,
          ...(anterior === undefined ? {} : { anterior }),
          ...(siguiente === undefined ? {} : { siguiente }),
        };
  return (
    <LectorMovimiento
      movimientoId={movimientoId}
      traspaso={traspaso === '1'}
      {...(typeof categoria === 'string' ? { categoriaSoltada: categoria } : {})}
      lateral={
        <>
          <SelectorVista activa="activos" porRevisar={dto.bandejaPorRevisar} />
          <ListaBandeja
            contadores={dto.contadores}
            elegibles={dto.elegiblesAprobarTodos}
            movimientos={movimientos}
            actual={movimientoId}
            destinos={dto.destinosArrastre}
          />
        </>
      }
      {...(navegacion === undefined ? {} : { navegacion })}
    />
  );
}
