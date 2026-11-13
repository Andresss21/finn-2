// Lector de `/registrar/[tipo]` (05 §2.4): llama a `formulario({ operacion: 'registrar', tipo, cuentaId })` con el `?cuenta=` de la
// URL y pasa las cuentas de efectivo abiertas al formulario. Lo único que traduce los errores de la consulta es `consultar()`.
import { formulario } from '@finn/aplicacion/consultas/formulario/index';
import { limitesDeFecha } from '../../servidor/limites-de-fecha';
import { consultar } from '../../servidor/consultar';
import { depsDeConsulta } from '../../servidor/consultas';
import { valoresDeUrl } from '../../formularios/valores-de-url';
import { aParametrosDeConsulta, type BusquedaDePagina } from '../../servidor/parametros';
import type { TipoDeRegistro } from './campos';
import { FormularioRegistrarTipo } from './formulario';

export async function LectorRegistrarTipo({
  tipo,
  busqueda,
  superpuesto = false,
}: {
  readonly tipo: TipoDeRegistro;
  readonly busqueda: BusquedaDePagina;
  readonly superpuesto?: boolean;
}) {
  const { cuentaId } = aParametrosDeConsulta(busqueda);
  const dto = await consultar(async () =>
    formulario(await depsDeConsulta(), {
      operacion: 'registrar',
      tipo,
      ...(typeof cuentaId === 'string' ? { cuentaId } : {}),
    }),
  );
  const efectivo = (dto.catalogos.cuentas?.efectivo ?? []).map((x) => ({
    id: x.cuenta.id,
    nombre: x.cuenta.nombre,
  }));
  const propuesta = 'cuentaPropuesta' in dto.contexto ? dto.contexto.cuentaPropuesta.id : undefined;
  return (
    <FormularioRegistrarTipo
      tipo={tipo}
      superpuesto={superpuesto}
      hoy={dto.hoy}
      limites={await limitesDeFecha(busqueda, dto)}
      cuentas={efectivo}
      cuentaPropuesta={efectivo.some((c) => c.id === propuesta) ? propuesta : undefined}
      desdeUrl={valoresDeUrl(busqueda)}
    />
  );
}
