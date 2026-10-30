// `POST /api/sms` (04 §8.1, §8.2; N-01; BE-44, BE-59): adaptador de `recibir` (DT-19). Corta el cuerpo a los 16 KiB,
// traduce a HTTP lo que devuelve y deja el procesamiento en `after()`. Ni el token ni el cuerpo se registran.
import { after } from 'next/server';
import { relojDePrueba } from '@finn/aplicacion';
import { memoriaDeInstancia } from '@finn/aplicacion/memoria';
import { LIMITE_CUERPO_BYTES, recibir } from '@finn/aplicacion/sms/recibir';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/** Paso 1 de 8.2: el cuerpo completo, o `null` si `Content-Length` o el flujo pasan del límite (sin leer el resto). */
async function leerConLimite(peticion: Request): Promise<Uint8Array | null> {
  if (Number(peticion.headers.get('content-length')) > LIMITE_CUERPO_BYTES) return null;
  if (peticion.body === null) return new Uint8Array();
  const lector = peticion.body.getReader();
  const trozos: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await lector.read();
    if (done) return Buffer.concat(trozos);
    total += value.byteLength;
    if (total > LIMITE_CUERPO_BYTES) {
      await lector.cancel();
      return null;
    }
    trozos.push(value);
  }
}

export async function POST(peticion: Request): Promise<Response> {
  const inicio = performance.now();
  const cuerpo = await leerConLimite(peticion);
  if (cuerpo === null) return new Response(null, { status: 413 });
  const r = await recibir(
    {
      autorizacion: peticion.headers.get('authorization'),
      contentType: peticion.headers.get('content-type'),
      remitente: peticion.headers.get('x-finn-remitente'),
      cuerpo,
    },
    {
      memoria: memoriaDeInstancia,
      // La configuración ya validó el valor al arrancar (04 §14.2); por omisión, `json` (BE-61)
      formato: process.env['FINN_WEBHOOK_FORMATO'] === 'texto' ? 'texto' : 'json',
      opciones: () => ({ reloj: relojDePrueba() }),
      transcurridoMs: () => performance.now() - inicio,
    },
  );
  if (r.estado === 200) {
    after(r.despues);
    return Response.json(r.cuerpo);
  }
  if (r.estado === 503)
    return new Response(null, {
      status: 503,
      headers: { 'Retry-After': String(r.reintentarEn) },
    });
  return new Response(null, { status: r.estado });
}
