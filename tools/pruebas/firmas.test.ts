// PRU-SEG-OPER-001 (07 §22.2, §29.1, M17): `tools/pruebas/firmas.sh` en un repositorio temporal con dos claves (la del
// usuario y la de un agente), con los 5 casos de V7-12 y los 4 de V7-17.
// Las claves se generan en la prueba con node:crypto y se escriben en el formato de OpenSSH: la prueba no corre
// `ssh-keygen` para crearlas (está negado a los agentes). Firmar y verificar sí pasa por `ssh-keygen -Y`, que es lo que
// usa Git con `gpg.format=ssh` y `gpg.ssh.program=ssh-keygen`: es el mecanismo que se prueba.
import { execFileSync, spawnSync } from 'node:child_process';
import { generateKeyPairSync, randomBytes } from 'node:crypto';
import {
  appendFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const SCRIPT = fileURLToPath(new URL('./firmas.sh', import.meta.url));
const ID = 'PRU-SEG-OPER-001 [M17]';
const RES = 'pruebas/manuales/resultados.md';
const FIRM = 'pruebas/firmantes-permitidos';
const ENCABEZADO =
  '| Manual | Fecha | Dispositivo | Resultado | Quién | Versión | Nota |\n|---|---|---|---|---|---|---|\n';
const fila = (man: string, res: string): string =>
  `| ${man} | 2027-03-02 | Android 15 | ${res} | Andrés | a1b2c3d | |\n`;

// ---------------------------------------------------------------- claves ed25519 en formato OpenSSH, sin ssh-keygen
const cadena = (b: Buffer): Buffer => {
  const l = Buffer.alloc(4);
  l.writeUInt32BE(b.length);
  return Buffer.concat([l, b]);
};
function clave(comentario: string): { privada: string; publica: string } {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  const pub = Buffer.from(publicKey.export({ format: 'jwk' }).x ?? '', 'base64url');
  const semilla = Buffer.from(privateKey.export({ format: 'jwk' }).d ?? '', 'base64url');
  const tipo = Buffer.from('ssh-ed25519');
  const blob = Buffer.concat([cadena(tipo), cadena(pub)]);
  const control = randomBytes(4);
  const partes = [control, control, cadena(tipo), cadena(pub)];
  partes.push(cadena(Buffer.concat([semilla, pub])), cadena(Buffer.from(comentario)));
  let priv = Buffer.concat(partes);
  for (let p = 1; priv.length % 8; p++) priv = Buffer.concat([priv, Buffer.from([p])]);
  const nada = cadena(Buffer.from('none'));
  const cuerpo = Buffer.concat([
    Buffer.from('openssh-key-v1\0'),
    nada,
    nada,
    cadena(Buffer.alloc(0)),
    Buffer.from([0, 0, 0, 1]),
    cadena(blob),
    cadena(priv),
  ]);
  const b64 = cuerpo.toString('base64').replace(/.{70}/g, '$&\n');
  return {
    privada: `-----BEGIN OPENSSH PRIVATE KEY-----\n${b64}\n-----END OPENSSH PRIVATE KEY-----\n`,
    publica: `ssh-ed25519 ${blob.toString('base64')} ${comentario}`,
  };
}

// ---------------------------------------------------------------- repositorio temporal
let dir = '';
const llave: Record<'usuario' | 'agente', string> = { usuario: '', agente: '' };
const firmante: Record<'usuario' | 'agente', string> = { usuario: '', agente: '' };
let n = 0;
// Git aislado de la configuración del usuario y con fechas fijas (07 §7.1)
const entorno = (): NodeJS.ProcessEnv => ({
  ...process.env,
  GIT_CONFIG_GLOBAL: join(dir, 'gitconfig'),
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_AUTHOR_DATE: '2027-03-02T10:00:00Z',
  GIT_COMMITTER_DATE: '2027-03-02T10:00:00Z',
});

function repo(): { git: (...a: string[]) => string; ruta: (f: string) => string } {
  const r = join(dir, `repo${++n}`);
  mkdirSync(join(r, 'pruebas', 'manuales'), { recursive: true });
  const git = (...a: string[]): string =>
    execFileSync('git', a, { cwd: r, encoding: 'utf8', env: entorno() });
  git('init', '-q', '-b', 'main');
  git('config', 'user.email', 'andres@example.com');
  git('config', 'user.name', 'Andrés');
  git('config', 'gpg.format', 'ssh');
  git('config', 'gpg.ssh.program', 'ssh-keygen');
  git('config', 'commit.gpgsign', 'false');
  return { git, ruta: (f) => join(r, f) };
}
type Repo = ReturnType<typeof repo>;
/** Agrega todo y confirma: con la clave de `quien`, o sin firma. */
function confirmar(x: Repo, mensaje: string, quien?: 'usuario' | 'agente'): void {
  x.git('add', '-A');
  if (quien) x.git('-c', `user.signingkey=${llave[quien]}`, 'commit', '-q', '-S', '-m', mensaje);
  else x.git('commit', '-q', '--no-gpg-sign', '-m', mensaje);
}
function firmas(x: Repo, base: string): { codigo: number | null; salida: string } {
  const r = spawnSync('bash', [SCRIPT, base], {
    cwd: x.ruta('.'),
    encoding: 'utf8',
    env: entorno(),
  });
  return { codigo: r.status, salida: `${r.stdout}${r.stderr}` };
}
/** Estado de partida: firmantes con la clave del usuario y un resultado, los dos firmados por el usuario. */
function partida(filas = fila('PRU-MAN-BAND-001', 'pasa')): Repo {
  const x = repo();
  writeFileSync(x.ruta(FIRM), `${firmante.usuario}\n`);
  confirmar(x, 'firmantes', 'usuario');
  writeFileSync(x.ruta(RES), ENCABEZADO + filas);
  confirmar(x, 'resultado firmado por el usuario', 'usuario');
  return x;
}

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'finn-firmas-'));
  writeFileSync(join(dir, 'gitconfig'), '');
  for (const quien of ['usuario', 'agente'] as const) {
    const k = clave(`finn-${quien}`);
    llave[quien] = join(dir, quien);
    writeFileSync(llave[quien], k.privada, { mode: 0o600 });
    firmante[quien] = `${quien}@example.com ${k.publica}`;
  }
});
afterAll(() => {
  if (dir) rmSync(dir, { recursive: true, force: true });
});

describe(
  'PRU-SEG-OPER-001 firmas de resultados.md y firmantes-permitidos (M17)',
  { timeout: 60_000 },
  () => {
    // ------------------------------------------------------------ V7-12: firmantes leídos de la base
    it(`${ID} V7-12 caso 1: un commit firmado por la clave del usuario pasa`, () => {
      const r = firmas(partida(), 'HEAD');
      expect(r.salida).toContain('PASA');
      expect(r.codigo).toBe(0);
    });

    it(`${ID} V7-12 caso 2: un commit firmado con otra clave falla`, () => {
      const x = partida();
      appendFileSync(x.ruta(RES), fila('PRU-MAN-ACCESO-001', 'pasa'));
      confirmar(x, 'resultado firmado con otra clave', 'agente');
      const r = firmas(x, 'HEAD~1');
      expect(r.salida).toMatch(/FALLA .*resultado firmado con otra clave/);
      expect(r.codigo).toBe(1);
    });

    it(`${ID} V7-12 caso 3: un commit sin firma falla`, () => {
      const x = partida();
      appendFileSync(x.ruta(RES), fila('PRU-MAN-ACCESO-001', 'pasa'));
      confirmar(x, 'resultado sin firma');
      const r = firmas(x, 'HEAD~1');
      expect(r.salida).toMatch(/FALLA .*resultado sin firma/);
      expect(r.codigo).toBe(1);
    });

    /** El PR agrega la clave del agente a los firmantes y firma con ella. */
    function prConSuClave(): Repo {
      const x = partida();
      appendFileSync(x.ruta(FIRM), `${firmante.agente}\n`);
      appendFileSync(x.ruta(RES), fila('PRU-MAN-ACCESO-001', 'pasa'));
      confirmar(x, 'el PR agrega su clave y firma con ella', 'agente');
      return x;
    }

    it(`${ID} V7-12 caso 4: un PR que agrega su clave a los firmantes y firma con ella falla`, () => {
      const x = prConSuClave();
      // Con los firmantes de la base (HEAD~1), el commit del PR no tiene una firma permitida
      const r = firmas(x, 'HEAD~1');
      expect(r.salida).toMatch(/FALLA .*el PR agrega su clave/);
      expect(r.codigo).toBe(1);
    });

    it(`${ID} V7-12 control: con los firmantes del propio PR, su firma sería válida`, () => {
      const x = prConSuClave();
      // Por eso firmas.sh los lee de la base. (firmas.sh HEAD también falla, pero por la regla de una sola clave de V7-17.)
      const propio = spawnSync(
        'git',
        [
          '-c',
          `gpg.ssh.allowedSignersFile=${x.ruta(FIRM)}`,
          '-c',
          'gpg.ssh.program=ssh-keygen',
          'verify-commit',
          'HEAD',
        ],
        { cwd: x.ruta('.'), encoding: 'utf8', env: entorno() },
      );
      expect(propio.status).toBe(0);
      expect(propio.stderr).toContain('Good "git" signature');
    });

    it(`${ID} la base sin firmantes-permitidos no se puede verificar (TU-05 pendiente)`, () => {
      const x = repo();
      writeFileSync(x.ruta(RES), ENCABEZADO + fila('PRU-MAN-BAND-001', 'pasa'));
      confirmar(x, 'resultado sin firmantes', 'usuario');
      const r = firmas(x, 'HEAD');
      expect(r.salida).toContain('no tiene pruebas/firmantes-permitidos');
      expect(r.codigo).toBe(2);
    });

    // ------------------------------------------------------------ V7-17: por fila (blame) y por commit, con una sola clave
    const dos = fila('PRU-MAN-BAND-001', 'pasa') + fila('PRU-MAN-ACCESO-001', 'falla');

    it(`${ID} V7-17 caso A: todo firmado por el usuario pasa`, () => {
      const r = firmas(partida(dos), 'HEAD');
      expect(r.salida).toMatch(/ok {4}filas de pruebas\/manuales\/resultados\.md/);
      expect(r.codigo).toBe(0);
    });

    it(`${ID} V7-17 caso B: una fila cambiada de "falla" a "pasa" sin firma falla (blame y commits)`, () => {
      const x = partida(dos);
      writeFileSync(
        x.ruta(RES),
        readFileSync(x.ruta(RES), 'utf8').replace('| falla |', '| pasa |'),
      );
      confirmar(x, 'un agente cambia falla por pasa');
      const r = firmas(x, 'HEAD~1');
      expect(r.salida).toMatch(/FALLA filas de .*un agente cambia falla por pasa/);
      expect(r.salida).toMatch(/FALLA commit .*un agente cambia falla por pasa/);
      expect(r.codigo).toBe(1);
    });

    it(`${ID} V7-17 caso C: una fila borrada sin firma falla (blame no la ve; el control de commits sí)`, () => {
      const x = partida(dos);
      const sin = readFileSync(x.ruta(RES), 'utf8')
        .split('\n')
        .filter((l) => !l.includes('ACCESO'))
        .join('\n');
      writeFileSync(x.ruta(RES), sin);
      confirmar(x, 'un agente borra la falla');
      const r = firmas(x, 'HEAD~1');
      expect(r.salida).not.toMatch(/FALLA filas/);
      expect(r.salida).toMatch(/FALLA commit .*un agente borra la falla/);
      expect(r.codigo).toBe(1);
    });

    it(`${ID} V7-17 caso D: dos claves en firmantes-permitidos falla`, () => {
      const x = partida(dos);
      appendFileSync(x.ruta(FIRM), `${firmante.agente}\n`);
      confirmar(x, 'dos claves en firmantes', 'usuario');
      const r = firmas(x, 'HEAD');
      expect(r.salida).toContain('tiene 2 claves; debe tener exactamente 1');
      expect(r.codigo).toBe(1);
    });

    // ------------------------------------------------------------ plan/tu.md, protegido igual que resultados.md (DT-04)
    it(`${ID} plan/tu.md: un commit sin firma que lo toca falla`, () => {
      const x = partida();
      mkdirSync(x.ruta('plan'), { recursive: true });
      writeFileSync(
        x.ruta('plan/tu.md'),
        '# Estado de las TU\n\n| TU | Estado |\n|---|---|\n| TU-05 | hecha |\n',
      );
      confirmar(x, 'un agente marca una TU');
      const r = firmas(x, 'HEAD~1');
      expect(r.salida).toMatch(/FALLA filas de plan\/tu\.md/);
      expect(r.salida).toMatch(/FALLA commit .*un agente marca una TU/);
      expect(r.codigo).toBe(1);
    });

    it(`${ID} una fila sin confirmar en resultados.md falla`, () => {
      const x = partida();
      appendFileSync(x.ruta(RES), fila('PRU-MAN-ACCESO-001', 'pasa'));
      const r = firmas(x, 'HEAD');
      expect(r.salida).toContain('tiene filas sin confirmar');
      expect(r.codigo).toBe(1);
    });
  },
);
