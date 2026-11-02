'use client';
// La página completa de `/ajustes/webhook` (05 §1.4): el marco con el enrutador de Next y, dentro, el panel (`conexion.tsx`),
// que se prueba aparte porque no importa nada de Next.
import { PaginaFlujoDeRuta } from '../../componentes/navegacion/flujo-de-ruta';
import { ajustesWebhook as t } from '../../textos/ajustes-webhook';
import { PanelConexion, type PropsConexionMacroDroid } from './conexion';

export function ConexionMacroDroid(props: PropsConexionMacroDroid) {
  return (
    <PaginaFlujoDeRuta titulo={t.titulo} rutaPadre="/ajustes">
      <PanelConexion {...props} />
    </PaginaFlujoDeRuta>
  );
}
