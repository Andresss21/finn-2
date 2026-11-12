// `/programadas` (05 §2, FT-40): los pagos que vienen, los atrasados y las programadas. `?horizonte=7|30` (30 por defecto).
import type { Metadata } from 'next';
import { programadas as consultaProgramadas } from '@finn/aplicacion/consultas/programadas';
import { consultar } from '../../../servidor/consultar';
import { depsDeConsulta } from '../../../servidor/consultas';
import type { BusquedaDePagina } from '../../../servidor/parametros';
import { programadas } from '../../../textos/programadas';
import { leerResultadoProgramada } from '../../../flujos/programadas-nueva/resultado';
import { PantallaProgramadas } from './pantalla';

export const metadata: Metadata = { title: programadas.titulo };

export default async function PaginaProgramadas({
  searchParams,
}: {
  readonly searchParams: Promise<BusquedaDePagina>;
}) {
  const busqueda = await searchParams;
  const pedido = busqueda['horizonte'];
  // E6-14 [CH-248]: `?resultado=` es de la interfaz: no llega a la consulta y se valida al leer.
  const aviso = busqueda['resultado'];
  const horizonte = pedido === '7' ? 7 : 30;
  const dto = await consultar(async () =>
    consultaProgramadas(await depsDeConsulta(), { horizonteDias: horizonte }),
  );
  return (
    <PantallaProgramadas
      dto={dto}
      horizonte={horizonte}
      resultado={leerResultadoProgramada(typeof aviso === 'string' ? aviso : undefined)}
    />
  );
}
