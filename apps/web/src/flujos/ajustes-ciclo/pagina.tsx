'use client';
// La página completa de `/ajustes/ciclo` (05 §1.4): el marco con el enrutador de Next y, dentro, el panel, que se prueba aparte.
import { PaginaFlujoDeRuta } from '../../componentes/navegacion/flujo-de-ruta';
import { ajustesCiclo as t } from '../../textos/ajustes-ciclo';
import { PanelCiclo, type PropsPanelCiclo } from './panel';

export function PaginaCiclo(props: PropsPanelCiclo) {
  return (
    <PaginaFlujoDeRuta titulo={t.titulo} rutaPadre="/ajustes">
      <PanelCiclo {...props} />
    </PaginaFlujoDeRuta>
  );
}
