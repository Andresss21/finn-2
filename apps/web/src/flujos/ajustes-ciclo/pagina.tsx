'use client';
// El flujo corto `/ajustes/ciclo` (05 §1.4, E6-13): hoja sobre Ajustes cuando se llega desde la app (panel de 440 px en computadora);
// página completa si se abre la URL. El panel (`panel.tsx`) no importa Next y se prueba aparte.
import {
  PaginaFlujoDeRuta,
  SuperpuestoDeRuta,
  useCerrarFlujo,
} from '../../componentes/navegacion/flujo-de-ruta';
import { ajustesCiclo as t } from '../../textos/ajustes-ciclo';
import { PanelCiclo, type PropsPanelCiclo } from './panel';

const RUTA_PADRE = '/ajustes';

type PropsPagina = Omit<PropsPanelCiclo, 'alCerrar'> & { readonly superpuesto: boolean };

function Contenido({ superpuesto, ...props }: PropsPagina) {
  const cerrar = useCerrarFlujo(RUTA_PADRE, superpuesto);
  return <PanelCiclo {...props} alCerrar={cerrar} />;
}

export function PaginaCiclo({ superpuesto, ...props }: PropsPagina) {
  const contenido = <Contenido superpuesto={superpuesto} {...props} />;
  return superpuesto ? (
    <SuperpuestoDeRuta titulo={t.tituloHoja}>{contenido}</SuperpuestoDeRuta>
  ) : (
    <PaginaFlujoDeRuta titulo={t.tituloHoja} rutaPadre={RUTA_PADRE}>
      {contenido}
    </PaginaFlujoDeRuta>
  );
}
