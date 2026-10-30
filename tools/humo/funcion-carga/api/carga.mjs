// tools/humo/funcion-carga/api/carga.mjs — la función temporal de H-09 (04 §17.2, BE-58; 04 §5.6 [R1]). Se despliega
// en Vercel (`iad1`) solo durante el paso y mide desde ahí la carga completa del motor: las 18 consultas de 04 §5.2
// contra el esquema `humo`, `veces` cargas seguidas en una transacción de lectura como la de `leer()` (04 §5.1), con
// los milisegundos y los bytes de cada una. POST con { url, consultas, veces } y la cabecera `x-humo-llave`: la URL
// (finn_app por el pooler) viaja en el cuerpo, por HTTPS, y nunca queda guardada en Vercel.
// `preparar.ts despliegue` reemplaza LLAVE por la de esta ejecución; `preparar.ts local` usa `crear` sin desplegar.
import { Buffer } from 'node:buffer';
import { performance } from 'node:perf_hooks';

const LLAVE = '';

/** El manejador con el cliente de PostgreSQL y la llave dados. */
export function crear(Client, llave) {
  return async (request) => {
    if (!llave || request.headers.get('x-humo-llave') !== llave)
      return new globalThis.Response('{"error":"llave"}', { status: 403 });
    const { url, consultas, veces } = await request.json();
    const db = new Client({ connectionString: url });
    await db.connect();
    try {
      const cargas = [];
      let filas = {};
      for (let i = 0; i < veces; i++) {
        const inicio = performance.now();
        const textos = {};
        await db.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
        for (const { tabla, sql } of consultas) textos[tabla] = (await db.query(sql)).rows[0].filas;
        await db.query('COMMIT');
        const ms = performance.now() - inicio;
        const bytes = Object.values(textos).reduce((s, t) => s + Buffer.byteLength(t), 0);
        cargas.push({ ms: Math.round(ms), bytes });
        // Fuera de la medición: las filas por tabla de la primera carga
        if (i === 0)
          filas = Object.fromEntries(
            Object.entries(textos).map(([t, s]) => [t, JSON.parse(s).length]),
          );
      }
      return globalThis.Response.json({
        region: process.env.VERCEL_REGION ?? 'local',
        cargas,
        filas,
      });
    } finally {
      await db.end();
    }
  };
}

export async function POST(request) {
  const { default: pg } = await import('pg');
  return crear(pg.Client, LLAVE)(request);
}
