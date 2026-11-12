// `/bandeja/[movimientoId]` (05 §2.5, FT-35): revisar un movimiento completo, editarlo y aprobarlo (OP-36, OP-37). Flujo largo:
// siempre página completa (05 §1.4). En computadora, dos columnas (CH-240 E3-10): a la izquierda lo que identifica al movimiento y a la
// derecha los campos y las acciones, sin la lista. El orden de «siguiente» es el de `bandeja()`; es una sola página, no una ruta
// interceptada (FE-04).
import { bandeja } from '@finn/aplicacion/consultas/bandeja';
import type { Metadata } from 'next';
import { LectorMovimiento } from '../../../../flujos/bandeja-movimiento/lector';
import type { NavegacionDelPanel } from '../../../../flujos/bandeja-movimiento/panel-navegacion';
import { consultar } from '../../../../servidor/consultar';
import { depsDeConsulta } from '../../../../servidor/consultas';
import type { BusquedaDePagina } from '../../../../servidor/parametros';
import { bandeja as t } from '../../../../textos/bandeja';
import { soloActivos } from '../activos';

export const metadata: Metadata = { title: t.revisar.titulo };

export default async function PaginaMovimiento({
  params,
  searchParams,
}: {
  readonly params: Promise<{ movimientoId: string }>;
  readonly searchParams: Promise<BusquedaDePagina>;
}) {
  const { traspaso, categoria, conflicto, visto } = await searchParams;
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
      {...(conflicto === '1' && typeof categoria === 'string'
        ? { categoriaVista: typeof visto === 'string' ? visto : '' }
        : {})}
      {...(navegacion === undefined ? {} : { navegacion })}
    />
  );
}
