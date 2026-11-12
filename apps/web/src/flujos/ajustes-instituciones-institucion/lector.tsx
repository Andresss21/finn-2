// Lector de `/ajustes/instituciones/[institucionId]` (05 §2.11): `ajustes()` (04 §6.11) trae las instituciones y los formatos, de los que
// sale «N formatos» (E5-14); la que no existe es 404.
import { ajustes } from '@finn/aplicacion/consultas/ajustes';
import { notFound } from 'next/navigation';
import { guardarInstitucion } from '../../servidor/acciones/formatos';
import { consultar } from '../../servidor/consultar';
import { depsDeConsulta } from '../../servidor/consultas';
import { FormularioInstitucion } from './formulario';

export async function LectorInstitucion({
  institucionId,
  superpuesto = false,
}: {
  readonly institucionId: string;
  readonly superpuesto?: boolean;
}) {
  const { instituciones, formatos } = await consultar(async () => ajustes(await depsDeConsulta()));
  const institucion = instituciones.find((i) => i.id === institucionId);
  if (institucion === undefined) notFound();
  const n = formatos.filter((f) => f.institucion.id === institucionId).length;
  return (
    <FormularioInstitucion
      guardar={guardarInstitucion}
      institucion={{ ...institucion, formatos: n }}
      superpuesto={superpuesto}
    />
  );
}
