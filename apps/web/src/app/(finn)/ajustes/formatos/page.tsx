// `/ajustes/formatos` (05 §2.11, FT-73): la lista de formatos con sus usos y el último uso. `ajustes()` (04 §6.11) los trae ya contados.
import { ajustes } from '@finn/aplicacion/consultas/ajustes';
import type { Metadata } from 'next';
import { consultar } from '../../../../servidor/consultar';
import { depsDeConsulta } from '../../../../servidor/consultas';
import { ajustesFormatos } from '../../../../textos/ajustes-formatos';
import { ListaFormatos } from './lista';

export const metadata: Metadata = { title: ajustesFormatos.titulo };

export default async function PaginaFormatos({
  searchParams,
}: {
  readonly searchParams: Promise<{ readonly guardado?: string | string[] }>;
}) {
  const { formatos } = await consultar(async () => ajustes(await depsDeConsulta()));
  const { guardado } = await searchParams;
  return (
    <ListaFormatos
      formatos={formatos}
      guardado={typeof guardado === 'string' ? guardado : undefined}
    />
  );
}
