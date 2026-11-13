// Lector de `/registrar/[tipo]` para aporte, retiro y ajuste de inversión (05 §2.4, FT-57): llama a
// `formulario({ operacion: 'registrar', tipo, cuentaId })` con el `?cuenta=` de la URL y pasa al formulario las inversiones, las
// cuentas de efectivo y, en el aporte, las categorías. Lo único que traduce los errores de la consulta es `consultar()`.
import { formulario } from '@finn/aplicacion/consultas/formulario/index';
import { formatearMonto } from '../../formato';
import { limitesDeFecha } from '../../servidor/limites-de-fecha';
import { consultar } from '../../servidor/consultar';
import { depsDeConsulta } from '../../servidor/consultas';
import { aParametrosDeConsulta, type BusquedaDePagina } from '../../servidor/parametros';
import { registrarInversion as t } from '../../textos/registrar-inversion';
import { tipoDeFormulario, type TipoDeInversion } from './inversion-campos';
import { FormularioRegistrarInversion } from './inversion-formulario-diferido';

export async function LectorRegistrarInversion({
  tipo,
  busqueda,
  superpuesto = false,
}: {
  readonly tipo: TipoDeInversion;
  readonly busqueda: BusquedaDePagina;
  readonly superpuesto?: boolean;
}) {
  const { cuentaId } = aParametrosDeConsulta(busqueda);
  const dto = await consultar(async () =>
    formulario(await depsDeConsulta(), {
      operacion: 'registrar',
      tipo: tipoDeFormulario(tipo),
      ...(typeof cuentaId === 'string' ? { cuentaId } : {}),
    }),
  );
  // El valor de cada inversión es del DTO tal cual: no se calcula nada (PF-3).
  const inversiones = (dto.catalogos.cuentas?.inversiones ?? []).map((x) => ({
    valor: x.cuenta.id,
    etiqueta: x.cuenta.nombre,
    descripcion: t.valorDe(formatearMonto(x.valor)),
  }));
  const efectivo = (dto.catalogos.cuentas?.efectivo ?? []).map((x) => ({
    valor: x.cuenta.id,
    etiqueta: x.cuenta.nombre,
  }));
  const categorias = (dto.catalogos.categorias?.grupos ?? []).flatMap((g) =>
    g.categorias.map((x) => ({ valor: x.categoria.id, etiqueta: x.categoria.nombre })),
  );
  const propuesta = 'cuentaPropuesta' in dto.contexto ? dto.contexto.cuentaPropuesta.id : undefined;
  return (
    <FormularioRegistrarInversion
      tipo={tipo}
      superpuesto={superpuesto}
      hoy={dto.hoy}
      limites={await limitesDeFecha(busqueda, dto)}
      inversiones={inversiones}
      cuentas={efectivo}
      categorias={categorias}
      inversionPropuesta={inversiones.some((c) => c.valor === propuesta) ? propuesta : undefined}
      cuentaPropuesta={efectivo.some((c) => c.valor === propuesta) ? propuesta : undefined}
    />
  );
}
