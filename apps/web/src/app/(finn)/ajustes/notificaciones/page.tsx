// `/ajustes/notificaciones` (05 §2.11, FT-06): activar las notificaciones en este dispositivo y quitar dispositivos (OPT-02, OPT-03).
// `ajustes()` (04 §6.11) trae `suscripcionesPush` sin claves. Las Server Actions llegan al panel por props, para probarlo sin servidor.
import { ajustes } from '@finn/aplicacion/consultas/ajustes';
import type { Metadata } from 'next';
import { consultar } from '../../../../servidor/consultar';
import { depsDeConsulta } from '../../../../servidor/consultas';
import {
  quitarSuscripcion,
  registrarSuscripcion,
} from '../../../../servidor/acciones/notificaciones';
import { notificaciones } from '../../../../textos/notificaciones';
import { PanelNotificaciones } from './panel';

export const metadata: Metadata = { title: notificaciones.titulo };

export default async function PaginaAjustesNotificaciones() {
  const dto = await consultar(async () => ajustes(await depsDeConsulta()));
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 px-5 py-4">
      <h1 className="text-titulo-pantalla">{notificaciones.titulo}</h1>
      <PanelNotificaciones
        dispositivos={dto.suscripcionesPush}
        registrar={registrarSuscripcion}
        quitar={quitarSuscripcion}
      />
    </main>
  );
}
