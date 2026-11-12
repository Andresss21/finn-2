// Estado de carga de reglas (E6-1, `T1-carga`): la lista de la sección en esqueleto, sin números inventados.
import { navegacion } from '../../../textos/navegacion';
import { Esqueleto, SeccionEsqueleto } from '../../../componentes/navegacion/esqueleto';

export default function Cargando() {
  return (
    <Esqueleto pantalla="reglas" titulo={navegacion.secciones.reglas}>
      <SeccionEsqueleto filas={4} titulo={false} />
    </Esqueleto>
  );
}
