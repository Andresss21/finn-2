// `POST /api/respaldo/{respaldo,restauracion,deriva}` (04 §3.10 OPT-09, §12.5, §16.3, §16.4; ADR-22): adaptador de
// `registrarEventoRespaldo`, que autentica con `RESPALDO_SECRET` y valida el evento y el cuerpo. Ni el secreto ni el
// cuerpo se registran (15.3).
import { relojDePrueba } from '@finn/aplicacion';
import { registrarEventoRespaldo } from '@finn/aplicacion/respaldo/eventos';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  peticion: Request,
  { params }: { params: Promise<{ evento: string }> },
): Promise<Response> {
  const { estado } = await registrarEventoRespaldo(
    {
      autorizacion: peticion.headers.get('authorization'),
      evento: (await params).evento,
      cuerpo: await peticion.text(),
    },
    {
      // Sin el secreto (o con menos de 32 caracteres), `secretoValido` no autentica a nadie
      secreto: process.env['RESPALDO_SECRET'] ?? '',
      opciones: () => ({ reloj: relojDePrueba() }),
    },
  );
  return new Response(null, { status: estado });
}
