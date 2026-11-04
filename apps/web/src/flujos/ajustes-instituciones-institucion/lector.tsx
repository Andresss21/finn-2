// Lector de `/ajustes/instituciones/[institucionId]` (05 §2.11): `ajustes()` (04 §6.11) trae las instituciones; la que no existe es 404.
import { ajustes } from '@finn/aplicacion/consultas/ajustes';
import { notFound } from 'next/navigation';
import { guardarInstitucion } from '../../servidor/acciones/formatos';
import { consultar } from '../../servidor/consultar';
import { depsDeConsulta } from '../../servidor/consultas';
import { FormularioInstitucion } from './formulario';

export async function LectorInstitucion({ institucionId }: { readonly institucionId: string }) {
  const { instituciones } = await consultar(async () => ajustes(await depsDeConsulta()));
  const institucion = instituciones.find((i) => i.id === institucionId);
  if (institucion === undefined) notFound();
  return <FormularioInstitucion guardar={guardarInstitucion} institucion={institucion} />;
}
