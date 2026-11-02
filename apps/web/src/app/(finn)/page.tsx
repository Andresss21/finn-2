// Página provisional «Inicio vacío» (TA-200, DT-23). La reemplaza la tarea de FT-08 (Inicio); por ahora suma los Primeros pasos de FT-04.
// Mientras no exista `proxy.ts` (TA-214), la exigencia de sesión de esta página es la única barrera de `/`.
import { inicio } from '@finn/aplicacion/consultas/inicio';
import { redirect } from 'next/navigation';
import { PrimerosPasosDeInicio } from './primeros-pasos';
import { consultar } from '../../servidor/consultar.ts';
import { depsDeConsulta } from '../../servidor/consultas.ts';
import { exigirSesionAal2Lectura } from '../../servidor/sesion.ts';

// Texto provisional: el catálogo de §12 lo absorbe cuando FT-08 reemplace la página.
const TITULO_INICIO_PROVISIONAL = 'Inicio vacío';

export default async function InicioProvisional() {
  const sesion = await exigirSesionAal2Lectura();
  if (!sesion.ok) {
    const destino = sesion.error.datos?.['aal'] === 'aal1' ? '/ingresar/verificar' : '/ingresar';
    redirect(`${destino}?volver=${encodeURIComponent('/')}`);
  }
  const { primerosPasos } = await consultar(async () => inicio(await depsDeConsulta()));
  return (
    <div className="flex flex-col gap-6 px-5 py-4">
      <h1>{TITULO_INICIO_PROVISIONAL}</h1>
      {primerosPasos === null ? null : <PrimerosPasosDeInicio pasos={primerosPasos} />}
    </div>
  );
}
