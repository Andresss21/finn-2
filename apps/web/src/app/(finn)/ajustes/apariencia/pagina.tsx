'use client';
// La página completa de `/ajustes/apariencia` (05 §1.4): el marco con el enrutador de Next y, dentro, el panel.
import { PaginaFlujoDeRuta } from '../../../../componentes/navegacion/flujo-de-ruta';
import { ajustesApariencia as t } from '../../../../textos/ajustes-apariencia';
import { PanelApariencia } from './panel';

export function PaginaApariencia() {
  return (
    <PaginaFlujoDeRuta titulo={t.titulo} rutaPadre="/ajustes">
      <PanelApariencia />
    </PaginaFlujoDeRuta>
  );
}
