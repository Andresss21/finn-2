// Estado de carga de `/reportes/[tipo]` (E6-1; `T1-carga/reportes`): no marca el tipo de reporte, que aún no se conoce. El título de
// la sección, las pestañas, el período y el gráfico, en esqueleto.
import { navegacion } from '../../../../textos/navegacion';
import {
  Barra,
  BloqueGrafico,
  Esqueleto,
  SeccionEsqueleto,
} from '../../../../componentes/navegacion/esqueleto';

const PESTANAS = [0, 1, 2, 3] as const;

export default function Cargando() {
  return (
    <Esqueleto pantalla="reportes" titulo={navegacion.secciones.reportes}>
      <div className="flex gap-2 overflow-hidden">
        {PESTANAS.map((i) => (
          <span
            key={i}
            className="block h-11 w-28 shrink-0 rounded-pastilla bg-superficie-hundida"
          />
        ))}
      </div>
      <Barra ancho="w-3/4" />
      <BloqueGrafico />
      <SeccionEsqueleto filas={3} />
    </Esqueleto>
  );
}
