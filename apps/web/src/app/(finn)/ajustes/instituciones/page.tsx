// `/ajustes/instituciones` (05 §2.11, FT-73): la lista de instituciones. `ajustes()` (04 §6.11) las trae ordenadas por nombre.
import { ajustes } from '@finn/aplicacion/consultas/ajustes';
import type { Metadata } from 'next';
import { consultar } from '../../../../servidor/consultar';
import { depsDeConsulta } from '../../../../servidor/consultas';
import { ajustesInstituciones } from '../../../../textos/ajustes-instituciones';
import { ListaInstituciones } from './lista';

export const metadata: Metadata = { title: ajustesInstituciones.titulo };

export default async function PaginaInstituciones() {
  const { instituciones, formatos } = await consultar(async () => ajustes(await depsDeConsulta()));
  // E5-14: «N formatos» se cuenta de `formatos` (sin «N cuentas», que `AjustesDto` no trae; CH-247 e)
  return (
    <ListaInstituciones
      instituciones={instituciones.map((i) => ({
        ...i,
        formatos: formatos.filter((f) => f.institucion.id === i.id).length,
      }))}
    />
  );
}
