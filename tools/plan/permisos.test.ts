// PRU-SEG-OPER-101 (TA-002, DT-13): los permisos de Claude Code siguen siendo la segunda barrera de 08 §4.1.
// Corre con el ejecutor de pruebas de Node: node --test tools/plan/permisos.test.ts
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const RAIZ = fileURLToPath(new URL('../..', import.meta.url));

// Las reglas `deny` de 08 §4.1, en su orden. Cambiar esta lista es una tarea de revisión obligatoria.
export const DENY_ESPERADAS = [
  'Bash(vercel *)',
  'Bash(npx vercel *)',
  'Bash(pnpm dlx vercel *)',
  'Bash(pnpm exec vercel *)',
  'PowerShell(vercel *)',
  'PowerShell(npx vercel *)',
  'PowerShell(pnpm dlx vercel *)',
  'Bash(gh secret *)',
  'Bash(gh variable *)',
  'Bash(gh pr merge *)',
  'Bash(gh auth *)',
  'Bash(gh api *secrets*)',
  'Bash(gh api *variables*)',
  'PowerShell(gh secret *)',
  'PowerShell(gh variable *)',
  'PowerShell(gh pr merge *)',
  'PowerShell(gh auth *)',
  'Bash(git push * main)',
  'Bash(git push * HEAD:main)',
  'Bash(git push --force *)',
  'Bash(git push -f *)',
  'Bash(git push --force-with-lease *)',
  'Bash(git credential *)',
  'Bash(git config --global *)',
  'Bash(git config --system *)',
  'Bash(ssh-add *)',
  'Bash(ssh-keygen *)',
  'Bash(prisma migrate deploy *)',
  'Bash(pnpm prisma migrate deploy *)',
  'Bash(npx prisma migrate deploy *)',
  'Bash(supabase link *)',
  'Bash(supabase db push *)',
  'Bash(pnpm dlx supabase link *)',
  'Bash(pnpm dlx supabase db push *)',
  'Edit(pruebas/manuales/resultados.md)',
  'Edit(pruebas/firmantes-permitidos)',
  'Edit(plan/tu.md)',
  'Edit(.claude/settings.json)',
  'Edit(.claude/settings.local.json)',
  'Edit(.claude/agents/**)',
  'Edit(.claude/hooks/**)',
  'Read(.claude/settings.local.json)',
  'Read(//c/finn/_privado/**)',
  'Edit(//c/finn/_privado/**)',
  'Edit(//c/finn/_entrada/**)',
  'Edit(//c/finn/_aprobaciones/**)',
  'Bash(*_aprobaciones*)',
  'PowerShell(*_aprobaciones*)',
  'Read(~/.ssh/**)',
  'Edit(~/.ssh/**)',
  'Read(//c/Users/*/AppData/Roaming/GitHub CLI/**)',
  'Read(//c/Users/*/AppData/Roaming/com.vercel.cli/**)',
];

// Tokens de GitHub (clásico y de grano fino) y tokens de Vercel escritos como valor literal.
const PATRONES_TOKEN: [string, RegExp][] = [
  ['GitHub ghp_', /\bghp_[A-Za-z0-9]{30,}/],
  ['GitHub github_pat_', /\bgithub_pat_[A-Za-z0-9_]{30,}/],
  ['Vercel VERCEL_TOKEN', /VERCEL_TOKEN\s*[=:]\s*["']?[A-Za-z0-9]{20,}/],
  ['Vercel --token', /--token[ =]["']?[A-Za-z0-9]{20,}/],
];

type Entrada = {
  settings: { permissions?: Record<string, unknown> };
  gitignore: string;
  indice: string[];
  contenido: (ruta: string) => string;
};

// "Herramienta(patrón)" → [herramienta, patrón]
function partes(regla: string): [string, string] {
  const m = /^(\w+)\((.*)\)$/.exec(regla);
  return m ? [m[1] as string, m[2] as string] : [regla, ''];
}

function cubre(deny: string, allow: string): boolean {
  if (deny === allow) return true;
  const [hd, pd] = partes(deny);
  const [ha, pa] = partes(allow);
  if (hd !== ha) return false;
  if (pd === '') return true; // "Bash" sin patrón niega toda la herramienta
  const re = new RegExp(
    '^' +
      pd
        .split('*')
        .map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
        .join('.*') +
      '$',
  );
  return re.test(pa);
}

export function comprobarPermisos(e: Entrada): string[] {
  const errores: string[] = [];
  const p = e.settings.permissions ?? {};
  const deny = Array.isArray(p['deny']) ? (p['deny'] as string[]) : [];
  const allow = Array.isArray(p['allow']) ? (p['allow'] as string[]) : [];
  for (const r of DENY_ESPERADAS) if (!deny.includes(r)) errores.push(`falta la regla deny ${r}`);
  for (const a of allow)
    for (const d of deny) if (cubre(d, a)) errores.push(`allow ${a} coincide con deny ${d}`);
  if (p['defaultMode'] === 'bypassPermissions')
    errores.push('permissions.defaultMode es bypassPermissions');
  if (p['disableBypassPermissionsMode'] !== 'disable')
    errores.push('disableBypassPermissionsMode no es "disable"');
  const ignorados = e.gitignore.split(/\r?\n/).map((l) => l.trim());
  if (!ignorados.includes('.claude/settings.local.json'))
    errores.push('.claude/settings.local.json no está en .gitignore');
  if (e.indice.includes('.claude/settings.local.json'))
    errores.push('.claude/settings.local.json está en el índice de git');
  for (const ruta of e.indice) {
    let texto: string;
    try {
      texto = e.contenido(ruta);
    } catch {
      continue;
    } // borrado en el árbol de trabajo
    for (const [nombre, re] of PATRONES_TOKEN)
      if (re.test(texto)) errores.push(`${ruta}: patrón de token ${nombre}`);
  }
  return errores;
}

function entradaReal(): Entrada {
  const git = (...a: string[]): string => execFileSync('git', a, { cwd: RAIZ, encoding: 'utf8' });
  return {
    settings: JSON.parse(readFileSync(join(RAIZ, '.claude/settings.json'), 'utf8')),
    gitignore: readFileSync(join(RAIZ, '.gitignore'), 'utf8'),
    // Lo versionado más lo nuevo que no está ignorado: así un token no llega ni al primer commit.
    indice: git('ls-files', '-z', '--cached', '--others', '--exclude-standard')
      .split('\0')
      .filter(Boolean),
    contenido: (ruta) => readFileSync(join(RAIZ, ruta), 'latin1'),
  };
}

describe('PRU-SEG-OPER', () => {
  it('PRU-SEG-OPER-101 [DT-13].claude/settings.json conserva las reglas de 08 §4.1 y no hay tokens versionados', () => {
    const real = entradaReal();
    assert.deepEqual(comprobarPermisos(real), []);
    assert.equal(
      execFileSync('git', ['ls-files', '.claude/settings.local.json'], {
        cwd: RAIZ,
        encoding: 'utf8',
      }),
      '',
    );

    // Control: cada mutación de una copia la hace fallar.
    const copia = (
      cambio: (s: { permissions: Record<string, unknown> }) => void,
      otra: Partial<Entrada> = {},
    ): string[] => {
      const s = structuredClone(real.settings) as { permissions: Record<string, unknown> };
      cambio(s);
      return comprobarPermisos({ ...real, indice: [], ...otra, settings: s });
    };
    const sinVercel = copia((s) => {
      s.permissions['deny'] = (s.permissions['deny'] as string[]).filter(
        (r) => r !== 'Bash(vercel *)',
      );
    });
    assert.deepEqual(sinVercel, ['falta la regla deny Bash(vercel *)']);
    assert.ok(
      copia((s) => {
        s.permissions['allow'] = ['Bash(vercel whoami)'];
      }).some((x) => x.includes('coincide con deny Bash(vercel *)')),
    );
    assert.ok(
      copia((s) => {
        s.permissions['defaultMode'] = 'bypassPermissions';
      }).includes('permissions.defaultMode es bypassPermissions'),
    );
    assert.ok(
      copia((s) => {
        delete s.permissions['disableBypassPermissionsMode'];
      }).includes('disableBypassPermissionsMode no es "disable"'),
    );
    assert.ok(
      copia(() => {}, { gitignore: 'node_modules/\n' }).includes(
        '.claude/settings.local.json no está en .gitignore',
      ),
    );
    assert.ok(
      copia(() => {}, { indice: ['.claude/settings.local.json'], contenido: () => '' }).includes(
        '.claude/settings.local.json está en el índice de git',
      ),
    );
    const falso = ['ghp_', 'github_pat_11', 'VERCEL_TOKEN='].map(
      (p, i) => p + 'A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8'.slice(i),
    );
    for (const t of falso) {
      const r = copia(() => {}, { indice: ['x.env.example'], contenido: () => `clave: ${t}\n` });
      assert.equal(r.length, 1, `no detecta ${t.slice(0, 12)}…`);
    }
  });
});
