// `GET /api/tareas/diaria` (04 §10.1, §10.5, §12.5): adaptador de `ejecutarDiaria` (DT-19). Lo dispara Vercel Cron con
// `Authorization: Bearer <CRON_SECRET>`. Sin el secreto, 401 sin ejecutar nada; si un paso falla, la tarea sigue y deja
// su evento y su aviso (10.3), así que la respuesta sigue siendo 200 y dice qué pasó en cada paso.
import { relojDePrueba } from '@finn/aplicacion';
import { memoriaDeInstancia } from '@finn/aplicacion/memoria';
import { secretoValido } from '@finn/aplicacion/respaldo/eventos';
import { ejecutarDiaria } from '@finn/aplicacion/tareas/diaria';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(peticion: Request): Promise<Response> {
  const autorizacion = peticion.headers.get('authorization');
  // Sin `CRON_SECRET` (o con menos de 32 caracteres), `secretoValido` no autentica a nadie
  if (!secretoValido(autorizacion, process.env['CRON_SECRET'] ?? ''))
    return new Response(null, { status: 401 });
  const r = await ejecutarDiaria({
    memoria: memoriaDeInstancia,
    opciones: () => ({ reloj: relojDePrueba() }),
  });
  return Response.json(r);
}
