// Estado de carga de metas (E6-1, `T1-carga`): la lista de la sección en esqueleto, sin números inventados.
import { navegacion } from '../../../textos/navegacion';
import { Esqueleto, SeccionEsqueleto } from '../../../componentes/navegacion/esqueleto';

export default function Cargando() {
  return (
    <Esqueleto pantalla="metas" titulo={navegacion.secciones.metas}>
      <SeccionEsqueleto filas={4} titulo={false} />
    </Esqueleto>
  );
}
