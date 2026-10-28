// `@finn/aplicacion/config` (04 §14.2, BE-08): las variables de la aplicación, validadas con Zod al arrancar. Si
// falta una o tiene un formato inválido, `leerConfiguracion()` lanza un error que nombra cada variable y su
// problema sin mostrar su valor (varias son secretas). Las variables del reloj de prueba no están aquí: las
// decide `relojPermitido()` (07 §4.3), y `DIRECT_URL` tampoco, porque la aplicación nunca migra.
import * as z from 'zod';

const presente = (que: string) =>
  z.string({ error: `falta (${que})` }).min(1, { error: `falta (${que})` });
const secreto = presente('≥ 32 bytes aleatorios').min(32, {
  error: 'tiene menos de 32 caracteres',
});
const conFormato = (que: string, patron: RegExp) =>
  presente(que).regex(patron, { error: `no tiene el formato ${que}` });

// `k2:<32 bytes en base64>,k1:<…>` (04 §9.6); 32 bytes en base64 son 43 caracteres y un `=`
const CLAVE_CONCILIACION = /^[a-z0-9]+:[A-Za-z0-9+/]{43}=$/;

const esquema = z
  .object({
    // Local y CI usan una base sin el pooler: solo se exige el esquema postgresql:// (ADR-05)
    DATABASE_URL: conFormato('postgresql://…', /^postgres(ql)?:\/\/\S+$/),
    NEXT_PUBLIC_SUPABASE_URL: conFormato('https://…', /^https?:\/\/[^\s/]+\S*$/),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: presente('clave pública de Auth'),
    FINN_USUARIO_ID: conFormato(
      'UUID (sub)',
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    ),
    CRON_SECRET: secreto,
    RESPALDO_SECRET: secreto,
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: presente('clave pública de Web Push'),
    VAPID_PRIVATE_KEY: presente('clave privada de Web Push'),
    VAPID_SUBJECT: conFormato('mailto: o https://', /^(mailto:\S+@\S+|https:\/\/\S+)$/),
    FINN_CONCILIACION_CLAVES: presente('k2:<base64>,k1:<…>').refine(
      (t) => t.split(',').every((c) => CLAVE_CONCILIACION.test(c)),
      { error: 'no tiene el formato k2:<32 bytes en base64>,k1:<…>' },
    ),
    FINN_CONCILIACION_CLAVE_ACTIVA: presente('identificador de la clave activa'),
    FINN_CARGA_INCREMENTAL: z
      .enum(['off', 'on'], { error: 'tiene que ser off u on' })
      .default('off'),
    FINN_WEBHOOK_FORMATO: z
      .enum(['json', 'texto'], { error: 'tiene que ser json o texto' })
      .default('json'),
  })
  .transform((c, ctx) => {
    const claves = Object.fromEntries(
      c.FINN_CONCILIACION_CLAVES.split(',').map((par) => [
        par.slice(0, par.indexOf(':')),
        par.slice(par.indexOf(':') + 1),
      ]),
    );
    if (!(c.FINN_CONCILIACION_CLAVE_ACTIVA in claves)) {
      ctx.addIssue({
        code: 'custom',
        path: ['FINN_CONCILIACION_CLAVE_ACTIVA'],
        message: 'no está en FINN_CONCILIACION_CLAVES',
      });
      return z.NEVER;
    }
    return { ...c, conciliacion: { activa: c.FINN_CONCILIACION_CLAVE_ACTIVA, claves } };
  });

export type Configuracion = z.output<typeof esquema>;

/**
 * Valida las variables de 04 §14.2. Lanza con la lista de variables inválidas (sin sus valores); el arranque
 * lo registra en la consola y no sigue.
 */
export function leerConfiguracion(
  env: Readonly<Record<string, string | undefined>> = process.env,
): Configuracion {
  const r = esquema.safeParse(env);
  if (r.success) return r.data;
  const problemas = r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
  throw new Error(`finn: configuración inválida (04 §14.2): ${problemas.join('; ')}`);
}
