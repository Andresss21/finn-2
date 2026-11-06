// Lector de `/registrar/desembolso` (05 §2.4): llama a `formulario({ operacion: 'registrar', tipo: 'desembolso', cuentaId })` con el
// `?cuenta=` de la URL y pasa los préstamos y las cuentas de efectivo abiertas al formulario. Lo único que traduce los errores de la
// consulta es `consultar()`.
import { formulario } from '@finn/aplicacion/consultas/formulario/index';
import { consultar } from '../../servidor/consultar';
import { depsDeConsulta } from '../../servidor/consultas';
import { aParametrosDeConsulta, type BusquedaDePagina } from '../../servidor/parametros';
import { FormularioDesembolso } from './formulario-desembolso-diferido';

export async function LectorDesembolso({
  busqueda,
  superpuesto = false,
}: {
  readonly busqueda: BusquedaDePagina;
  readonly superpuesto?: boolean;
}) {
  const { cuentaId } = aParametrosDeConsulta(busqueda);
  const dto = await consultar(async () =>
    formulario(await depsDeConsulta(), {
      operacion: 'registrar',
      tipo: 'desembolso',
      ...(typeof cuentaId === 'string' ? { cuentaId } : {}),
    }),
  );
  const prestamos = (dto.catalogos.cuentas?.prestamos ?? []).map((x) => x.cuenta);
  const efectivo = (dto.catalogos.cuentas?.efectivo ?? []).map((x) => x.cuenta);
  const propuesta = 'cuentaPropuesta' in dto.contexto ? dto.contexto.cuentaPropuesta.id : undefined;
  return (
    <FormularioDesembolso
      superpuesto={superpuesto}
      hoy={dto.hoy}
      prestamos={prestamos}
      efectivo={efectivo}
      prestamoPropuesto={prestamos.some((c) => c.id === propuesta) ? propuesta : undefined}
      cuentaPropuesta={efectivo.some((c) => c.id === propuesta) ? propuesta : undefined}
    />
  );
}
