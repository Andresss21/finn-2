// Lector de `/registrar/devolucion` (05 §2.4): `formulario({ operacion: 'registrar', tipo: 'devolucion_sin_compra' })` trae las
// cuentas y las categorías de OP-33b, y `formulario({ operacion: 'devolver' })` las compras recientes con algo por devolver; la
// búsqueda mientras se escribe es la lectura interactiva de CP-3. Lo único que traduce los errores de la consulta es `consultar()`.
import { formulario } from '@finn/aplicacion/consultas/formulario/index';
import { devolver } from '../../servidor/acciones/eventos';
import { limitesDeFecha } from '../../servidor/limites-de-fecha';
import { consultar } from '../../servidor/consultar';
import { depsDeConsulta } from '../../servidor/consultas';
import { buscarComprasDevolucion } from '../../servidor/lecturas/interactivas';
import type { BusquedaDePagina } from '../../servidor/parametros';
import { FormularioDevolucion } from './devolucion-diferida';

export async function LectorDevolucion({ busqueda }: { readonly busqueda: BusquedaDePagina }) {
  const deps = await depsDeConsulta();
  const [dto, compras] = await Promise.all([
    consultar(() =>
      Promise.resolve(formulario(deps, { operacion: 'registrar', tipo: 'devolucion_sin_compra' })),
    ),
    consultar(() => Promise.resolve(formulario(deps, { operacion: 'devolver' }))),
  ]);
  const cuentas = [
    ...(dto.catalogos.cuentas?.efectivo ?? []).map((x) => ({
      valor: x.cuenta.id,
      etiqueta: x.cuenta.nombre,
      icono: 'wallet' as const,
    })),
    ...(dto.catalogos.cuentas?.tarjetas ?? []).map((x) => ({
      valor: x.cuenta.id,
      etiqueta: x.cuenta.nombre,
      icono: 'card' as const,
    })),
  ];
  const categorias = (dto.catalogos.categorias?.grupos ?? []).flatMap((g) =>
    g.categorias.map((x) => ({
      valor: x.categoria.id,
      etiqueta: x.categoria.nombre,
      grupo: g.grupo.nombre,
    })),
  );
  const recientes = 'candidatas' in compras.contexto ? compras.contexto.candidatas : [];
  return (
    <FormularioDevolucion
      accion={devolver}
      buscar={buscarComprasDevolucion}
      hoy={dto.hoy}
      limites={await limitesDeFecha(busqueda, dto)}
      recientes={recientes}
      cuentas={cuentas}
      categorias={categorias}
    />
  );
}
