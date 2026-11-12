// `/ajustes/instituciones/nueva`: crear no lee nada del servidor; la acción de OPT-07 se la pone el lector al formulario compartido.
import { guardarInstitucion } from '../../servidor/acciones/formatos';
import { FormularioInstitucion } from '../ajustes-instituciones-institucion/formulario';

export function LectorInstitucionNueva({
  superpuesto = false,
}: {
  readonly superpuesto?: boolean;
}) {
  return <FormularioInstitucion guardar={guardarInstitucion} superpuesto={superpuesto} />;
}
