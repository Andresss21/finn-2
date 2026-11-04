// `/programadas` (05 §2, FT-40): los pagos que vienen, los atrasados y las programadas. `?horizonte=7|30` (30 por defecto).
import type { Metadata } from 'next';
import { programadas as consultaProgramadas } from '@finn/aplicacion/consultas/programadas';
import { consultar } from '../../../servidor/consultar';
import { depsDeConsulta } from '../../../servidor/consultas';
import type { BusquedaDePagina } from '../../../servidor/parametros';
import { programadas } from '../../../textos/programadas';
import { PantallaProgramadas } from './pantalla';

export const metadata: Metadata = { title: programadas.titulo };

export default async function PaginaProgramadas({
  searchParams,
}: {
  readonly searchParams: Promise<BusquedaDePagina>;
}) {
  const pedido = (await searchParams)['horizonte'];
  const horizonte = pedido === '7' ? 7 : 30;
  const dto = await consultar(async () =>
    consultaProgramadas(await depsDeConsulta(), { horizonteDias: horizonte }),
  );
  return <PantallaProgramadas dto={dto} horizonte={horizonte} />;
}
