// Lector de `/registrar/entrada-tarjeta`, `/avance` y `/transferencia-deuda` (05 §2.4): llama a
// `formulario({ operacion: 'registrar', tipo, cuentaId })` con el `?cuenta=` de la URL y pasa las tarjetas y las cuentas de efectivo
// abiertas al formulario. Lo único que traduce los errores de la consulta es `consultar()`.
import { formulario } from '@finn/aplicacion/consultas/formulario/index';
import { consultar } from '../../servidor/consultar';
import { depsDeConsulta } from '../../servidor/consultas';
import { aParametrosDeConsulta, type BusquedaDePagina } from '../../servidor/parametros';
import { TIPOS, type TipoDeTarjeta } from './campos-tarjeta';
import { FormularioRegistrarTarjeta } from './formulario-tarjeta';

export async function LectorRegistrarTarjeta({
  tipo,
  busqueda,
  superpuesto = false,
}: {
  readonly tipo: TipoDeTarjeta;
  readonly busqueda: BusquedaDePagina;
  readonly superpuesto?: boolean;
}) {
  const { cuentaId } = aParametrosDeConsulta(busqueda);
  const dto = await consultar(async () =>
    formulario(await depsDeConsulta(), {
      operacion: 'registrar',
      tipo: TIPOS[tipo].formulario,
      ...(typeof cuentaId === 'string' ? { cuentaId } : {}),
    }),
  );
  const tarjetas = (dto.catalogos.cuentas?.tarjetas ?? []).map((x) => x.cuenta);
  const efectivo = (dto.catalogos.cuentas?.efectivo ?? []).map((x) => x.cuenta);
  const propuesta = 'cuentaPropuesta' in dto.contexto ? dto.contexto.cuentaPropuesta.id : undefined;
  return (
    <FormularioRegistrarTarjeta
      tipo={tipo}
      superpuesto={superpuesto}
      hoy={dto.hoy}
      tarjetas={tarjetas}
      efectivo={efectivo}
      tarjetaPropuesta={tarjetas.some((c) => c.id === propuesta) ? propuesta : undefined}
    />
  );
}
