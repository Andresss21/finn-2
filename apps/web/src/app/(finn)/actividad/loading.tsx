// Estado de carga de Actividad (E6-1; `T1-carga/actividad`): el buscador y las filas, sin textos ni números.
import { navegacion } from '../../../textos/navegacion';
import { Barra, Esqueleto, SeccionEsqueleto } from '../../../componentes/navegacion/esqueleto';

export default function Cargando() {
  return (
    <Esqueleto pantalla="actividad" titulo={navegacion.secciones.actividad}>
      <Barra />
      <SeccionEsqueleto filas={5} titulo={false} />
    </Esqueleto>
  );
}
