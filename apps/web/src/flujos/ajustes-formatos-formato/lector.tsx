// Lector de `/ajustes/formatos/[formatoId]` (05 §4.1): `formulario({ operacion: 'formato', formatoId })`; `consultar()` traduce los errores.
import { formulario } from '@finn/aplicacion/consultas/formulario/index';
import { notFound } from 'next/navigation';
import { guardarFormato, probarFormatoContraSms } from '../../servidor/acciones/formatos';
import { consultar } from '../../servidor/consultar';
import { depsDeConsulta } from '../../servidor/consultas';
import { FormularioFormato } from './formulario';

export async function LectorFormato({ formatoId }: { readonly formatoId: string }) {
  const { contexto } = await consultar(
    async () => formulario(await depsDeConsulta(), { operacion: 'formato', formatoId }),
    { validacionDeSegmento: true },
  );
  if (!('formato' in contexto)) notFound(); // con `formatoId` siempre viene; el tipo no lo sabe
  return (
    <FormularioFormato
      guardar={guardarFormato}
      probar={probarFormatoContraSms}
      instituciones={contexto.instituciones}
      smsParaProbar={contexto.smsParaProbar}
      formato={contexto.formato}
    />
  );
}
