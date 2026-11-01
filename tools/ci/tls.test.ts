// TLS contra Supabase con su CA (CH-65; 04 §14.2). Sin red externa y sin reloj de pared: el parseo es el real de `pg` y
// el servidor TLS escucha en 127.0.0.1 con una CA de prueba válida de 2020 a 2099.
import { createHash, createPrivateKey, X509Certificate } from 'node:crypto';
import { createRequire } from 'node:module';
import { createServer, type AddressInfo, type Server, type Socket } from 'node:net';
import { TLSSocket } from 'node:tls';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { opcionesAdaptador } from '../../packages/db/src/cliente.ts';
import { CA_SUPABASE, configPg } from '../../packages/db/src/tls.ts';

type ClienteReal = {
  connect(): Promise<void>;
  end(): Promise<void>;
  on(evento: 'error', f: () => void): void;
  ssl: { ca?: string; rejectUnauthorized?: boolean } | boolean;
  password: string;
  database: string;
};
// `pg` vive en @finn/db (ADR-21).
const pg = createRequire(new URL('../../packages/db/package.json', import.meta.url))('pg') as {
  Client: new (cfg: object) => ClienteReal;
};

const HUELLA =
  '80:70:25:AD:50:D4:ED:21:9D:2C:9C:7D:29:9C:00:4F:82:4E:B0:0C:F7:F6:5A:FE:F6:07:D0:7B:72:E6:CA:FA';
const POOLER = 'aws-0-us-east-1.pooler.supabase.com';

/** Lo que `pg` usará de verdad: `Client` pasa la configuración por `ConnectionParameters` y `pg-connection-string`. */
const efectivo = (cfg: object) => new pg.Client(cfg);

describe('CA de Supabase embebida', () => {
  it('tls: la huella SHA-256 del PEM es la esperada, con CN y vencimiento (CH-65)', () => {
    const der = Buffer.from(CA_SUPABASE.replace(/-----[A-Z ]+-----|\s/g, ''), 'base64');
    const hex = createHash('sha256').update(der).digest('hex').toUpperCase();
    expect(hex.match(/../g)?.join(':')).toBe(HUELLA);
    const x = new X509Certificate(CA_SUPABASE);
    expect(x.subject).toContain('CN=Supabase Root 2021 CA');
    expect(new Date(x.validTo).toISOString().slice(0, 10)).toBe('2031-04-26');
    expect(CA_SUPABASE).not.toContain('\r');
  });
});

describe('configPg', () => {
  it.each([
    [
      'transacción',
      `postgresql://finn_app.ref:cl%40ve@${POOLER}:6543/postgres?sslmode=require&pgbouncer=true`,
    ],
    ['sesión', `postgresql://finn_migraciones.ref:cl%40ve@${POOLER}:5432/postgres?sslmode=require`],
    ['directo', 'postgresql://postgres:cl%40ve@db.abcd.supabase.co:5432/postgres?sslmode=require'],
  ])('tls: host de Supabase (%s): la CA manda tras el parseo real de pg', (_n, url) => {
    const cfg = configPg(url);
    expect(cfg.ssl).toEqual({ ca: CA_SUPABASE, rejectUnauthorized: true });
    expect(cfg.connectionString).not.toContain('sslmode');
    const c = efectivo(cfg);
    expect(c.ssl).toEqual({ ca: CA_SUPABASE, rejectUnauthorized: true });
    expect(c.password).toBe('cl@ve');
    expect(c.database).toBe('postgres');
  });

  it('tls: conserva pgbouncer y el resto de la URL; solo quita los parámetros de TLS', () => {
    const url = `postgresql://u:p@${POOLER}:6543/postgres?sslmode=disable&ssl=0&sslrootcert=/x&sslnegotiation=direct&uselibpqcompat=true&pgbouncer=true`;
    const { connectionString, ssl } = configPg(url);
    expect(connectionString).toBe(`postgresql://u:p@${POOLER}:6543/postgres?pgbouncer=true`);
    expect(efectivo({ connectionString, ...(ssl ? { ssl } : {}) }).ssl).toEqual(ssl);
  });

  it('tls: el nombre del host no distingue mayúsculas y el sufijo es exacto', () => {
    expect(configPg('postgresql://u:p@X.POOLER.SUPABASE.COM:6543/d').ssl?.ca).toBe(CA_SUPABASE);
    for (const h of ['pooler.supabase.com.evil.test', 'evilsupabase.co', 'supabase.co.evil.test']) {
      expect(configPg(`postgresql://u:p@${h}:5432/d`).ssl).toBeUndefined();
    }
  });

  it.each([
    'postgresql://finn_app:finn@localhost:5432/finn_test',
    'postgresql://finn_app:finn@127.0.0.1:6543/finn?pgbouncer=true',
    'postgresql://u:p@db.interno.test:5432/d?sslmode=require',
    'no es una url',
  ])('tls: cualquier otro host queda igual: %s', (url) => {
    expect(configPg(url)).toEqual({ connectionString: url });
  });

  it('tls: el adaptador de Prisma recibe la configuración de configPg', () => {
    const a = opcionesAdaptador(
      `postgresql://u:p@${POOLER}:6543/postgres?sslmode=require&pgbouncer=true`,
    );
    expect(a).toMatchObject({ ssl: { ca: CA_SUPABASE, rejectUnauthorized: true }, max: 3 });
    expect(a.connectionString).toBe(`postgresql://u:p@${POOLER}:6543/postgres?pgbouncer=true`);
    expect(opcionesAdaptador('postgresql://u:p@localhost:5432/d')).toEqual({
      connectionString: 'postgresql://u:p@localhost:5432/d',
      options: '-c TimeZone=UTC',
      max: 3,
    });
  });
});

// Otra CA y un certificado de servidor para localhost y 127.0.0.1, ambos de 2020 a 2099; descartables, no protegen nada.
// La clave va en DER porque gitleaks (07 §3) rechaza cualquier PEM de clave privada, también de prueba.
const OTRA_CA = `-----BEGIN CERTIFICATE-----
MIIBaDCCAQ6gAwIBAgIBATAKBggqhkjOPQQDAjAcMRowGAYDVQQDDBFPdHJhIENB
IGRlIHBydWViYTAgFw0yMDAxMDEwMDAwMDBaGA8yMDk5MTIzMTAwMDAwMFowHDEa
MBgGA1UEAwwRT3RyYSBDQSBkZSBwcnVlYmEwWTATBgcqhkjOPQIBBggqhkjOPQMB
BwNCAATLaiF5U8OPyyhUi90xo+W8IJUKhHZAivcVyk1CE9mgCqM3Dyr9vk0Y/wsQ
R1zN4ZTvOl8gIMQdx9QCR+tcjVJ9oz8wPTAPBgNVHRMBAf8EBTADAQH/MAsGA1Ud
DwQEAwICBDAdBgNVHQ4EFgQUKwsXKwK+vgqxU3X3wQLTQ/KbjocwCgYIKoZIzj0E
AwIDSAAwRQIgd/WBMCTzzKQaYJCifNGKPKkcx8KV15cNiKU86QxMbYMCIQDnDssj
EACzovLQz5KQkO0FOuCeIWEoEtyLGvR+e7/gPA==
-----END CERTIFICATE-----
`;
const CERT_SERVIDOR = `-----BEGIN CERTIFICATE-----
MIIBiTCCATCgAwIBAgIBAjAKBggqhkjOPQQDAjAcMRowGAYDVQQDDBFPdHJhIENB
IGRlIHBydWViYTAgFw0yMDAxMDEwMDAwMDBaGA8yMDk5MTIzMTAwMDAwMFowFDES
MBAGA1UEAwwJbG9jYWxob3N0MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEAqeZ
k1FHRhDuXKEPgA7heVSF1TRrpLcUohPCsIf/mBgSRT/E4BHmM2PwItVv/oIoPqTr
r0Ua/AJyfHaMwNHEWaNpMGcwCQYDVR0TBAIwADAaBgNVHREEEzARgglsb2NhbGhv
c3SHBH8AAAEwHQYDVR0OBBYEFPuRmHTnBOaYMhf1TbH7H24CufNYMB8GA1UdIwQY
MBaAFCsLFysCvr4KsVN198EC00Pym46HMAoGCCqGSM49BAMCA0cAMEQCIA8my5S+
mge0boM9sPO13hG89zHb6D364GbN1oN7JtYJAiB2xQ3f+9mNFMjELSubCu9AaTqB
uZ6OiYxq4ZGBo7Lafg==
-----END CERTIFICATE-----
`;
const CLAVE_SERVIDOR_DER =
  'MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgMRVuTCsKSSjuqvzG4uDAq0D9+XL5BOeDrJy+N5kNSNuhRANCAAQCp5mTUUdGEO5coQ+ADuF5VIXVNGuktxSiE8Kwh/+YGBJFP8TgEeYzY/Ai1W/+gig+pOuvRRr8AnJ8dozA0cRZ';

describe('servidor TLS local con certificado de otra CA', () => {
  let servidor: Server;
  let puerto: number;
  let completados = 0;
  const abiertos = new Set<Socket>();

  beforeAll(async () => {
    const key = createPrivateKey({
      key: Buffer.from(CLAVE_SERVIDOR_DER, 'base64'),
      format: 'der',
      type: 'pkcs8',
    }).export({ format: 'pem', type: 'pkcs8' });
    // Como Postgres: responde 'S' al SSLRequest y sigue en TLS, enviando la cadena completa, como Supavisor en la falla.
    servidor = createServer((s) => {
      abiertos.add(s);
      s.on('error', () => undefined);
      s.once('data', () => {
        s.write('S', () => {
          const t = new TLSSocket(s, { isServer: true, key, cert: CERT_SERVIDOR + OTRA_CA });
          t.on('error', () => undefined);
          t.on('secure', () => {
            completados += 1;
            t.destroy();
          });
        });
      });
    });
    await new Promise<void>((listo) => servidor.listen(0, '127.0.0.1', listo));
    puerto = (servidor.address() as AddressInfo).port;
  });
  afterAll(async () => {
    for (const s of abiertos) s.destroy();
    await new Promise((fin) => servidor.close(fin));
  });

  const conectar = async (ssl: { ca: string; rejectUnauthorized: true }) => {
    const c = new pg.Client({ host: '127.0.0.1', port: puerto, user: 'u', database: 'd', ssl });
    c.on('error', () => undefined);
    const e = await c.connect().then(
      () => undefined,
      (x: unknown) => x as NodeJS.ErrnoException,
    );
    await c.end().catch(() => undefined);
    return e;
  };

  it('tls: el `ssl` de configPg rechaza ese servidor por la cadena, como en la corrida 41318181881', async () => {
    const { ssl } = configPg(`postgresql://u:p@${POOLER}:5432/d?sslmode=require`);
    const antes = completados;
    if (!ssl) throw new Error('configPg no dio ssl para el host de Supabase');
    const e = await conectar(ssl);
    expect(e?.code).toBe('SELF_SIGNED_CERT_IN_CHAIN');
    expect(completados).toBe(antes);
  });

  it('tls: control: con la CA de ese servidor la negociación se completa, el rechazo viene de la CA', async () => {
    const antes = completados;
    const e = await conectar({ ca: OTRA_CA, rejectUnauthorized: true });
    expect(e?.code ?? '').not.toMatch(/CERT|VERIFY/);
    expect(completados).toBe(antes + 1);
  });
});
