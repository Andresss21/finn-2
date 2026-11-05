// `/ajustes` (05 §2.11, FT-04): índice de Ajustes; cada ficha agrega su fila en `lista-ajustes.tsx`. Con los Primeros pasos ocultos, recuerda cuántos van.
import { inicio } from '@finn/aplicacion/consultas/inicio';
import type { Metadata } from 'next';
import { InstalarFinn } from './instalar-finn';
import { ListaAjustes } from './lista-ajustes';
import { RecordatorioPrimerosPasos } from './recordatorio-primeros-pasos';
import { consultar } from '../../../servidor/consultar';
import { depsDeConsulta } from '../../../servidor/consultas';
import { navegacion } from '../../../textos/navegacion';

export const metadata: Metadata = { title: navegacion.secciones.ajustes };

export default async function PaginaAjustes() {
  const { primerosPasos } = await consultar(async () => inicio(await depsDeConsulta()));
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-6 px-5 py-4">
      <h1 className="text-titulo-pantalla">{navegacion.secciones.ajustes}</h1>
      <RecordatorioPrimerosPasos pasos={primerosPasos} />
      <InstalarFinn />
      <ListaAjustes />
    </main>
  );
}
