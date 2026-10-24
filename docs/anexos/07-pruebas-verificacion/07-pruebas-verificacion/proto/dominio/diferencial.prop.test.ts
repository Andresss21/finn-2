// PRU-PROP-MOTOR-006 (prototipo de V7-03): diferencial contra el motor mínimo independiente de la Fase 6 (Python).
import { it, expect } from 'vitest';
import fc from 'fast-check';
import { execFileSync } from 'node:child_process';
import { writeFileSync, readFileSync } from 'node:fs';
import { calcular } from './nucleo';
import { hechosArb } from './generadores';
it('PRU-PROP-MOTOR-006 núcleo TS = motor_min.py en LPA, efectivo, Disponibles, S y SobTA', () => {
  const casos = fc.sample(hechosArb(), { numRuns: Number(process.env.FC_RUNS_DIF ?? 1000), seed: 42 });
  writeFileSync('/tmp/claude-0/dif_in.json', JSON.stringify(casos));
  execFileSync('python3', ['-I', '/home/claude/v7/oraculo/oraculo.py', '/tmp/claude-0/dif_in.json', '/tmp/claude-0/dif_out.json'], { cwd: '/home/claude/v7/oraculo' });
  const esperados = JSON.parse(readFileSync('/tmp/claude-0/dif_out.json', 'utf8'));
  let distintos = 0, primero: any = null;
  casos.forEach((h, i) => { const s = calcular(h), o = esperados[i];
    const got = { lpa: s.lpa, efectivo: s.efectivo, disp: s.disp, S: s.S, sobta: s.sobta };
    if (JSON.stringify(got, Object.keys(got).sort()) !== JSON.stringify(o, Object.keys(o).sort()) && !(o.error === undefined && JSON.stringify(sortKeys(got)) === JSON.stringify(sortKeys(o)))) { distintos++; primero ??= { i, got, o }; } });
  if (primero) console.log(JSON.stringify(primero).slice(0, 800));
  expect(distintos).toBe(0);
});
function sortKeys(v: any): any { return Array.isArray(v) ? v.map(sortKeys) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, sortKeys(v[k])])) : v; }
