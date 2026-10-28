// El cliente de Prisma de Finn (04 §2.5; ADR-05; BE-33). Solo lo usa `transacciones.ts`: fuera de @finn/db
// nadie recibe el `PrismaClient` (04 §4.1, BE-11).
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generado/prisma/client.ts';

export type Cliente = PrismaClient;

/**
 * Un cliente sobre `url`: de 1 a 3 conexiones por instancia (ADR-05) y la zona UTC como segunda barrera de la
 * sesión (04 §13.6, decisión 3). Supavisor y PgBouncer pueden ignorar `options`: la barrera que cuenta es el
 * `set_config('TimeZone', 'UTC', true)` de cada transacción.
 */
export const crearCliente = (url: string): Cliente =>
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: url, options: '-c TimeZone=UTC', max: 3 }),
  });

const global = globalThis as typeof globalThis & { finnCliente?: Cliente };
let delProceso: Cliente | undefined;

/**
 * El cliente del proceso, con `DATABASE_URL` (pooler en modo transacción), creado al primer uso. En desarrollo
 * se guarda además en `globalThis`, para que la recarga de módulos no abra otro pool (04 §2.5).
 */
export function cliente(): Cliente {
  delProceso ??= global.finnCliente;
  if (delProceso) return delProceso;
  const url = process.env['DATABASE_URL'];
  if (!url) throw new Error('Falta DATABASE_URL');
  delProceso = crearCliente(url);
  if (process.env['NODE_ENV'] !== 'production') global.finnCliente = delProceso;
  return delProceso;
}
