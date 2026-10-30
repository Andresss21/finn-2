// `consultas.notificaciones({ cursor?, soloNoLeidas? })` (04 §6.12.5): el centro de notificaciones, de la más nueva a la
// más vieja. `destino` es el `DestinoNotificacion` de 11.4 (CP-1); uno que no valida se trata como ausente. `existeDestino`
// dice si la entidad a la que apunta todavía existe (03 §7.4); sin destino no hay nada que falte y vale `true`.
import type { Instantanea } from '@finn/dominio';
import { leerPaginaDeNotificaciones, movimientosExistentes } from '@finn/db';
import { parametrosNotificaciones } from '../contratos/consultas.ts';
import { destinoNotificacion, type DestinoNotificacion } from '../contratos/notificaciones.ts';
import { consultar, type DepsConsulta, type Encabezado } from './comun.ts';

/** Filas por página. */
const PAGINA = 50;

export interface NotificacionCentroDto {
  readonly id: string;
  readonly creadaEn: string;
  readonly aviso: string | null;
  readonly motivo: string;
  readonly titulo: string;
  readonly cuerpo: string;
  readonly destino?: DestinoNotificacion;
  readonly leida: boolean;
  readonly existeDestino: boolean;
}
export type NotificacionesDto = Encabezado & {
  readonly notificaciones: readonly NotificacionCentroDto[];
  readonly siguienteCursor?: string;
};

/** El destino guardado en `datos`, o `undefined` si falta o no valida con el contrato. */
function destinoDe(datos: unknown): DestinoNotificacion | undefined {
  if (typeof datos !== 'object' || datos === null || !('destino' in datos)) return undefined;
  const r = destinoNotificacion.safeParse(datos.destino);
  return r.success ? r.data : undefined;
}

function existe(i: Instantanea, d: DestinoNotificacion, movimientos: ReadonlySet<string>): boolean {
  const h = i.hechos;
  switch (d.pantalla) {
    case 'movimiento':
      return movimientos.has(d.movimientoId);
    case 'transaccion':
      return h.transacciones.some((x) => x.id === d.transaccionId);
    case 'programada':
      return h.programadas.some((x) => x.id === d.programadaId);
    case 'categoria':
      return h.categorias.some((x) => x.id === d.categoriaId);
    case 'cuenta':
      return h.cuentas.some((x) => x.id === d.cuentaId);
    default:
      return true;
  }
}

export function notificaciones(d: DepsConsulta, parametros?: unknown): Promise<NotificacionesDto> {
  return consultar(
    d,
    { nombre: 'notificaciones', contrato: parametrosNotificaciones.default({}), parametros },
    async ({ tx, i, encabezado }, p) => {
      const pagina = await leerPaginaDeNotificaciones(tx, {
        limite: PAGINA,
        ...(p.cursor === undefined ? {} : { cursor: p.cursor }),
        ...(p.soloNoLeidas === undefined ? {} : { soloNoLeidas: p.soloNoLeidas }),
      });
      const filas = pagina.filas.map((f) => ({ f, destino: destinoDe(f.datos) }));
      const movimientos = await movimientosExistentes(
        tx,
        filas.flatMap(({ destino }) =>
          destino?.pantalla === 'movimiento' ? [destino.movimientoId] : [],
        ),
      );
      return {
        ...encabezado,
        notificaciones: filas.map(({ f, destino }): NotificacionCentroDto => ({
          id: f.id,
          creadaEn: f.creadaEn.toISOString(),
          aviso: f.aviso,
          motivo: f.motivo,
          titulo: f.titulo,
          cuerpo: f.cuerpo,
          ...(destino === undefined ? {} : { destino }),
          leida: f.leida,
          existeDestino: destino === undefined || existe(i, destino, movimientos),
        })),
        ...(pagina.siguienteCursor === undefined
          ? {}
          : { siguienteCursor: pagina.siguienteCursor }),
      };
    },
  );
}
