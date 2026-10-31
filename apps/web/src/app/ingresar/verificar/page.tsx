// `/ingresar/verificar` (05 §9.4, FT-01): el código TOTP, solo con AAL1 y al menos un factor verificado (05 §9.2).
import type { Metadata } from 'next';
import { resolverAcceso } from '../../../flujos/ingresar/acceso';
import { FormularioVerificar } from '../../../flujos/ingresar/formulario-verificar';
import { salir, verificarFactor } from '../../../servidor/acciones/autenticacion';
import { autenticacion } from '../../../textos/autenticacion';

export const metadata: Metadata = { title: autenticacion.tituloVerificar };

export default async function PaginaVerificar({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { estado, rutas } = await resolverAcceso('/ingresar/verificar', searchParams);
  return (
    <FormularioVerificar
      accion={verificarFactor}
      accionSalir={salir}
      factores={estado.factoresVerificados}
      rutas={rutas}
    />
  );
}
