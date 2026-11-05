// Lector de `/ajustes/formatos/nuevo` (05 §4.1): `formulario({ operacion: 'formato' })` trae las instituciones y los SMS para probar.
import { formulario } from '@finn/aplicacion/consultas/formulario/index';
import { guardarFormato, probarFormatoContraSms } from '../../servidor/acciones/formatos';
import { consultar } from '../../servidor/consultar';
import { depsDeConsulta } from '../../servidor/consultas';
import { FormularioFormato } from '../ajustes-formatos-formato/formulario';

export async function LectorFormatoNuevo() {
  const { contexto } = await consultar(async () =>
    formulario(await depsDeConsulta(), { operacion: 'formato' }),
  );
  return (
    <FormularioFormato
      guardar={guardarFormato}
      probar={probarFormatoContraSms}
      instituciones={contexto.instituciones}
      smsParaProbar={contexto.smsParaProbar}
    />
  );
}
