// `/` Inicio (FT-08, 05 §2.3): `inicio()` y la pantalla. Reemplaza la página provisional «Inicio vacío» de TA-200 y conserva los
// Primeros pasos de FT-04 y la tarjeta «Activar notificaciones» de FT-06. Mientras no exista otra barrera (`proxy.ts`, TA-214), la
// exigencia de sesión de esta página es la de `/`.
import { inicio } from '@finn/aplicacion/consultas/inicio';
import { presupuesto } from '@finn/aplicacion/consultas/presupuesto';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { TarjetaActivarNotificaciones } from '../../componentes/marco/tarjeta-notificaciones';
import { sacarDisponible } from '../../servidor/acciones/categorias.ts';
import { marcarLeidas, registrarSuscripcion } from '../../servidor/acciones/notificaciones.ts';
import { asignarEnCategoria } from '../../servidor/acciones/presupuesto.ts';
import { consultar } from '../../servidor/consultar.ts';
import { depsDeConsulta } from '../../servidor/consultas.ts';
import { exigirSesionAal2Lectura } from '../../servidor/sesion.ts';
import { inicio as t } from '../../textos/inicio';
import { PantallaInicio } from './pantalla-inicio';

export const metadata: Metadata = { title: t.titulo };

export default async function PaginaInicio() {
  const sesion = await exigirSesionAal2Lectura();
  if (!sesion.ok) {
    const destino = sesion.error.datos?.['aal'] === 'aal1' ? '/ingresar/verificar' : '/ingresar';
    redirect(`${destino}?volver=${encodeURIComponent('/')}`);
  }
  const dto = await consultar(async () => inicio(await depsDeConsulta()));
  // CA-08.11: el botón del billete lleva a las categorías sin fondos solo si las hay (la misma consulta y filtro de Presupuesto).
  const haySinFondos =
    dto.lpa > 0 &&
    (
      await consultar(async () => presupuesto(await depsDeConsulta(), { filtro: 'sin_fondos' }))
    ).grupos.some((g) => g.categorias.length > 0);
  return (
    <>
      <PantallaInicio
        dto={dto}
        marcarLeidas={marcarLeidas}
        asignar={asignarEnCategoria}
        sacar={sacarDisponible}
        haySinFondos={haySinFondos}
      />
      <div className="mx-auto max-w-270 px-5 pb-4">
        <TarjetaActivarNotificaciones registrar={registrarSuscripcion} />
      </div>
    </>
  );
}
