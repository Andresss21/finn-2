// Página provisional «Inicio vacío» (TA-200, DT-23). La reemplaza la tarea de FT-08 (Inicio).
// Mientras no exista `proxy.ts` (TA-214), la exigencia de sesión de esta página es la única barrera de `/`.
import { redirect } from 'next/navigation';
import { exigirSesionAal2Lectura } from '../../servidor/sesion.ts';

// Texto provisional: el catálogo de §12 lo absorbe cuando FT-08 reemplace la página.
const TITULO_INICIO_PROVISIONAL = 'Inicio vacío';

export default async function InicioProvisional() {
  const sesion = await exigirSesionAal2Lectura();
  if (!sesion.ok) {
    const destino = sesion.error.datos?.['aal'] === 'aal1' ? '/ingresar/verificar' : '/ingresar';
    redirect(`${destino}?volver=${encodeURIComponent('/')}`);
  }
  return <h1>{TITULO_INICIO_PROVISIONAL}</h1>;
}
