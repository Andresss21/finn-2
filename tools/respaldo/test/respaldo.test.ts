// Respaldo y restauración en el nocturno (TA-251; 07 §1.1 y §19.6, nivel RES; 03 §12.1 y §12.2; 04 §16.3 y §16.4).
// Una base de prueba sembrada con el volumen base (tools/pruebas/volumen, cargado por período con escribir()) se
// vuelca con `respaldar.mjs` como finn_respaldo, el volcado y el manifiesto se cifran con `age` (una clave X25519
// generada aquí; nunca la real) y se descifran, y `restaurar.sh` los restaura en un PostgreSQL vacío, sin `auth`
// ni los roles de Supabase. El control: un volcado con una FK hacia `auth.users` falla al restaurar (03 §12.3).
// Los clientes de PostgreSQL son los del contenedor vacío (misma versión mayor que el servidor, 04 §16.2), a
// través de `pg-docker.mjs`. Sin R2 ni proyecto real (07 §1.1).
import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Decrypter, Encrypter, generateX25519Identity, identityToRecipient } from 'age-encryption';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Cambio, TablaEscribible, Uuid } from '../../../packages/dominio/src/index.ts';
import { escribir } from '../../../packages/db/src/index.ts';
import {
  consultar,
  crearBasePrueba,
  pgMayor,
  type BasePrueba,
} from '../../../packages/db/test/ayudantes/base.ts';
import {
  conteo,
  fechaFinal,
  generarHechos,
  generarPeriodos,
  TABLAS_MOTOR,
} from '../../pruebas/volumen/generar.ts';

const raiz = fileURLToPath(new URL('../../../', import.meta.url)).replaceAll('\\', '/');
const VOLUMEN = { nivel: 'base', anios: 10, semilla: 1 } as const;
const CLAVE_DESTINO = 'respaldo-destino'; // del contenedor efímero; no existe fuera de él
const CLAVE_RESPALDO = 'arnes-respaldo'; // la de finn_respaldo en el arnés (packages/db/test/ayudantes/base.ts)

const origen = crearBasePrueba();
const conAuth = crearBasePrueba({ reloj: false });
const trabajo = mkdtempSync(join(tmpdir(), 'finn-respaldo-')).replaceAll('\\', '/');
let contenedor = '';
let entorno: NodeJS.ProcessEnv = {};

const docker = (...args: string[]): string => {
  const r = spawnSync('docker', args, { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`docker ${args[0] ?? ''}: ${r.stderr}`);
  return r.stdout.trim();
};
const correr = (cmd: string, args: string[]): SpawnSyncReturns<string> =>
  spawnSync(cmd, args, { cwd: raiz, encoding: 'utf8', env: entorno, maxBuffer: 64 << 20 });
const salidaDe = (r: SpawnSyncReturns<string>): string => `${r.stdout}\n${r.stderr}`;
const urlRespaldo = (b: BasePrueba): string =>
  b.urlAdmin.replace(/\/\/[^@]+@/, `//finn_respaldo:${CLAVE_RESPALDO}@`);
const huella = (b: Uint8Array): string => createHash('sha256').update(b).digest('hex');

/** El volumen base, período por período, con `finn.hoy` = fin del período (07 §12.7). */
async function sembrar(): Promise<void> {
  const [fila] = await consultar(
    origen.urlAdmin,
    `SELECT id FROM finn.grupos WHERE clave_sistema = 'pagos_tarjeta'`,
  );
  process.env['DATABASE_URL'] = origen.url;
  for (const p of generarPeriodos({ ...VOLUMEN, grupoPagos: fila as Uuid })) {
    const cambios = TABLAS_MOTOR.flatMap((t) =>
      (p.filas[t] as object[]).map((f) => ({ tipo: 'insertar', tabla: t, fila: f })),
    ) as unknown as Cambio[];
    await escribir((tx) => tx.aplicarCambios(cambios), { reloj: { hoy: p.hoy, desfaseMs: 0 } });
  }
}

/** Un PostgreSQL de la misma versión, vacío: sin `auth`, sin roles de Supabase y sin el bootstrap (03 §12.2). */
function levantarDestino(): void {
  contenedor = docker(
    'run',
    ...['-d', '--rm', '-e', `POSTGRES_PASSWORD=${CLAVE_DESTINO}`, '-p', '127.0.0.1::5432'],
    ...['--add-host', 'host.docker.internal:host-gateway'],
    `public.ecr.aws/docker/library/postgres:${pgMayor()}`,
  );
  // Listo cuando acepta TCP: el servidor temporal de la inicialización solo escucha el socket
  let listo = false;
  for (let i = 0; i < 600 && !listo; i++)
    listo =
      spawnSync('docker', ['exec', contenedor, 'pg_isready', '-q', '-h', '127.0.0.1']).status === 0;
  if (!listo) throw new Error('el PostgreSQL de destino no quedó listo');
  const puerto = docker('port', contenedor, '5432/tcp').split(':').pop() ?? '';
  entorno = {
    ...process.env,
    FINN_PG_EXEC: `node ${raiz}tools/respaldo/test/pg-docker.mjs`,
    FINN_PG_CONTENEDOR: contenedor,
    FINN_PG_DESTINO_PUERTO: puerto,
    PGHOST: '127.0.0.1',
    PGPORT: puerto,
    PGUSER: 'postgres',
    PGPASSWORD: CLAVE_DESTINO,
  };
}

beforeAll(async () => {
  levantarDestino();
  await sembrar();
  // El control: una FK de finn hacia auth.users, lo que ADR-22 prohíbe
  await consultar(
    conAuth.urlAdmin,
    `CREATE SCHEMA auth; CREATE TABLE auth.users (id uuid PRIMARY KEY);
     ALTER TABLE finn.deudores ADD COLUMN usuario_id uuid REFERENCES auth.users (id);`,
  );
}, 1_800_000);

afterAll(() => {
  if (contenedor) docker('rm', '-f', contenedor);
  rmSync(trabajo, { recursive: true, force: true });
});

/** `age`: cifra con la clave pública y descifra con la privada; devuelve la ruta del archivo descifrado. */
async function idaYVueltaAge(archivo: string, identidad: string): Promise<string> {
  const claro = readFileSync(archivo);
  const e = new Encrypter();
  e.addRecipient(await identityToRecipient(identidad));
  const cifrado = await e.encrypt(claro);
  writeFileSync(`${archivo}.age`, cifrado);
  expect(new TextDecoder().decode(cifrado.slice(0, 21))).toBe('age-encryption.org/v1');
  expect(huella(cifrado)).not.toBe(huella(claro));
  const d = new Decrypter();
  d.addIdentity(identidad);
  const descifrado = await d.decrypt(readFileSync(`${archivo}.age`));
  expect(huella(descifrado)).toBe(huella(claro));
  writeFileSync(`${archivo}.descifrado`, descifrado);
  return `${archivo}.descifrado`;
}

describe('PRU-RES-RESP', () => {
  it('PRU-RES-RESP-101 ADR-22, RESP-manifiesto: el volcado de una base con el volumen base, cifrado con age, se restaura en una base sin auth con verificar_todo() sin rechazos, conteos y revisión iguales al manifiesto e invariantes del motor sin violaciones; con una FK hacia auth.users la restauración falla', async () => {
    const volcado = `${trabajo}/volcado.dump`;
    const r1 = correr('node', ['tools/respaldo/respaldar.mjs', urlRespaldo(origen), volcado]);
    expect(r1.status, salidaDe(r1)).toBe(0);

    // El manifiesto describe el mismo estado que la base: revisión y filas del volumen (03 §12.1, paso 2)
    const manifiesto = JSON.parse(readFileSync(`${volcado}.manifiesto.json`, 'utf8')) as {
      revision: string;
      conteos: Record<string, number>;
    };
    const [revision] = await consultar(origen.urlAdmin, 'SELECT valor FROM finn.revision');
    expect(manifiesto.revision).toBe(revision);
    const esperado = conteo(generarHechos(VOLUMEN)).tablas;
    for (const t of ['transacciones', 'lineas', 'efectos', 'asignaciones'] as TablaEscribible[])
      expect(manifiesto.conteos[t], t).toBe(esperado[t]);

    // Cifrado con una clave de prueba (04 §16.3, paso 2) y descifrado (03 §12.2, paso 1)
    const identidad = await generateX25519Identity();
    const dump = await idaYVueltaAge(volcado, identidad);
    const man = await idaYVueltaAge(`${volcado}.manifiesto.json`, identidad);

    // El catálogo esperado es el de la base volcada (en producción, catalogo-esperado.txt del commit desplegado)
    const catalogo = `${trabajo}/catalogo-origen.txt`;
    const c = correr('node', [
      `${raiz}tools/respaldo/test/pg-docker.mjs`,
      ...['psql', '-X', '-At', '-d', origen.urlAdmin, '-f', `${raiz}tools/db/catalogo.sql`],
    ]);
    expect(c.status, c.stderr).toBe(0);
    writeFileSync(catalogo, c.stdout);

    const hoy = fechaFinal(VOLUMEN);
    const r2 = correr('bash', [
      'tools/respaldo/restaurar.sh',
      ...[dump, man, catalogo, 'finn_restaurada', hoy],
    ]);
    const s2 = salidaDe(r2);
    expect(r2.status, s2).toBe(0);
    expect(s2).toMatch(/Esquemas auth en la base destino: 0/);
    expect(s2).toMatch(/verificar_todo\(\): \d+ verificaciones sin rechazos/);
    expect(s2).toContain(
      `${Object.keys(manifiesto.conteos).length} tablas, 0 diferencias; revisión ${revision ?? ''} (manifiesto ${revision ?? ''})`,
    );
    expect(s2).toContain(`0 violaciones de invariantes (hoy ${hoy})`);
    expect(s2).toContain('Restauración verificada.');

    // Control (03 §12.3): `pg_restore --exit-on-error` falla en una base donde `auth` no existe
    const conFk = `${trabajo}/con-auth.dump`;
    expect(
      correr('node', ['tools/respaldo/respaldar.mjs', urlRespaldo(conAuth), conFk]).status,
    ).toBe(0);
    const r3 = correr('bash', [
      'tools/respaldo/restaurar.sh',
      ...[conFk, `${conFk}.manifiesto.json`, catalogo, 'finn_con_auth', hoy],
    ]);
    expect(r3.status).not.toBe(0);
    expect(salidaDe(r3)).toMatch(/schema "auth" does not exist/);
    expect(salidaDe(r3)).not.toContain('Restauración verificada.');
  }, 600_000);
});
