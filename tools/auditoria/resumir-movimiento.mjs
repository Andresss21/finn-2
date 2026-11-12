// Pasa docs/auditoria-diseno/movimiento/*.json a una tabla legible: movimiento/RESUMEN.md
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const dir = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'docs',
  'auditoria-diseno',
  'movimiento',
);
const out = [
  '# Movimiento medido',
  '',
  'Animaciones y transiciones finitas que corrieron en cada momento (Web Animations API, muestreadas por cuadro).',
  '',
];
for (const f of readdirSync(dir)
  .filter((x) => x.endsWith('.json'))
  .sort()) {
  out.push(`## ${f.replace('.json', '')}`, '');
  for (const m of JSON.parse(readFileSync(join(dir, f), 'utf8'))) {
    out.push(
      `### ${m.momento}`,
      `Esperado: ${m.esperado}`,
      `Después: \`${m.despues?.url ?? ''}\`${m.despues?.dialogos?.length ? ` · diálogos abiertos: ${m.despues.dialogos.join(', ')}` : ''}`,
      '',
    );
    if (m.animaciones.length === 0) out.push('_Ninguna animación ni transición._', '');
    else {
      out.push(
        '| animación | duración | retraso | curva | destino | primer cuadro |',
        '|---|---|---|---|---|---|',
      );
      const vistos = new Map();
      for (const a of m.animaciones) {
        const k = `${a.nombre}|${a.duracion}|${a.curva}|${a.destino}`;
        if (!vistos.has(k)) vistos.set(k, { ...a, retrasos: [] });
        vistos.get(k).retrasos.push(a.retraso);
      }
      for (const a of vistos.values())
        out.push(
          `| ${a.nombre} | ${a.duracion} ms | ${[...new Set(a.retrasos)].join(', ')} | ${a.curva} | \`${String(a.destino).slice(-90)}\` | ${(a.cuadros?.[0] ?? '').slice(0, 80)} |`,
        );
      out.push('');
    }
  }
}
writeFileSync(join(dir, 'RESUMEN.md'), out.join('\n'));
console.log('ok');
