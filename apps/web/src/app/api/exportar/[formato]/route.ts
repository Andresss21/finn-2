// `GET /api/exportar/{json,csv}` (04 §1.2, §3.10 OPT-08, §12.3): adaptador de `exportar`. Exige `getUser()` y AAL2 antes
// de leer nada y descarga con `Content-Disposition`. La respuesta lleva los datos reales del usuario: este archivo no
// registra nada y un fallo responde solo con su código; `exportar` deja el evento saneado (CH-46, 04 §7.8).
import { relojDePrueba } from '@finn/aplicacion';
import { formatoExportacion } from '@finn/aplicacion/contratos';
import { ExcepcionFinn } from '@finn/aplicacion/errores';
import { exportar } from '@finn/aplicacion/exportacion';
import { memoriaDeInstancia } from '@finn/aplicacion/memoria';
import {
  exigirSesionAal2,
  sesionDeLaPeticion,
  usuarioPermitido,
} from '../../../../servidor/sesion.ts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _peticion: Request,
  { params }: { params: Promise<{ formato: string }> },
): Promise<Response> {
  const sesion = await exigirSesionAal2();
  if (!sesion.ok) return new Response(null, { status: 401 });
  const formato = formatoExportacion.safeParse((await params).formato);
  if (!formato.success) return new Response(null, { status: 404 });
  try {
    const archivo = await exportar(
      {
        memoria: memoriaDeInstancia,
        sesion: await sesionDeLaPeticion(),
        usuarioPermitido: usuarioPermitido(),
        opciones: () => ({ reloj: relojDePrueba() }),
      },
      formato.data,
    );
    return new Response(archivo.contenido, {
      headers: {
        'Content-Type': archivo.tipoMime,
        'Content-Disposition': `attachment; filename="${archivo.nombre}"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (e) {
    const noAutorizado = e instanceof ExcepcionFinn && e.error.categoria === 'NO_AUTORIZADO';
    return new Response(null, { status: noAutorizado ? 401 : 503 });
  }
}
