// tools/humo/patron.ts — H-06 de la prueba de humo (04 §17.2; RK-06): el patrón transaccional por el pooler en
// modo transacción. Repite V-01, V-02, V-05 a V-08, V-10 y V-11 de 04 §0.7 con `escribir()` y `leer()` de
// @finn/db (TA-150) sobre `DATABASE_URL` (6543, `pgbouncer=true`), más 50 escrituras seguidas en el mismo pool.
// Uso: DATABASE_URL=… node tools/humo/patron.ts. Escribe `medido <V-nn> <resultado>` y `detalle …` (humo.sh);
// sale con 1 si alguna falla. Lo que escribe en finn.deudores lleva el prefijo `humo-patron` y lo borra al final.
// Diferencias con las pruebas locales (07 §20.1): sin registro de sentencias del servidor, V-11 se comprueba por
// su efecto (sin SAVEPOINT, el xmin de cada fila es la transacción principal, 03 §4.6.2); V-05 busca, entre las
// lecturas siguientes, 6 que caigan en la conexión de servidor de la fusión; V-06 usa la clave de `deudores`.
import { registerHooks } from 'node:module';
import { performance } from 'node:perf_hooks';

// Node 24 corre este archivo sin transformar; el código de @finn/db importa sin extensión (verificar-motor.ts)
registerHooks({
  resolve(especificador, contexto, siguiente) {
    try {
      return siguiente(especificador, contexto);
    } catch (e) {
      if (
        !especificador.startsWith('.') ||
        (e as { code?: string }).code !== 'ERR_MODULE_NOT_FOUND'
      )
        throw e;
      for (const sufijo of ['.ts', '/index.ts'])
        try {
          return siguiente(especificador + sufijo, contexto);
        } catch {
          // probar el siguiente sufijo
        }
      throw e;
    }
  },
});

const url = process.env['DATABASE_URL'] ?? '';
if (!url) {
  console.log('detalle falta DATABASE_URL');
  process.exit(1);
}
const { crearCliente } = await import('../../packages/db/src/cliente.ts');
const { transaccionesSobre, txPrisma } = await import('../../packages/db/src/transacciones.ts');
const { sqlstateDe } = await import('../../packages/db/src/errores.ts');
type Escritor = Parameters<typeof txPrisma>[0];

const PREFIJO = 'humo-patron';
const db = crearCliente(url);
const { escribir, leer } = transaccionesSobre(db);
let fallas = 0;

const exigir = (condicion: boolean, mensaje: string): void => {
  if (!condicion) throw new Error(mensaje);
};
const fallo = (p: Promise<unknown>): Promise<unknown> =>
  p.then(
    () => undefined,
    (e: unknown) => e,
  );
const forma = (e: unknown): string => {
  const s = sqlstateDe(e);
  return s ? `${s.codigoPrisma ?? '-'} ${s.sqlstate}` : String(e);
};
const crear = (t: Escritor, nombre: string) =>
  txPrisma(t).deudor.create({ data: { nombre: `${PREFIJO} ${nombre}` } });
function puerta(): { esperar: Promise<void>; abrir: () => void } {
  let abrir = (): void => undefined;
  const esperar = new Promise<void>((r) => (abrir = r));
  return { esperar, abrir };
}
type Sesion = { pid: number; op: string };
const sesion = async (t: Escritor): Promise<Sesion> => {
  const [s] = await txPrisma(t).$queryRaw<Sesion[]>`SELECT pg_backend_pid() AS pid,
    coalesce(current_setting('finn.operacion', true), '') AS op`;
  if (!s) throw new Error('sin fila de sesión');
  return s;
};
/** Espera, sin reloj ni `sleep`, a que una sesión de esta base tenga (o espere) el bloqueo de Finn. */
async function esperarBloqueo(concedido: boolean): Promise<void> {
  for (let i = 0; i < 20_000; i++) {
    const [f] = await leer(
      (t) => txPrisma(t).$queryRaw<{ n: number }[]>`SELECT count(*)::int AS n FROM pg_locks
        WHERE locktype = 'advisory' AND granted = ${concedido}
          AND database = (SELECT oid FROM pg_database WHERE datname = current_database())`,
    );
    if (f?.n === 1) return;
  }
  throw new Error(`ninguna sesión ${concedido ? 'tomó' : 'esperó'} el bloqueo`);
}

async function verificar(v: string, fn: () => Promise<string>): Promise<void> {
  try {
    console.log(`medido ${v} ${await fn()}`);
  } catch (e) {
    fallas++;
    console.log(`medido ${v} falla`);
    console.log(
      `detalle ${v}: ${(e instanceof Error ? e.message : String(e)).split('\n')[0] ?? ''}`,
    );
  }
}

await verificar('V-01', async () => {
  const e = await fallo(db.deudor.create({ data: { nombre: `${PREFIJO} V-01` } }));
  exigir(forma(e) === 'P2039 FN001', `se esperaba P2039 FN001: ${forma(e)}`);
  return 'P2039 FN001';
});

await verificar('V-02', async () => {
  const r = await escribir(async (t) => {
    await crear(t, 'V-02 a');
    await crear(t, 'V-02 b');
    const [s] = await txPrisma(t).$queryRaw<{ bloqueo: boolean; marca: boolean; zona: string }[]>`
      SELECT EXISTS (SELECT 1 FROM pg_locks WHERE locktype = 'advisory' AND pid = pg_backend_pid()
        AND granted) AS bloqueo,
      coalesce(current_setting('finn.bloqueo_xact', true), '') = pg_current_xact_id()::text AS marca,
      current_setting('TimeZone') AS zona`;
    return { estado: t.estado, despues: await t.revisionActual(), s };
  });
  exigir(
    BigInt(r.despues) - BigInt(r.estado.revision) === 1n,
    `revisión ${r.estado.revision} → ${r.despues}`,
  );
  exigir(r.s?.bloqueo === true && r.s.marca && r.s.zona === 'UTC', `sesión ${JSON.stringify(r.s)}`);
  exigir(
    /^\d{4}-\d{2}-\d{2}$/.test(r.estado.hoy) && r.estado.instante !== '',
    'sin hoy o instante',
  );
  return 'revision +1';
});

await verificar('V-05', async () => {
  const fusion = await escribir(async (t) => {
    await t.declararOperacion('fusion');
    return sesion(t);
  });
  exigir(fusion.op === 'fusion', `finn.operacion dentro: ${fusion.op}`);
  let [mismas, intentos] = [0, 0];
  while (mismas < 6 && intentos < 1_000) {
    intentos++;
    const s = await leer(sesion);
    if (s.pid !== fusion.pid) continue;
    mismas++;
    exigir(s.op === '', `finn.operacion se filtró: ${s.op}`);
  }
  exigir(mismas === 6, `${mismas} de 6 transacciones en la conexión de la fusión`);
  return `sin filtrar (${intentos} lecturas)`;
});

await verificar('V-06', async () => {
  const { id } = await escribir((t) => crear(t, 'V-06'));
  const e = await fallo(
    escribir((t) => txPrisma(t).deudor.create({ data: { id, nombre: `${PREFIJO} V-06 b` } })),
  );
  const s = sqlstateDe(e);
  const m = `${s?.codigoPrisma ?? '-'} ${s?.sqlstate ?? String(e)} ${s?.restriccion ?? '-'}`;
  exigir(m === 'P2002 23505 deudores_pkey', `se esperaba P2002 23505 deudores_pkey: ${m}`);
  return m;
});

await verificar('V-07', async () => {
  const s = await leer(
    async (t) =>
      (
        await txPrisma(t).$queryRaw<{ iso: string; ro: string }[]>`
        SELECT current_setting('transaction_isolation') AS iso, current_setting('transaction_read_only') AS ro`
      )[0],
  );
  exigir(s?.iso === 'repeatable read' && s.ro === 'on', `sesión ${JSON.stringify(s)}`);
  const e = await fallo(
    leer(async (t) => {
      await txPrisma(t).$executeRaw`SELECT finn.tomar_bloqueo()`;
      await crear(t, 'V-07');
    }),
  );
  exigir(sqlstateDe(e)?.sqlstate === '25006', `escritura en leer(): ${forma(e)}`);
  return 'repeatable read, read only, 25006';
});

await verificar('V-08', async () => {
  const soltar = puerta();
  const primero = escribir(async (t) => {
    await crear(t, 'V-08');
    await soltar.esperar;
    return t.revisionActual();
  });
  await esperarBloqueo(true);
  const inicio = performance.now();
  const segundo = escribir(async (t) => ({
    revision: t.estado.revision,
    vistos: await txPrisma(t).deudor.count({ where: { nombre: `${PREFIJO} V-08` } }),
  }));
  await esperarBloqueo(false);
  soltar.abrir();
  const [a, b] = await Promise.all([primero, segundo]);
  exigir(
    b.vistos === 1 && b.revision === a,
    `vio ${b.vistos} filas, revisión ${b.revision} (${a})`,
  );
  return `vio lo confirmado tras ${Math.round(performance.now() - inicio)} ms`;
});

await verificar('V-10', async () => {
  const soltar = puerta();
  const primero = escribir(() => soltar.esperar);
  await esperarBloqueo(true);
  const inicio = performance.now();
  const e = await fallo(escribir((t) => crear(t, 'V-10')));
  const ms = Math.round(performance.now() - inicio);
  soltar.abrir();
  await primero;
  exigir(forma(e) === 'P2010 55P03' && ms >= 9_500, `${forma(e)} a los ${ms} ms`);
  return `P2010 55P03 a los ${ms} ms`;
});

await verificar('V-11', async () => {
  const r = await escribir(async (t) => {
    const ids = [(await crear(t, 'V-11 a')).id, (await crear(t, 'V-11 b')).id];
    // xmin es el xid de 32 bits; pg_current_xact_id() lleva además la época
    const [s] = await txPrisma(t).$queryRaw<{ n: number; iso: string }[]>`
      SELECT count(*)::int AS n, current_setting('transaction_isolation') AS iso FROM finn.deudores
      WHERE id = ANY (${ids}::uuid[])
        AND xmin::text = (pg_current_xact_id()::text::bigint % 4294967296)::text`;
    return s;
  });
  exigir(
    r?.n === 2 && r.iso === 'read committed',
    `filas de la transacción principal: ${JSON.stringify(r)}`,
  );
  return 'sin SAVEPOINT, read committed';
});

await verificar('escrituras', async () => {
  const revision = () => leer((t) => Promise.resolve(BigInt(t.estado.revision)));
  const antes = await revision();
  const errores: string[] = [];
  for (let i = 0; i < 50; i++)
    await escribir((t) => crear(t, `50 ${i}`)).catch((e: unknown) => errores.push(forma(e)));
  const subio = (await revision()) - antes;
  exigir(
    errores.length === 0 && subio === 50n,
    `${errores.length} errores (${errores[0] ?? ''}), revisión +${subio}`,
  );
  return '50';
});

await verificar('limpieza', async () => {
  const { count } = await escribir((t) =>
    txPrisma(t).deudor.deleteMany({ where: { nombre: { startsWith: PREFIJO } } }),
  );
  return `${count} filas`;
});

await db.$disconnect();
if (fallas) console.log('detalle alternativa: RK-06, finn_app por el pooler en modo sesión (5432)');
process.exit(fallas ? 1 : 0);
