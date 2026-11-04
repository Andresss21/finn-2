// `/notificaciones` (FT-69; 05 §2.9, §7.2): el centro como página completa. Abierto desde la campana de otra pantalla lo muestra
// el mismo contenido en el panel de `@superpuesto/(.)notificaciones` (CF-23).
import type { NotificacionesDto } from '@finn/aplicacion/consultas/notificaciones';
import { PublicarEncabezado } from '../../../componentes/marco/proveedor-encabezado';
import type { AccionEscritura } from '../../../formularios/use-operacion';
import { notificaciones as t } from '../../../textos/notificaciones';
import { ContenidoNotificaciones } from './contenido';

export function PantallaNotificaciones({
  dto,
  soloNoLeidas,
  cursor,
  marcarLeidas,
}: {
  readonly dto: NotificacionesDto;
  readonly soloNoLeidas: boolean;
  readonly cursor?: string;
  readonly marcarLeidas: AccionEscritura;
}) {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-5 px-5 py-4">
      <PublicarEncabezado encabezado={dto} />
      <h1 className="text-titulo-pantalla">{t.titulo}</h1>
      <ContenidoNotificaciones
        dto={dto}
        soloNoLeidas={soloNoLeidas}
        {...(cursor === undefined ? {} : { cursor })}
        marcarLeidas={marcarLeidas}
      />
    </main>
  );
}
