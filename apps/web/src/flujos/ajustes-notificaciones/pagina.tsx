'use client';
// La página completa de `/ajustes/notificaciones` (05 §1.4): el marco con el enrutador de Next y, dentro, el panel
// (`panel.tsx`), que se prueba aparte porque no importa nada de Next. Las Server Actions se importan acá.
import { PaginaFlujoDeRuta } from '../../componentes/navegacion/flujo-de-ruta';
import { quitarSuscripcion, registrarSuscripcion } from '../../servidor/acciones/notificaciones';
import { notificaciones as t } from '../../textos/notificaciones';
import { PanelNotificaciones, type DispositivoPush } from './panel';

export function PaginaNotificaciones({
  dispositivos,
}: {
  readonly dispositivos: readonly DispositivoPush[];
}) {
  return (
    <PaginaFlujoDeRuta titulo={t.titulo} rutaPadre="/ajustes">
      <PanelNotificaciones
        dispositivos={dispositivos}
        registrar={registrarSuscripcion}
        quitar={quitarSuscripcion}
      />
    </PaginaFlujoDeRuta>
  );
}
