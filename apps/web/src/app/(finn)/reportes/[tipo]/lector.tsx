// Lector de `/reportes/[tipo]` (05 §4.1): llama a `reporte()` con la URL y pasa el DTO a la pantalla. El DTO trae ids; los nombres de
// categorías, grupos y cuentas (04 §6.9, CP-12) salen de `estructura()` y `cuentas()` en la misma petición, porque `reporte()`
// todavía no entrega `filtros`. Un parámetro que la consulta rechaza llega como `VALIDACION` y `consultar()` redirige a la misma
// ruta sin él (05 §2.2, CP-13).
import { cuentas } from '@finn/aplicacion/consultas/cuentas';
import { estructura } from '@finn/aplicacion/consultas/estructura';
import { reporte } from '@finn/aplicacion/consultas/reporte';
import { consultar } from '../../../../servidor/consultar';
import { depsDeConsulta } from '../../../../servidor/consultas';
import { aParametrosDeConsulta, type BusquedaDePagina } from '../../../../servidor/parametros';
import { PantallaReporte, type Nombres, type Parametros } from './pantalla';
import { TIPOS, type TipoDeUrl } from './tipos';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Los tipos cuyo DTO nombra categorías: los demás no necesitan la estructura.
const CON_CATEGORIAS: ReadonlySet<TipoDeUrl> = new Set([
  'categorias',
  'cumplimiento',
  'top-comercios',
  'gasto-semanal',
]);

const texto = (v: string | readonly string[] | undefined): string | undefined =>
  (typeof v === 'string' ? v : v?.[0]) || undefined;

export async function LectorReporte({
  url,
  busqueda,
}: {
  readonly url: TipoDeUrl;
  readonly busqueda: BusquedaDePagina;
}) {
  const consulta = aParametrosDeConsulta(busqueda);
  const { ventana, cuentaIds } = consulta;
  const grupo = texto(busqueda['grupo']);
  const limite = texto(busqueda['limite']);
  const semanal = url === 'gasto-semanal';
  const { periodoInicio, categoriaIds } = consulta;
  const solicitud = semanal
    ? {
        tipo: TIPOS[url],
        ...(periodoInicio === undefined ? {} : { periodoInicio }),
        ...(categoriaIds === undefined ? {} : { categoriaIds }),
      }
    : {
        tipo: TIPOS[url],
        ...(ventana === undefined ? {} : { ventana }),
        ...(cuentaIds === undefined ? {} : { cuentaIds }),
        ...(url === 'categorias' && grupo !== undefined && UUID.test(grupo)
          ? { grupoId: grupo }
          : {}),
        ...(url === 'top-comercios' && limite !== undefined ? { limite: Number(limite) } : {}),
      };
  const [dto, listaDeCuentas, arbol] = await Promise.all([
    consultar(async () => reporte(await depsDeConsulta(), solicitud)),
    consultar(async () => cuentas(await depsDeConsulta(), { incluirArchivadas: true })),
    CON_CATEGORIAS.has(url)
      ? consultar(async () => estructura(await depsDeConsulta()))
      : Promise.resolve(null),
  ]);
  const nombres: Nombres = {
    cuentas: [
      ...[
        ...listaDeCuentas.efectivo,
        ...listaDeCuentas.tarjetas,
        ...listaDeCuentas.prestamos,
        ...listaDeCuentas.inversiones,
      ].map((c) => c.cuenta),
      ...(listaDeCuentas.archivadas ?? []),
    ],
    grupos: arbol?.grupos.map((g) => g.grupo) ?? [],
    categorias: arbol?.grupos.flatMap((g) => g.categorias.map((c) => c.categoria)) ?? [],
  };
  const marcadas = texto(busqueda['cuentas']);
  const periodo = texto(busqueda['periodo']);
  const categorias = texto(busqueda['categorias']);
  const parametros: Parametros = {
    ...(typeof ventana === 'string' ? { ventana } : {}),
    ...(marcadas === undefined ? {} : { cuentas: marcadas }),
    ...(url === 'categorias' && grupo !== undefined ? { grupo } : {}),
    ...(url === 'top-comercios' && limite !== undefined ? { limite } : {}),
    ...(semanal && periodo !== undefined ? { periodo } : {}),
    ...(semanal && categorias !== undefined ? { categorias } : {}),
  };
  return <PantallaReporte url={url} dto={dto} nombres={nombres} parametros={parametros} />;
}
