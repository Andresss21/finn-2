// `/ingresar/inscribir` (05 §9.5, FT-02): el primer factor TOTP, solo con AAL1 y cero factores verificados (05 §9.2).
import type { Metadata } from 'next';
import { InscribirFactor } from '../../../flujos/ajustes-seguridad-factores-nuevo/inscribir-factor';
import { completarInscripcion, iniciarInscripcion } from '../../../servidor/acciones/autenticacion';
import { ingreso } from '../../../textos/ingreso';
import { resolverAcceso } from '../acceso';

export const metadata: Metadata = { title: ingreso.tituloInscribir };

export default async function PaginaInscribir({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { rutas, cierre } = await resolverAcceso('/ingresar/inscribir', searchParams);
  return (
    <InscribirFactor
      iniciar={iniciarInscripcion}
      completar={completarInscripcion}
      nombre="Autenticador"
      esRespaldo={false}
      cerrado={cierre}
      destino={rutas.destino}
      rutaIngresar={rutas.ingresar}
    />
  );
}
