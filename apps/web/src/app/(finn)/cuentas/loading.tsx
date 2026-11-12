// Estado de carga de Cuentas (E6-1; `T1-carga/cuentas`): los grupos de cuentas, con los títulos de sección en esqueleto.
import { navegacion } from '../../../textos/navegacion';
import { Esqueleto, SeccionEsqueleto } from '../../../componentes/navegacion/esqueleto';

export default function Cargando() {
  return (
    <Esqueleto pantalla="cuentas" titulo={navegacion.secciones.cuentas}>
      <SeccionEsqueleto filas={3} />
      <SeccionEsqueleto filas={2} />
    </Esqueleto>
  );
}
