// tools/pruebas/ft.ts — `pnpm pruebas:ft FT-nn` (07 §13.4): CA, recorridos, pruebas existentes, comandos y CA sin cubrir.
// Node 24 lo ejecuta sin compilar.
import { cargarEntradas, verificar } from './matriz.ts';
import type { Prueba, Resultado } from './matriz.ts';

/** Comando que corre cada nivel (07 §13.4); `ESC@int` corre en la suite de integración. */
export function comandoDe(p: Prueba): string {
  if (p.id.endsWith('@int')) return 'pnpm test:integracion -t';
  const por: Record<string, string> = {
    DOM: 'pnpm test:unidad -t',
    PROP: 'pnpm test:unidad -t',
    ESC: 'pnpm test:escenarios -t',
    CTR: 'pnpm test:contratos -t',
    INT: 'pnpm test:integracion -t',
    ESQ: 'pnpm test:integracion -t',
    RH: 'pnpm test:integracion -t',
    CMP: 'pnpm test:componentes -t',
    E2E: 'pnpm test:e2e -- -g',
    SW: 'pnpm test:e2e -- -g',
    REN: 'pnpm bench -t',
    SEG: 'pnpm test -t',
    RES: 'pnpm test:respaldo -t',
  };
  return por[p.nivel] ?? 'pnpm test -t';
}

/** Un comando por herramienta, con el filtro de las pruebas que le tocan. */
export function comandos(ps: Prueba[]): string[] {
  const por = new Map<string, string[]>();
  for (const p of ps) por.set(comandoDe(p), [...(por.get(comandoDe(p)) ?? []), p.id]);
  return [...por].map(([c, ids]) => `${c} "${ids.join('|')}"`);
}

export function porFeature(r: Resultado, ft: string) {
  const cas = r.obj.filter((o) => o.tipo === 'CA' && o.ft === ft).map((o) => o.id);
  const recs = r.obj.filter((o) => o.tipo === 'REC' && o.fts?.includes(ft)).map((o) => o.id);
  const refs = new Set([...cas, ...recs, ft]);
  const pruebas = r.activas.filter((p) => p.refs.some((x) => refs.has(x)));
  return {
    cas,
    recs,
    pruebas,
    manuales: r.man.filter((m) => m.refs.some((x) => refs.has(x))).map((m) => m.id),
    comandos: comandos(pruebas),
    sinCubrir: cas.filter((c) => !r.cubre.get(c)?.length),
  };
}

if (import.meta.main) {
  const ft = process.argv[2] ?? '';
  if (!/^FT-\d{2}$/.test(ft)) {
    console.error('uso: pnpm pruebas:ft FT-nn');
    process.exit(2);
  }
  const r = verificar(cargarEntradas());
  const x = porFeature(r, ft);
  if (!x.cas.length) {
    console.error(`${ft} no tiene CA en 06`);
    process.exit(2);
  }
  console.log(
    `pruebas:ft ${ft} → ${x.cas.length} CA, ${x.recs.join(', ') || 'sin recorrido'}, ${x.pruebas.length} pruebas, comandos:`,
  );
  for (const c of x.comandos) console.log('   ' + c);
  if (x.manuales.length) console.log(`manuales: ${x.manuales.join(', ')}`);
  console.log(
    x.sinCubrir.length ? `sin cubrir: ${x.sinCubrir.join(', ')}` : 'todos los CA cubiertos',
  );
}
