// `/ajustes/diagnostico` (05 §2.11, FT-76): los 50 últimos eventos del sistema, con la referencia (`idError`, 04 §7.8) buscable,
// y «Ejecutar tareas ahora» (04 §10.1). Ruta [S]: `ajustes()` (04 §6.11) trae `diagnostico`; el panel dibuja y filtra.
import { ajustes } from '@finn/aplicacion/consultas/ajustes';
import type { Metadata } from 'next';
import { PaginaFlujoDeRuta } from '../../../../componentes/navegacion/flujo-de-ruta';
import { PanelDiagnostico } from './panel';
import { ejecutarTareasAhora } from '../../../../servidor/acciones/ajustes';
import { consultar } from '../../../../servidor/consultar';
import { depsDeConsulta } from '../../../../servidor/consultas';
import { ajustesDiagnostico } from '../../../../textos/ajustes-diagnostico';

export const metadata: Metadata = { title: ajustesDiagnostico.titulo };

export default async function PaginaDiagnostico() {
  const { diagnostico } = await consultar(async () => ajustes(await depsDeConsulta()));
  return (
    <PaginaFlujoDeRuta
      titulo={ajustesDiagnostico.titulo}
      descripcion={ajustesDiagnostico.descripcion}
      rutaPadre="/ajustes"
    >
      <PanelDiagnostico
        eventos={diagnostico}
        ejecutar={ejecutarTareasAhora}
        {...(process.env['VERCEL_GIT_COMMIT_SHA'] === undefined
          ? {}
          : { version: process.env['VERCEL_GIT_COMMIT_SHA'] })}
      />
    </PaginaFlujoDeRuta>
  );
}
