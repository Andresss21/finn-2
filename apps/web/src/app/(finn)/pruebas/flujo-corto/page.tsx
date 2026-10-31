// Flujo corto de prueba como página completa (URL directa, recarga o deep link; 05 §1.4).
import { PaginaFlujoDeRuta } from '../../../../componentes/navegacion/flujo-de-ruta.tsx';
import { soloEnPruebas } from '../solo-pruebas.ts';

export default function FlujoCortoDePrueba() {
  soloEnPruebas();
  return (
    <PaginaFlujoDeRuta titulo="Flujo corto de prueba" rutaPadre="/pruebas/origen">
      <p>{'Contenido del flujo corto.'}</p>
    </PaginaFlujoDeRuta>
  );
}
