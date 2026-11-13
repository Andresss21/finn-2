// `/ajustes` (05 §2.11, FT-04): índice de Ajustes; cada ficha agrega su fila en `lista-ajustes.tsx`. Con los Primeros pasos ocultos, recuerda cuántos van.
import { ajustes } from '@finn/aplicacion/consultas/ajustes';
import { inicio } from '@finn/aplicacion/consultas/inicio';
import { PublicarEncabezado } from '../../../componentes/marco/proveedor-encabezado';
import type { Metadata } from 'next';
import { InstalarFinn } from './instalar-finn';
import { ListaAjustes } from './lista-ajustes';
import { RecordatorioPrimerosPasos } from './recordatorio-primeros-pasos';
import { consultar } from '../../../servidor/consultar';
import { depsDeConsulta } from '../../../servidor/consultas';
import { correoDeLaSesion, resumenSeguridad } from '../../../servidor/sesion';
import { navegacion } from '../../../textos/navegacion';

export const metadata: Metadata = { title: navegacion.secciones.ajustes };

export default async function PaginaAjustes() {
  const { primerosPasos } = await consultar(async () => inicio(await depsDeConsulta()));
  const dto = await consultar(async () => ajustes(await depsDeConsulta()));
  // [CH-254] «N factores» de Seguridad (AJU-01), de Auth con la sesión de la persona.
  const { factores } = await consultar(() => resumenSeguridad());
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-6 px-5 py-4">
      <PublicarEncabezado encabezado={dto} />
      <h1 className="text-titulo-pantalla">{navegacion.secciones.ajustes}</h1>
      <InstalarFinn />
      <RecordatorioPrimerosPasos pasos={primerosPasos} />
      <ListaAjustes
        correo={await correoDeLaSesion()}
        respaldoAtrasado={dto.respaldo.respaldoAtrasado}
        resumen={{
          diaInicio: dto.ciclo.diaInicioVigente,
          webhook: dto.webhook,
          ...dto.resumen,
          factores,
        }}
      />
    </main>
  );
}
