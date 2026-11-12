// Estado de carga de por cobrar (E6-1, `T1-carga`): la lista de la sección en esqueleto, sin números inventados.
import { navegacion } from '../../../textos/navegacion';
import { Esqueleto, SeccionEsqueleto } from '../../../componentes/navegacion/esqueleto';

export default function Cargando() {
  return (
    <Esqueleto pantalla="por cobrar" titulo={navegacion.secciones['por-cobrar']}>
      <SeccionEsqueleto filas={4} titulo={false} />
    </Esqueleto>
  );
}
