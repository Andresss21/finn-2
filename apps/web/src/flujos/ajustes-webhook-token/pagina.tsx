'use client';
// El flujo corto `/ajustes/webhook/token` (05 §1.4): superpuesto sobre Ajustes cuando se llega desde la app; página completa si se
// abre la URL. El panel (`panel.tsx`) no importa Next y se prueba aparte.
import {
  PaginaFlujoDeRuta,
  SuperpuestoDeRuta,
  useCerrarFlujo,
} from '../../componentes/navegacion/flujo-de-ruta';
import { ajustesWebhook as t } from '../../textos/ajustes-webhook';
import { PanelToken, type PropsPanelToken } from './panel';

const RUTA_PADRE = '/ajustes/webhook';

type PropsPagina = Omit<PropsPanelToken, 'alCerrar'> & { readonly superpuesto: boolean };

function Contenido({ superpuesto, ...props }: PropsPagina) {
  const cerrar = useCerrarFlujo(RUTA_PADRE, superpuesto);
  return <PanelToken {...props} alCerrar={cerrar} />;
}

export function PaginaToken({ superpuesto, ...props }: PropsPagina) {
  const titulo = props.configurado ? t.hoja.tituloCambiar : t.hoja.tituloPrimero;
  const contenido = <Contenido superpuesto={superpuesto} {...props} />;
  return superpuesto ? (
    <SuperpuestoDeRuta titulo={titulo} descripcion={t.hoja.descripcion}>
      {contenido}
    </SuperpuestoDeRuta>
  ) : (
    <PaginaFlujoDeRuta titulo={titulo} descripcion={t.hoja.descripcion} rutaPadre={RUTA_PADRE}>
      {contenido}
    </PaginaFlujoDeRuta>
  );
}
