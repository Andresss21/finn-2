// Estado de carga de Ajustes (E6-1; `T1-carga/ajustes`): los grupos de filas, sin textos.
import { navegacion } from '../../../textos/navegacion';
import { Esqueleto, SeccionEsqueleto } from '../../../componentes/navegacion/esqueleto';

export default function Cargando() {
  return (
    <Esqueleto pantalla="ajustes" titulo={navegacion.secciones.ajustes}>
      <SeccionEsqueleto filas={4} titulo={false} />
      <SeccionEsqueleto filas={3} titulo={false} />
    </Esqueleto>
  );
}
