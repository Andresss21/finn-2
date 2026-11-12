// Estado de carga de la Bandeja (E6-1; `T1-carga`): filas de movimientos con su círculo, sin textos ni números. Las insignias del
// marco se ven: no dependen de esta pantalla.
import { navegacion } from '../../../textos/navegacion';
import { Esqueleto, SeccionEsqueleto } from '../../../componentes/navegacion/esqueleto';

export default function Cargando() {
  return (
    <Esqueleto pantalla="bandeja" titulo={navegacion.secciones.bandeja}>
      <SeccionEsqueleto filas={5} titulo={false} />
    </Esqueleto>
  );
}
