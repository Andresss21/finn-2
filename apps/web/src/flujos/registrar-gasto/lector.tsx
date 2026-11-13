// Lector de `/registrar/gasto` (05 §2.4): llama a `formulario({ operacion: 'registrar', tipo: 'gasto', cuentaId })` con el `?cuenta=`
// de la URL y pasa al formulario las cuentas de efectivo y tarjeta abiertas, las categorías y los deudores. Lo único que traduce los
// errores de la consulta es `consultar()`.
import { formulario } from '@finn/aplicacion/consultas/formulario/index';
import { formatearMonto } from '../../formato';
import { limitesDeFecha } from '../../servidor/limites-de-fecha';
import { consultar } from '../../servidor/consultar';
import { depsDeConsulta } from '../../servidor/consultas';
import { valoresDeUrl } from '../../formularios/valores-de-url';
import { aParametrosDeConsulta, type BusquedaDePagina } from '../../servidor/parametros';
import { registrarGasto as t } from '../../textos/registrar-gasto';
import { FormularioRegistrarGasto } from './formulario';

export async function LectorRegistrarGasto({ busqueda }: { readonly busqueda: BusquedaDePagina }) {
  const { cuentaId } = aParametrosDeConsulta(busqueda);
  const dto = await consultar(async () =>
    formulario(await depsDeConsulta(), {
      operacion: 'registrar',
      tipo: 'gasto',
      ...(typeof cuentaId === 'string' ? { cuentaId } : {}),
    }),
  );
  // El detalle del campo cerrado es del DTO tal cual (S5): el saldo de efectivo o la deuda de la tarjeta; no se calcula nada.
  const cuentas = [
    ...(dto.catalogos.cuentas?.efectivo ?? []).map((x) => ({
      id: x.cuenta.id,
      nombre: x.cuenta.nombre,
      tipo: 'efectivo' as const,
      detalle: t.saldoDeCuenta(formatearMonto(x.saldo)),
    })),
    ...(dto.catalogos.cuentas?.tarjetas ?? []).map((x) => ({
      id: x.cuenta.id,
      nombre: x.cuenta.nombre,
      tipo: 'tarjeta' as const,
      detalle: t.deudaDeCuenta(formatearMonto(x.deuda)),
    })),
  ];
  const categorias = (dto.catalogos.categorias?.grupos ?? []).flatMap((g) =>
    g.categorias.map((x) => ({ id: x.categoria.id, nombre: x.categoria.nombre })),
  );
  const deudores = (dto.catalogos.deudores ?? []).map((x) => ({
    id: x.deudor.id,
    nombre: x.deudor.nombre,
  }));
  const propuesta = 'cuentaPropuesta' in dto.contexto ? dto.contexto.cuentaPropuesta.id : undefined;
  return (
    <FormularioRegistrarGasto
      hoy={dto.hoy}
      limites={await limitesDeFecha(busqueda, dto)}
      cuentas={cuentas}
      categorias={categorias}
      deudores={deudores}
      cuentaPropuesta={cuentas.some((c) => c.id === propuesta) ? propuesta : undefined}
      desdeUrl={valoresDeUrl(busqueda)}
    />
  );
}
