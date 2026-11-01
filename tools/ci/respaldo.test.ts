// PRU-SEG-OPER-104 (TA-261; 02 ADR-22; 04 §16.1 a §16.3; 07 §6.1, §32.3; DT-17): lee .github/workflows/respaldo.yml, y
// comprueba con dobles que tools/respaldo/subir.mjs no registra un respaldo que no subió. Ninguna prueba toca B2, la
// base ni la app.
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { claves, ejecutar, regionDe, type Deps } from '../respaldo/subir.mjs';

type Paso = {
  id?: string;
  uses?: string;
  run?: string;
  if?: string;
  env?: Record<string, string>;
  'continue-on-error'?: boolean;
};
type Wf = {
  on: Record<string, unknown>;
  concurrency: { group: string; 'cancel-in-progress': boolean };
  permissions: Record<string, string>;
  jobs: Record<
    string,
    { if?: string; 'runs-on': string; 'continue-on-error'?: boolean; steps: Paso[] }
  >;
};

const raiz = fileURLToPath(new URL('../..', import.meta.url));
const { load } = createRequire(import.meta.url)('js-yaml') as { load: (s: string) => unknown };
const crudo = readFileSync(join(raiz, '.github', 'workflows', 'respaldo.yml'), 'utf8');
const wf = load(crudo) as Wf;
const pasos = wf.jobs['respaldo']?.steps ?? [];
const paso = (sub: string): Paso => {
  const p = pasos.find((x) => x.run === `node tools/respaldo/subir.mjs ${sub}`);
  if (!p) throw new Error(`respaldo.yml no llama a subir.mjs ${sub}`);
  return p;
};

describe('PRU-SEG-OPER', () => {
  it('PRU-SEG-OPER-104 [M4] respaldo fuera de M4 (DP-36, WF-respaldo; ADR-22, 07 §32.3): respaldo.yml no lee el modo de ahorro ni tiene condiciones, corre a las 07:30 UTC y llama a OPT-09 solo después de subir el volcado', () => {
    // No lee el modo ni restaura su caché, y nada lo saltea ni deja seguir tras un fallo (07 §32.3; 04 §16.3 paso 6)
    expect(crudo).not.toMatch(/ci-modo|ahorro|minutos\.ts|recortes|actions\/cache/);
    expect(Object.keys(wf.jobs)).toEqual(['respaldo']);
    expect(wf.jobs['respaldo']?.if).toBeUndefined();
    expect(wf.jobs['respaldo']?.['continue-on-error']).toBeUndefined();
    for (const p of pasos) {
      expect(p.if, p.run ?? p.uses).toBeUndefined();
      expect(p['continue-on-error'], p.run ?? p.uses).toBeUndefined();
    }
    // 04 §16.1: calendario, disparo manual, runner y concurrencia
    expect(wf.on['schedule']).toEqual([{ cron: '30 7 * * *' }]);
    expect(Object.keys(wf.on).sort()).toEqual(['schedule', 'workflow_dispatch']);
    expect(wf.jobs['respaldo']?.['runs-on']).toBe('ubuntu-24.04');
    expect(wf.concurrency).toEqual({ group: 'respaldo', 'cancel-in-progress': false });
    expect(wf.permissions).toEqual({ contents: 'read' });
    // 04 §16.3: volcar, cifrar y subir, OPT-09 y, al final, los controles contra el commit desplegado
    const orden = ['version', 'volcar', 'subir', 'registrar', 'controles'].map((s) =>
      pasos.indexOf(paso(s)),
    );
    expect(orden).toEqual([...orden].sort((a, b) => a - b));
    const catalogo = pasos.findIndex((p) => p.id === 'catalogo-desplegado');
    expect(catalogo).toBeGreaterThan(pasos.indexOf(paso('registrar')));
    expect(catalogo).toBeLessThan(pasos.indexOf(paso('controles')));
    expect(pasos[catalogo]?.run).toContain("git tag --sort=-v:refname 'desplegado-*'");
    // Cada paso recibe solo sus secretos; los de preparación, ninguno
    const secretos = (p: Paso): string[] => Object.keys(p.env ?? {}).sort();
    expect(secretos(paso('version'))).toEqual(['RESPALDO_DB_URL']);
    expect(secretos(paso('volcar'))).toEqual(['RESPALDO_DB_URL']);
    expect(secretos(paso('subir'))).toEqual([
      'AGE_PUBLIC_KEY',
      'B2_APPLICATION_KEY',
      'B2_BUCKET',
      'B2_ENDPOINT',
      'B2_KEY_ID',
    ]);
    expect(secretos(paso('registrar'))).toEqual(['FINN_URL', 'RESPALDO_SECRET']);
    expect(secretos(paso('controles'))).toEqual(['FINN_URL', 'RESPALDO_DB_URL', 'RESPALDO_SECRET']);
    expect(crudo).not.toMatch(/AGE_PRIVATE_KEY|R2_/);
    for (const p of pasos.filter((x) => !x.run?.startsWith('node tools/respaldo/subir.mjs')))
      expect(p.env, p.run ?? p.uses).toBeUndefined();
    for (const p of pasos.filter((x) => x.uses !== undefined))
      expect(p.uses).toMatch(/^[\w.-]+\/[\w.-]+(\/[\w.-]+)?@[0-9a-f]{40}$/);
    // 04 §16.2: cliente de PGDG de la versión mayor del proyecto
    const herramientas = pasos.find((p) => p.id === 'herramientas')?.run ?? '';
    expect(herramientas).toContain('infra/versiones.env');
    expect(herramientas).toContain('apt.postgresql.org.sh');
    expect(herramientas).toContain('postgresql-client-${PG_MAYOR}');
    expect(herramientas).toMatch(/\bage\b/);
  });
});

describe('respaldo: subir.mjs (04 §16.3)', () => {
  const SECRETO = 'clave-de-prueba-que-nunca-sale-al-log';
  let dir = '';
  let lineas: string[] = [];
  let llamadas: { cmd: string; args: string[]; entorno?: Record<string, string> }[] = [];
  let fallaEn: string | null = null;
  let pedidos: { url: string; cuerpo: unknown; autorizacion: unknown }[] = [];
  let filas: Record<string, string[]> = {};

  const ENV = {
    RESPALDO_DB_URL: 'postgresql://finn_respaldo:x@host.invalid:5432/postgres',
    AGE_PUBLIC_KEY: 'age1publica',
    B2_ENDPOINT: 'https://s3.us-west-004.backblazeb2.com',
    B2_KEY_ID: 'llave-de-prueba',
    B2_APPLICATION_KEY: SECRETO,
    B2_BUCKET: 'cubeta-de-prueba',
    FINN_URL: 'https://finn.invalid/',
    RESPALDO_SECRET: SECRETO,
  };
  const deps = (ahora = '2026-11-02T07:30:00Z', respuesta = 200): Deps => ({
    ahora: () => new Date(ahora),
    log: (l) => lineas.push(l),
    correr: (cmd, args, entorno) => {
      llamadas.push({ cmd, args, ...(entorno ? { entorno } : {}) });
      if (fallaEn !== null && `${cmd} ${args.join(' ')}`.includes(fallaEn))
        return { status: 1, salida: `falló con ${SECRETO}` };
      // `age`: el doble escribe el destino de -o
      const o = args.indexOf('-o');
      if (cmd === 'age' && o >= 0) writeFileSync(args[o + 1] ?? '', 'cifrado');
      if (cmd === 'pg_dump') return { status: 0, salida: 'pg_dump (PostgreSQL) 17.6 (Ubuntu)' };
      return { status: 0, salida: '' };
    },
    consultar: () => Promise.resolve(filas['version'] ?? []),
    c5: () => Promise.resolve(filas['c5'] ?? []),
    c6: () => Promise.resolve(filas['c6'] ?? []),
    pedir: (url, init) => {
      pedidos.push({
        url,
        cuerpo: JSON.parse(init.body as string),
        autorizacion: (init.headers as Record<string, string>)['authorization'],
      });
      return Promise.resolve({ ok: respuesta < 300, status: respuesta });
    },
  });
  const entorno = (): Record<string, string> => ({ ...ENV, RUNNER_TEMP: dir });
  const conVolcado = (): void => {
    mkdirSync(join(dir, 'respaldo'), { recursive: true });
    writeFileSync(join(dir, 'respaldo', 'finn.dump'), 'volcado en claro');
    writeFileSync(
      join(dir, 'respaldo', 'finn.dump.manifiesto.json'),
      JSON.stringify({ revision: '41', conteos: {} }),
    );
  };
  const subidas = (): string[] =>
    llamadas.filter((l) => l.cmd === 'aws').map((l) => String(l.args[3]));

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'finn-respaldo-'));
    lineas = [];
    llamadas = [];
    pedidos = [];
    fallaEn = null;
    filas = { version: ['170006'] };
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('respaldo: claves en UTC, con la mensual solo el día 1 (ADR-22)', () => {
    expect(claves(new Date('2026-11-02T07:30:00Z'))).toEqual(['diarios/2026-11-02']);
    expect(claves(new Date('2026-12-01T07:30:00Z'))).toEqual([
      'diarios/2026-12-01',
      'mensuales/2026-12',
    ]);
  });

  it('respaldo: la región sale del endpoint de B2; uno inválido falla sin tocar el volcado ni subir (CH-68)', async () => {
    expect(regionDe('https://s3.eu-central-003.backblazeb2.com')).toBe('eu-central-003');
    for (const malo of ['http://s3.us-west-004.backblazeb2.com', 'https://otro.example.com'])
      expect(() => regionDe(malo)).toThrow();
    conVolcado();
    const env = { ...entorno(), B2_ENDPOINT: 'https://otro.example.com' };
    expect(await ejecutar('subir', env, deps())).toBe(1);
    expect(llamadas).toEqual([]);
    expect(existsSync(join(dir, 'respaldo', 'finn.dump'))).toBe(true);
  });

  it('respaldo: version falla si pg_dump no es de la versión mayor del servidor (04 §16.2)', async () => {
    expect(await ejecutar('version', entorno(), deps())).toBe(0);
    filas['version'] = ['160009'];
    expect(await ejecutar('version', entorno(), deps())).toBe(1);
    expect(lineas.join('\n')).toContain('servidor 16, pg_dump 17');
  });

  it('respaldo: volcar corre respaldar.mjs con la URL de finn_respaldo', async () => {
    expect(await ejecutar('volcar', entorno(), deps())).toBe(0);
    expect(llamadas[0]?.args[0]).toMatch(/respaldar\.mjs$/);
    expect(llamadas[0]?.args[1]).toBe(ENV.RESPALDO_DB_URL);
    expect(llamadas[0]?.args[2]).toBe(join(dir, 'respaldo', 'finn.dump'));
  });

  it('respaldo: subir cifra volcado y manifiesto, borra lo que está en claro y sube a diarios/; el día 1 también a mensuales/', async () => {
    conVolcado();
    expect(await ejecutar('subir', entorno(), deps('2026-12-01T07:30:00Z'))).toBe(0);
    expect(llamadas.filter((l) => l.cmd === 'age').map((l) => l.args.slice(0, 2))).toEqual([
      ['-r', 'age1publica'],
      ['-r', 'age1publica'],
    ]);
    expect(existsSync(join(dir, 'respaldo', 'finn.dump'))).toBe(false);
    expect(existsSync(join(dir, 'respaldo', 'finn.dump.manifiesto.json'))).toBe(false);
    expect(subidas()).toEqual([
      's3://cubeta-de-prueba/diarios/2026-12-01.dump.age',
      's3://cubeta-de-prueba/diarios/2026-12-01.manifiesto.json.age',
      's3://cubeta-de-prueba/mensuales/2026-12.dump.age',
      's3://cubeta-de-prueba/mensuales/2026-12.manifiesto.json.age',
    ]);
    for (const l of llamadas.filter((x) => x.cmd === 'aws')) {
      expect(String(l.args[2])).toMatch(/\.age$/);
      expect(l.args).toContain('https://s3.us-west-004.backblazeb2.com');
      expect(l.entorno).toMatchObject({
        AWS_ACCESS_KEY_ID: 'llave-de-prueba',
        AWS_SECRET_ACCESS_KEY: SECRETO,
        AWS_DEFAULT_REGION: 'us-west-004',
      });
    }
  });

  it('respaldo: registrar manda { objeto, revision, bytes } del objeto subido, con el secreto en Bearer (OPT-09)', async () => {
    conVolcado();
    await ejecutar('subir', entorno(), deps());
    expect(await ejecutar('registrar', entorno(), deps())).toBe(0);
    expect(pedidos).toEqual([
      {
        url: 'https://finn.invalid/api/respaldo/respaldo',
        autorizacion: `Bearer ${SECRETO}`,
        cuerpo: { objeto: 'diarios/2026-11-02.dump.age', revision: '41', bytes: 7 },
      },
    ]);
  });

  it('respaldo: control: si una subida falla, subir falla y registrar no llama a OPT-09 (04 §16.3 paso 6)', async () => {
    conVolcado();
    fallaEn = 'finn.manifiesto.json.age';
    expect(await ejecutar('subir', entorno(), deps())).toBe(1);
    expect(await ejecutar('registrar', entorno(), deps())).toBe(1);
    expect(pedidos).toEqual([]);
    expect(lineas.join('\n')).not.toContain(SECRETO);
  });

  it('respaldo: una respuesta que no es 2xx de OPT-09 hace fallar el paso', async () => {
    conVolcado();
    await ejecutar('subir', entorno(), deps());
    expect(await ejecutar('registrar', entorno(), deps(undefined, 503))).toBe(1);
  });

  it('respaldo: controles en cero no avisan; con filas registran la deriva con el control y el número, sin contenido, y fallan', async () => {
    expect(await ejecutar('controles', entorno(), deps())).toBe(0);
    expect(pedidos).toEqual([]);
    filas['c5'] = ['R15|finn.ahora secreta', 'R3|otra'];
    filas['c6'] = ['- trigger'];
    expect(await ejecutar('controles', entorno(), deps())).toBe(1);
    expect(pedidos.map((p) => [p.url, p.cuerpo])).toEqual([
      ['https://finn.invalid/api/respaldo/deriva', { control: 'C5', filas: 2 }],
      ['https://finn.invalid/api/respaldo/deriva', { control: 'C6', filas: 1 }],
    ]);
    expect(lineas.join('\n')).toContain('C5 y R15: 2 filas; C6: 1 filas');
    expect(lineas.join('\n')).not.toContain('secreta');
  });

  it('respaldo: sin un secreto, o con un subcomando desconocido, falla nombrando solo lo que falta', async () => {
    const sinCubeta = entorno();
    delete sinCubeta['B2_BUCKET'];
    expect(await ejecutar('subir', sinCubeta, deps())).toBe(1);
    expect(lineas.join('\n')).toContain('faltan B2_BUCKET');
    expect(await ejecutar('otro', entorno(), deps())).toBe(1);
    expect(llamadas).toEqual([]);
  });
});
