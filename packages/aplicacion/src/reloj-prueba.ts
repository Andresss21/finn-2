// Reloj de prueba del servidor (CT-01; 07 §4.1–§4.3, 04 §13.1.4). Portado del prototipo verificado en V7-07 con
// la regla de P7-10 (docs/anexos/07-pruebas-verificacion/…/web/lib/reloj-permitido.ts y reloj-prueba.ts).
// - `relojPermitido()`: la lista de permitidos, sin E/S, que usan las dos barreras de la aplicación.
// - `relojDePrueba()`: la barrera 2. Fuera de la lista de permitidos devuelve `null` sin leer nada, aunque el
//   archivo exista. La barrera 1 (`instrumentation.ts`, no arrancar) es de la Parte C.
// Es una excepción de L20: el reloj simulado avanza con el real, así que lee `Date.now()`.
import { readFileSync } from 'node:fs';
import * as z from 'zod';
import type { Instante } from '@finn/dominio';
import type { RelojTx } from '@finn/db';
import { fechaLocalDeInstante } from './tiempo/index.ts';

export type Entorno = Readonly<Record<string, string | undefined>>;

/** Las variables del reloj de prueba: si existe una (aunque esté vacía) fuera de la lista, la app no arranca. */
export const VARIABLES_DE_RELOJ = ['FINN_RELOJ_ARCHIVO', 'FINN_HOY_SIMULADO'] as const;

const definida = (env: Entorno, v: string): boolean => Object.prototype.hasOwnProperty.call(env, v);

/**
 * P7-10: el reloj de prueba solo se permite con `FINN_ENTORNO === 'pruebas'` y `VERCEL_ENV` sin definir, con
 * cualquier valor (vacía también cuenta como definida). `NODE_ENV` no decide (`next start` corre en production).
 */
export function relojPermitido(env: Entorno = process.env): boolean {
  return env['FINN_ENTORNO'] === 'pruebas' && !definida(env, 'VERCEL_ENV');
}

/** Si existe alguna variable del reloj de prueba, aunque esté vacía (barrera 1). */
export function hayVariableDeReloj(env: Entorno = process.env): boolean {
  return VARIABLES_DE_RELOJ.some((v) => definida(env, v));
}

/** Las dos lecturas con efecto: el archivo y el reloj real. Las pruebas en proceso pasan las suyas. */
export interface FuentesDeReloj {
  leerArchivo(ruta: string): string;
  ahoraMs(): number;
}
const FUENTES_REALES: FuentesDeReloj = {
  leerArchivo: (ruta) => readFileSync(ruta, 'utf8'),
  ahoraMs: () => Date.now(),
};

// `{ instante, fijadoEn }` que escribe la prueba: un ISO con zona y los milisegundos reales al fijarlo (07 §4.1)
const archivoDeReloj = z.object({
  instante: z.iso.datetime({ offset: true }),
  fijadoEn: z.number().int().nonnegative().refine(Number.isSafeInteger),
});

const noExiste = (e: unknown): boolean => (e as { code?: unknown } | null)?.code === 'ENOENT';

/**
 * El reloj de la petición para `escribir()` y `leer()` (`RelojTx`): `null` fuera de la lista de permitidos, sin
 * `FINN_RELOJ_ARCHIVO` o si el archivo todavía no existe (reloj real). Se relee en cada petición, así una prueba
 * cambia el reloj sin reiniciar. Simulado = real + (instante − fijadoEn); `hoy` es su fecha en El Salvador.
 * Un archivo malformado lanza: una prueba no debe seguir en silencio con el reloj real.
 */
export function relojDePrueba(
  env: Entorno = process.env,
  fuentes: FuentesDeReloj = FUENTES_REALES,
): RelojTx | null {
  if (!relojPermitido(env)) return null; // barrera 2
  const ruta = env['FINN_RELOJ_ARCHIVO'];
  if (!ruta) return null;
  let texto: string;
  try {
    texto = fuentes.leerArchivo(ruta);
  } catch (e) {
    if (noExiste(e)) return null;
    throw e;
  }
  let crudo: unknown;
  try {
    crudo = JSON.parse(texto);
  } catch {
    crudo = undefined;
  }
  const r = archivoDeReloj.safeParse(crudo);
  if (!r.success)
    throw new Error(`finn: el archivo de reloj de prueba ${ruta} no es { instante, fijadoEn }`);
  const desfaseMs = Date.parse(r.data.instante) - r.data.fijadoEn;
  const simulado = new Date(fuentes.ahoraMs() + desfaseMs).toISOString() as Instante;
  return { hoy: fechaLocalDeInstante(simulado), desfaseMs };
}

/**
 * El instante de la petición para `previsualizar` (04 §4.3: `leer()` no lo da; el de `confirmar` es `finn.instante()`): el
 * reloj real, más el desfase del reloj de prueba cuando está permitido. No se guarda en ninguna parte.
 */
export function instanteDeLaPeticion(
  env: Entorno = process.env,
  fuentes: FuentesDeReloj = FUENTES_REALES,
): Instante {
  const desfaseMs = relojDePrueba(env, fuentes)?.desfaseMs ?? 0;
  return new Date(fuentes.ahoraMs() + desfaseMs).toISOString() as Instante;
}
