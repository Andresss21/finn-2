// Lector de `/actividad` (05 §4.1): llama a `actividad()` con los filtros de la URL y a `cuentas()` y `estructura()` para
// los nombres de los filtros. Lo único que traduce los errores es `consultar()` (CP-13): un parámetro inválido se quita (05 §2.2).
import { actividad } from '@finn/aplicacion/consultas/actividad';
import { cuentas } from '@finn/aplicacion/consultas/cuentas';
import { estructura } from '@finn/aplicacion/consultas/estructura';
import { consultar } from '../../../servidor/consultar';
import { depsDeConsulta } from '../../../servidor/consultas';
import { aParametrosDeConsulta, type BusquedaDePagina } from '../../../servidor/parametros';
import { CLAVES_FILTRO, PantallaActividad, type FiltrosActividad } from './pantalla';

/** Solo los parámetros de la tabla de 05 §2.2 que esta pantalla usa; un valor vacío cuenta como ausente. */
function filtrosDe(busqueda: BusquedaDePagina): FiltrosActividad {
  const salida: Record<string, string> = {};
  for (const clave of CLAVES_FILTRO) {
    const v = busqueda[clave];
    const valor = typeof v === 'string' ? v : v?.[0];
    if (valor !== undefined && valor !== '') salida[clave] = valor;
  }
  return salida;
}

export async function LectorActividad({ busqueda }: { readonly busqueda: BusquedaDePagina }) {
  const filtros = filtrosDe(busqueda);
  const parametros = aParametrosDeConsulta(filtros);
  const [dto, listaCuentas, listaCategorias] = await Promise.all([
    consultar(async () => actividad(await depsDeConsulta(), parametros)),
    consultar(async () => cuentas(await depsDeConsulta(), { incluirArchivadas: true })),
    consultar(async () => estructura(await depsDeConsulta())),
  ]);
  const refs = [
    ...listaCuentas.efectivo,
    ...listaCuentas.tarjetas,
    ...listaCuentas.prestamos,
    ...listaCuentas.inversiones,
  ].map((c) => c.cuenta);
  return (
    <PantallaActividad
      dto={dto}
      filtros={filtros}
      cuentas={[...refs, ...(listaCuentas.archivadas ?? [])]}
      grupos={listaCategorias.grupos.map((g) => ({
        nombre: g.grupo.nombre,
        categorias: g.categorias.filter((c) => c.clase === 'normal').map((c) => c.categoria),
      }))}
    />
  );
}
