// Estado de carga de Presupuesto (E6-1; `T1-carga/presupuesto`): el banco y los grupos, con los títulos de sección en esqueleto.
import { navegacion } from '../../../textos/navegacion';
import {
  BloqueGrafico,
  Esqueleto,
  SeccionEsqueleto,
} from '../../../componentes/navegacion/esqueleto';

export default function Cargando() {
  return (
    <Esqueleto pantalla="presupuesto" titulo={navegacion.secciones.presupuesto}>
      <BloqueGrafico />
      <SeccionEsqueleto filas={3} conIcono={false} />
      <SeccionEsqueleto filas={3} conIcono={false} />
    </Esqueleto>
  );
}
