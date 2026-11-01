// Lector de `/cuentas/nueva` (05 §4.1): llama a `formulario({ operacion: 'cuenta', tipo })` con el `?tipo-cuenta=` de la URL y
// pasa el DTO al formulario. Lo único que traduce los errores de la consulta es `consultar()` (CP-13).
import { formulario } from '@finn/aplicacion/consultas/formulario/index';
import { consultar } from '../../servidor/consultar';
import { depsDeConsulta } from '../../servidor/consultas';
import { aParametrosDeConsulta, type BusquedaDePagina } from '../../servidor/parametros';
import { TIPOS, type TipoCuenta } from './campos';
import { FormularioCuentaNueva } from './formulario';

export async function LectorCuentaNueva({ busqueda }: { readonly busqueda: BusquedaDePagina }) {
  const parametros = aParametrosDeConsulta(busqueda);
  const dto = await consultar(async () =>
    formulario(await depsDeConsulta(), { operacion: 'cuenta', ...parametros }),
  );
  const tipo = TIPOS.find((t) => t === parametros['tipo']) ?? ('efectivo' satisfies TipoCuenta);
  return (
    <FormularioCuentaNueva
      hoy={dto.hoy}
      tipoInicial={tipo}
      instituciones={dto.contexto.instituciones}
      nombresTarjetaUsados={dto.contexto.nombresTarjetaUsados}
    />
  );
}
