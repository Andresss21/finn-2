// `consultar` de desplegar y el cliente de `respaldar.mjs` usan la configuración TLS de @finn/db (CH-65). Sin red ni base:
// el `pg` real no se conecta, `consultar` recibe un cliente simulado.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CA_SUPABASE } from '../../packages/db/src/tls.ts';
import { consultar } from './desplegar.mjs';

const POOLER = 'aws-0-us-east-1.pooler.supabase.com';

function clienteSimulado() {
  const creados: unknown[] = [];
  class Cliente {
    constructor(cfg: unknown) {
      creados.push(cfg);
    }
    connect = () => Promise.resolve();
    end = () => Promise.resolve();
    query = () => Promise.resolve({ rows: [['a', null]] });
  }
  return { Cliente, creados };
}

describe('consultar de desplegar', () => {
  it('tls: la URL de producción sale con la CA de Supabase y sin sslmode', async () => {
    const { Cliente, creados } = clienteSimulado();
    const filas = await consultar(
      `postgresql://finn_migraciones.r:c@${POOLER}:5432/postgres?sslmode=require`,
      'SELECT 1',
      Cliente,
    );
    expect(filas).toEqual(['a|']);
    expect(creados).toEqual([
      {
        connectionString: `postgresql://finn_migraciones.r:c@${POOLER}:5432/postgres`,
        ssl: { ca: CA_SUPABASE, rejectUnauthorized: true },
      },
    ]);
  });

  it('tls: una URL local queda igual', async () => {
    const { Cliente, creados } = clienteSimulado();
    await consultar('postgresql://u:p@localhost:5432/d', 'SELECT 1', Cliente);
    expect(creados).toEqual([{ connectionString: 'postgresql://u:p@localhost:5432/d' }]);
  });
});

describe('respaldar.mjs', () => {
  it('tls: su cliente de pg usa configPg y pg_dump sigue recibiendo la URL original', () => {
    const fuente = readFileSync(new URL('../respaldo/respaldar.mjs', import.meta.url), 'utf8');
    expect(fuente).toContain('new pg.Client(configPg(url))');
    expect(fuente).toMatch(/'--dbname',\s+url,/);
  });
});
