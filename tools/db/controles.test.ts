// Controles C1 (lint de migraciones) y C2 (inmutabilidad) de 03 §11.6: cada uno pasa sobre el
// repositorio y falla con su caso. Las migraciones de control viven en tools/lint/controles/migraciones/.
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

const raiz = fileURLToPath(new URL('../..', import.meta.url));
const controles = join(raiz, 'tools', 'lint', 'controles', 'migraciones');
const verificador = join(raiz, 'tools', 'db', 'verificar-migraciones.mjs');
const inmutabilidad = join(raiz, 'tools', 'db', 'inmutabilidad.sh');

type Salida = { codigo: number | null; texto: string };

function c1(...args: string[]): Salida {
  const r = spawnSync(process.execPath, [verificador, ...args], { encoding: 'utf8' });
  return { codigo: r.status, texto: r.stdout + r.stderr };
}

describe('C1 verificar-migraciones (03 §11.6)', () => {
  it('C1 pasa sobre las migraciones del repositorio', () => {
    const r = c1(join(raiz, 'packages', 'db', 'prisma', 'migrations'));
    expect(r.texto).toContain('sin problemas');
    expect(r.codigo).toBe(0);
  });

  it('C1 pasa con migraciones válidas: _g_ con finn:contraer y _m_ con marca y bloqueo', () => {
    const r = c1(join(controles, 'validas'));
    expect(r.texto).toContain('✓ 3 migraciones revisadas');
    expect(r.codigo).toBe(0);
  });

  it('C1 rechaza una _g_ con DROP sin la marca finn:contraer', () => {
    const r = c1(join(controles, 'g-destructiva-sin-marca'));
    expect(r.codigo).toBe(1);
    expect(r.texto).toContain('20261101000000_g_quitar_nota: contiene cambios destructivos');
  });

  it('C1 rechaza una _m_ sin -- finn:manual', () => {
    const r = c1(join(controles, 'm-sin-marca'));
    expect(r.codigo).toBe(1);
    expect(r.texto).toContain('20261101000000_m_comentario: una migración manual empieza');
  });

  it('C1 rechaza una _m_ que escribe datos sin finn.tomar_bloqueo()', () => {
    const r = c1(join(controles, 'm-escribe-sin-bloqueo'));
    expect(r.codigo).toBe(1);
    expect(r.texto).toContain('20261101000000_m_rellenar_nota: escribe en tablas de hechos');
  });

  it('C1 rechaza un nombre de carpeta inválido', () => {
    const r = c1(join(controles, 'nombre-invalido'));
    expect(r.codigo).toBe(1);
    expect(r.texto).toContain('20261101_g_Tablas: nombre inválido');
  });

  it('C1 con instantánea: objeto protegido, privilegios y solo hechos [M]/[H] exigen bloqueo', () => {
    const r = c1(join(controles, 'con-catalogo', 'migrations'));
    expect(r.codigo).toBe(1);
    const errores = r.texto.split('\n').filter((l) => l.startsWith('✗'));
    expect(errores).toEqual([
      '✗ 20261101000000_g_renombrar_check: toca el objeto manual protegido «ck_cuentas_nombre»',
      '✗ 20261101000100_g_privilegios: cambia privilegios',
      '✗ 20261101000300_m_rellenar_cuentas: escribe en tablas de hechos sin finn.tomar_bloqueo()',
    ]);
  });

  it('C1 con lista de migraciones nuevas revisa solo esas', () => {
    const dir = join(controles, 'con-catalogo');
    const r = c1(
      join(dir, 'migrations'),
      join(dir, 'catalogo-esperado.txt'),
      '20261101000200_m_estado_respaldo',
    );
    expect(r.texto).toContain('✓ 1 migraciones revisadas');
    expect(r.codigo).toBe(0);
  });
});

describe('C2 inmutabilidad (03 §11.6)', () => {
  let repo = '';
  afterEach(() => {
    if (repo) rmSync(repo, { recursive: true, force: true });
    repo = '';
  });

  const git = (...args: string[]): void => {
    const r = spawnSync(
      'git',
      [
        '-c',
        'user.name=finn',
        '-c',
        'user.email=finn@example.test',
        '-c',
        'core.autocrlf=false',
      ].concat(args),
      { cwd: repo, encoding: 'utf8' },
    );
    if (r.status !== 0) throw new Error(`git ${args.join(' ')}: ${r.stderr}`);
  };
  const c2 = (): Salida => {
    const r = spawnSync('bash', [inmutabilidad], { cwd: repo, encoding: 'utf8' });
    return { codigo: r.status, texto: r.stdout + r.stderr };
  };
  const migraciones = (): string => join(repo, 'packages', 'db', 'prisma', 'migrations');
  const sql = (carpeta: string): string => join(migraciones(), carpeta, 'migration.sql');

  // Un repositorio temporal cuyo origin/main ya tiene una migración aplicada.
  function preparar(): void {
    repo = mkdtempSync(join(tmpdir(), 'finn-c2-'));
    git('init', '-q');
    mkdirSync(join(migraciones(), '20261101000000_g_tablas'), { recursive: true });
    writeFileSync(sql('20261101000000_g_tablas'), 'CREATE TABLE "finn"."notas" ("id" UUID);\n');
    git('add', '.');
    git('commit', '-q', '-m', 'base');
    git('update-ref', 'refs/remotes/origin/main', 'HEAD');
  }

  // Necesita origin/main en el clon (en CI, checkout con historia); sin él el script sale con 2.
  const hayOrigin =
    spawnSync('git', ['rev-parse', '--verify', '--quiet', 'origin/main'], { cwd: raiz }).status ===
    0;
  it.skipIf(!hayOrigin)('C2 pasa sobre el repositorio', () => {
    const r = spawnSync('bash', [inmutabilidad], { cwd: raiz, encoding: 'utf8' });
    expect(r.stdout + r.stderr).toContain('ninguna migración de main cambió');
    expect(r.status).toBe(0);
  });

  it('C2 pasa si solo se agrega una migración nueva', () => {
    preparar();
    mkdirSync(join(migraciones(), '20261102000000_m_datos'));
    writeFileSync(sql('20261102000000_m_datos'), '-- finn:manual\n');
    git('add', '.');
    git('commit', '-q', '-m', 'nueva');
    expect(c2().codigo).toBe(0);
  });

  it('C2 falla con una migración de main editada', () => {
    preparar();
    writeFileSync(sql('20261101000000_g_tablas'), 'CREATE TABLE "finn"."notas" ("id" TEXT);\n');
    const r = c2();
    expect(r.codigo).toBe(1);
    expect(r.texto).toContain(
      'M\tpackages/db/prisma/migrations/20261101000000_g_tablas/migration.sql',
    );
  });

  it('C2 falla con una migración de main renombrada', () => {
    preparar();
    renameSync(
      join(migraciones(), '20261101000000_g_tablas'),
      join(migraciones(), '20261101000000_g_notas'),
    );
    git('add', '-A');
    git('commit', '-q', '-m', 'renombrar');
    const r = c2();
    expect(r.codigo).toBe(1);
    expect(r.texto).toMatch(/^R\d*\t/m);
  });

  it('C2 falla con una migración de main borrada', () => {
    preparar();
    rmSync(join(migraciones(), '20261101000000_g_tablas'), { recursive: true });
    const r = c2();
    expect(r.codigo).toBe(1);
    expect(r.texto).toContain('D\tpackages/db/prisma/migrations/20261101000000_g_tablas');
  });
});
