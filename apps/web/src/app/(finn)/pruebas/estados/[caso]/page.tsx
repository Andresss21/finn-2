// Arnés de PRU-E2E-PWA-002, -003, -004 y -006 (TA-213): una página por «caso» que llama a `consultar()` con una consulta
// simulada que lanza la `ExcepcionFinn` del caso. Aún no hay pantallas reales (DT-23). Solo con FINN_ENTORNO=pruebas; los
// textos de las páginas de prueba van fuera del catálogo. Las retira la primera pantalla real con cada estado.
import { ExcepcionFinn, type ErrorFinn } from '@finn/aplicacion/errores';
import { notFound } from 'next/navigation';
import { VacioPrimerUso, VacioSinResultados } from '../../../../../componentes/navegacion/vacios';
import { EnlaceFinn } from '../../../../../componentes/navegacion/enlace-finn';
import {
  aParametrosDeConsulta,
  type BusquedaDePagina,
} from '../../../../../componentes/navegacion/parametros';
import { consultar } from '../../../../../servidor/consultar';
import { soloEnPruebas } from '../../solo-pruebas';

// Sin prerender: `soloEnPruebas()` decide en cada petición, no con el entorno de la compilación (PRU-SEG-ACCESO-002).
export const dynamic = 'force-dynamic';

const BASE = '/pruebas/estados';
// Cuenta los renders de esta instancia del servidor: un render nuevo da un número nuevo (V5-22).
let renders = 0;

const falla = (error: ErrorFinn) => (): Promise<never> => Promise.reject(new ExcepcionFinn(error));

export default async function EstadoDePrueba({
  params,
  searchParams,
}: {
  readonly params: Promise<{ caso: string }>;
  readonly searchParams: Promise<BusquedaDePagina>;
}) {
  soloEnPruebas();
  const { caso } = await params;
  const busqueda = await searchParams;

  switch (caso) {
    case 'error':
      return consultar(
        falla({
          categoria: 'INTERNO',
          codigo: 'FN-PRU',
          mensaje: 'mensaje-interno-de-la-consulta',
          idError: 'E-PRU-213',
        }),
      );
    case 'fallo':
      throw new Error('fallo-de-programacion');
    case 'no-encontrado':
      return consultar(
        falla({ categoria: 'NO_ENCONTRADO', codigo: 'no_encontrado', mensaje: 'No existe.' }),
      );
    case 'segmento':
      return consultar(
        falla({
          categoria: 'VALIDACION',
          codigo: 'validacion',
          mensaje: 'Id inválido.',
          campos: { categoriaId: 'No es un id.' },
        }),
        { validacionDeSegmento: true },
      );
    case 'sesion':
      return consultar(
        falla({
          categoria: 'NO_AUTORIZADO',
          codigo: 'sin_aal2',
          mensaje: 'Verificá tu identidad.',
          datos: { aal: 'aal1' },
        }),
      );
    case 'parametros': {
      // La consulta simulada rechaza `?periodo=`, como una consulta real con un período que no es inicio de período.
      const convertidos = await consultar(() =>
        busqueda['periodo'] === undefined
          ? Promise.resolve(aParametrosDeConsulta(busqueda))
          : falla({
              categoria: 'VALIDACION',
              codigo: 'validacion',
              mensaje: 'Revisá los campos marcados.',
              campos: { periodoInicio: 'No es un período.' },
            })(),
      );
      return (
        <main>
          <h1>{'Parámetros'}</h1>
          <pre>{JSON.stringify(convertidos)}</pre>
        </main>
      );
    }
    case 'vacios':
      return (
        <main>
          <h1>{'Vacíos'}</h1>
          <VacioPrimerUso />
          <VacioSinResultados rutaSinFiltros={`${BASE}/vacios?otro=1`} />
        </main>
      );
    case 'origen':
      return (
        <main>
          <h1>{'Origen de carga'}</h1>
          <EnlaceFinn href={`${BASE}/carga`}>{'Ir a la página lenta'}</EnlaceFinn>
        </main>
      );
    case 'cache':
      return (
        <main>
          <h1>{'Caché del enrutador'}</h1>
          <p data-testid="render">{String((renders += 1))}</p>
          <EnlaceFinn href={`${BASE}/carga`}>{'Ir a otra página'}</EnlaceFinn>
          <EnlaceFinn href={`${BASE}/cache`}>{'Esta misma página'}</EnlaceFinn>
        </main>
      );
    default:
      return notFound();
  }
}
