// Lector de `/ajustes/ciclo` (05 §2.11, §4.1): `ajustes()` (04 §6.11) trae el día vigente y la vigencia futura, si existe.
import { ajustes } from '@finn/aplicacion/consultas/ajustes';
import { cambiarCiclo } from '../../servidor/acciones/ajustes';
import { consultar } from '../../servidor/consultar';
import { depsDeConsulta } from '../../servidor/consultas';
import { PaginaCiclo } from './pagina';

export async function LectorCiclo({ superpuesto = false }: { readonly superpuesto?: boolean }) {
  const { ciclo } = await consultar(async () => ajustes(await depsDeConsulta()));
  return (
    <PaginaCiclo
      accion={cambiarCiclo}
      diaVigente={ciclo.diaInicioVigente}
      superpuesto={superpuesto}
      {...(ciclo.vigenciaFutura === undefined ? {} : { futura: ciclo.vigenciaFutura })}
    />
  );
}
