// tools/plan/token.ts — `pnpm plan:token [--sin-ci]`: verificación del token de los agentes (08 TU-01) y aviso de su
// vencimiento a 14 días (TU-20). Usa el GH_TOKEN del entorno a través de `gh` y de la credencial de git del repositorio.
// Sale con 1 si una comprobación falla o no se pudo hacer. Node 24 lo ejecuta sin compilar.
import { spawnSync } from 'node:child_process';
import type { Run } from './mergear.ts';

/** Días hasta la fecha de la cabecera `github-authentication-token-expiration` (`2027-01-23 10:00:00 -0600` o `… UTC`). */
export function diasHasta(cabeceras: string, hoy: Date): number | null {
  const m =
    /^github-authentication-token-expiration:\s*(\S+) (\S+) (UTC|[+-]\d{2})(\d{2})?\s*$/im.exec(
      cabeceras,
    );
  if (!m) return null;
  const zona = m[3] === 'UTC' ? 'Z' : `${m[3]}:${m[4] ?? '00'}`;
  const vence = Date.parse(`${m[1]}T${m[2]}${zona}`);
  return Number.isNaN(vence) ? null : Math.floor((vence - hoy.getTime()) / 86_400_000);
}

export function verificarToken(
  run: Run,
  hoy: Date,
  sinCi: boolean,
): { codigo: number; salida: string[] } {
  const salida: string[] = [];
  let fallo = false;
  const marcar = (ok: boolean | null, que: string, detalle = ''): void => {
    fallo ||= ok !== true;
    salida.push(
      `${ok === null ? 'NO VERIFICADO' : ok ? 'pasa' : 'FALLA'}  ${que}${detalle ? ` — ${detalle}` : ''}`,
    );
  };
  const ultimo = (estado: string): string | undefined => {
    const r = run('gh', ['pr', 'list', '--state', estado, '--limit', '1', '--json', 'number']);
    return r.status === 0
      ? (JSON.parse(r.stdout) as { number: number }[])[0]?.number.toString()
      : undefined;
  };
  const pr = ultimo('all');
  const c = pr ? run('gh', ['pr', 'checks', pr]) : undefined;
  const responde =
    c && (c.status === 0 || /no checks reported|fail|pending/i.test(c.stdout + c.stderr));
  marcar(
    pr ? Boolean(responde) : null,
    `gh pr checks sobre el último PR (#${pr ?? '—'})`,
    c?.stderr.trim(),
  );
  const s = run('gh', ['api', 'repos/{owner}/{repo}/actions/secrets']);
  marcar(
    s.status !== 0 && /HTTP 403/.test(s.stderr),
    'los secretos de Actions responden 403',
    s.status === 0 ? 'el token LEE los secretos' : s.stderr.trim(),
  );
  const p = run('git', ['push', '--dry-run', 'origin', 'HEAD:refs/heads/prueba-token']);
  marcar(
    p.status === 0,
    'git push --dry-run a una rama de prueba',
    p.status === 0 ? '' : p.stderr.trim(),
  );
  const abierto = ultimo('open');
  if (!abierto) marcar(null, 'pr:mergear --dry-run', 'no hay un PR abierto sobre el que probarlo');
  else {
    const m = run('node', [
      'tools/plan/mergear.ts',
      abierto,
      '--dry-run',
      ...(sinCi ? ['--sin-ci'] : []),
    ]);
    const ultimas = m.stdout.trim().split('\n').slice(-3).join(' | ');
    marcar(
      m.status === 0 || m.status === 3,
      `pr:mergear #${abierto} --dry-run llega al paso de merge`,
      ultimas,
    );
  }
  const h = run('gh', ['api', '-i', 'repos/{owner}/{repo}']);
  const dias = diasHasta(h.stdout, hoy);
  if (dias === null)
    salida.push('AVISO  la respuesta no trae github-authentication-token-expiration');
  else
    salida.push(
      `${dias <= 14 ? 'AVISO  el token vence en' : 'el token vence en'} ${dias} días${dias <= 14 ? ': renovalo (TU-20)' : ''}`,
    );
  salida.push(fallo ? 'RESULTADO: FALLA' : 'RESULTADO: PASA');
  return { codigo: fallo ? 1 : 0, salida };
}

if (import.meta.main) {
  const run: Run = (cmd, args) => {
    const r = spawnSync(cmd, args, { encoding: 'utf8' });
    return { status: r.status ?? 1, stdout: r.stdout ?? '', stderr: r.stderr ?? '' };
  };
  const r = verificarToken(run, new Date(), process.argv.includes('--sin-ci'));
  console.log(r.salida.join('\n'));
  process.exit(r.codigo);
}
