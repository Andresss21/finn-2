// `/ajustes/notificaciones` (05 §2.11, FT-06): activar las notificaciones en este dispositivo y quitar dispositivos (OPT-02, OPT-03).
// `ajustes()` (04 §6.11) trae `suscripcionesPush` sin claves.
import { ajustes } from '@finn/aplicacion/consultas/ajustes';
import type { Metadata } from 'next';
import { PaginaNotificaciones } from '../../../../flujos/ajustes-notificaciones/pagina';
import { consultar } from '../../../../servidor/consultar';
import { depsDeConsulta } from '../../../../servidor/consultas';
import { notificaciones } from '../../../../textos/notificaciones';

export const metadata: Metadata = { title: notificaciones.titulo };

export default async function PaginaAjustesNotificaciones() {
  const dto = await consultar(async () => ajustes(await depsDeConsulta()));
  return <PaginaNotificaciones dispositivos={dto.suscripcionesPush} />;
}
