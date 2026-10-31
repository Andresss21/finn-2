// `/ingresar` (05 §9.3, FT-01): decide en el servidor con la tabla de 05 §9.2 y muestra email y contraseña.
import type { Metadata } from 'next';
import { resolverAcceso } from './acceso';
import { FormularioIngresar } from './formulario-ingresar';
import { ingresar, salir } from '../../servidor/acciones/autenticacion';
import { ingreso } from '../../textos/ingreso';

export const metadata: Metadata = { title: ingreso.tituloIngresar };

export default async function PaginaIngresar({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { rutas, cerrarSesion } = await resolverAcceso('/ingresar', searchParams);
  return (
    <FormularioIngresar
      accion={ingresar}
      cerrarSesion={salir}
      rutas={rutas}
      usuarioNoPermitido={cerrarSesion}
    />
  );
}
