// Estado de carga de programadas (E6-1, `T1-carga`): la lista de la sección en esqueleto, sin números inventados.
import { navegacion } from '../../../textos/navegacion';
import { Esqueleto, SeccionEsqueleto } from '../../../componentes/navegacion/esqueleto';

export default function Cargando() {
  return (
    <Esqueleto pantalla="programadas" titulo={navegacion.secciones.programadas}>
      <SeccionEsqueleto filas={4} titulo={false} />
    </Esqueleto>
  );
}
