// `/ajustes/exportar` (05 §2.11, FT-75): descargar las transacciones y el presupuesto en JSON y CSV (OPT-08).
// Ruta [S]: `ajustes()` (04 §6.11) trae las rutas de descarga (`exportaciones`); los enlaces los dibuja `descargas.tsx`.
import { ajustes } from '@finn/aplicacion/consultas/ajustes';
import type { Metadata } from 'next';
import { consultar } from '../../../../servidor/consultar';
import { depsDeConsulta } from '../../../../servidor/consultas';
import { ajustesExportar } from '../../../../textos/ajustes-exportar';
import { DescargasExportar } from './descargas';

export const metadata: Metadata = { title: ajustesExportar.titulo };

export default async function PaginaExportar() {
  const dto = await consultar(async () => ajustes(await depsDeConsulta()));
  return <DescargasExportar exportaciones={dto.exportaciones} />;
}
