// Estado de carga del detalle (E6-1, `T1-carga/detalle`): «Cargando categoría», con el título y los bloques en esqueleto; el
// `loading.tsx` no conoce los parámetros, así que no hay ningún dato.
import { EsqueletoDetalle } from '../../../../../componentes/navegacion/esqueleto';

export default function Cargando() {
  return <EsqueletoDetalle pantalla="categoría" />;
}
