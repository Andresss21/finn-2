// tools/pruebas/documentos.ts — lectura de los documentos de docs/ para la matriz (07 §13.1).
// Portado del prototipo de V7-09/V7-11. Node 24 lo ejecuta sin compilar (solo sintaxis borrable).

export type Prioridad = 'I' | 'M' | 'P';
export interface Objetivo {
  id: string;
  tipo: 'CA' | 'ESC' | 'AV' | 'INV' | 'CB' | 'REC' | 'VER';
  ft?: string;
  prioridad?: Prioridad;
  manual?: boolean;
  advertencia?: boolean;
  s61?: boolean;
  diferida?: boolean;
  fts?: string[];
}
export interface Ficha {
  ft: string;
  prioridad: Prioridad;
  diferida: boolean;
  esc: string[];
  av: string[];
}
export interface Documentos {
  d01: string;
  d04: string;
  d05: string;
  d06: string;
}

const unicos = (xs: Iterable<string>): string[] => [...new Set(xs)];
const todos = (t: string, re: RegExp): string[] => [...t.matchAll(re)].map((x) => x[1]!);

/** Bloques `#### FT-nn … [I|M|P]` de 06 §2 (hasta §4, Recorridos). */
function bloques(d06: string) {
  const cuerpo = d06.split('## 2. Fichas por feature')[1]?.split('## 4. Recorridos')[0] ?? '';
  return cuerpo
    .split(/^#### /m)
    .slice(1)
    .flatMap((b) => {
      const m = b.match(/^(FT-\d{2}) .*\[(I|M|P)\](.*)/);
      return m
        ? [{ ft: m[1]!, prioridad: m[2] as Prioridad, diferida: /diferida/.test(m[3]!), b }]
        : [];
    });
}

export function fichas(d06: string): Ficha[] {
  const citas = (b: string, bloque: string, re: RegExp): string[] =>
    unicos(
      (b.split(`**${bloque}.**`)[1] ?? '').split(/\*\*[A-Z][a-z]+\.\*\*|\n\n\*\*/)[0]!.match(re) ??
        [],
    );
  return bloques(d06).map(({ b, ...f }) => ({
    ...f,
    esc: citas(b, 'Escenarios', /ESC-\d{2}/g),
    av: citas(b, 'Avisos', /AV-\d{2}/g),
  }));
}

export function objetivos(d: Documentos): Objetivo[] {
  const r: Objetivo[] = [];
  // CA de 06 §2: por ficha, con la prioridad del encabezado y sus marcas (manual), ⚠ y S6-1
  for (const { b, ft, prioridad, diferida } of bloques(d.d06))
    for (const c of b.matchAll(/^- \*\*(CA-\d{2}\.\d{1,2})([^*]*)\*\*/gm))
      r.push({
        id: c[1]!,
        tipo: 'CA',
        ft,
        prioridad,
        diferida,
        manual: /\(manual\)/.test(c[2]!),
        advertencia: /⚠/.test(c[2]!),
        s61: /S6-1/.test(c[2]!),
      });
  // ESC (01 §8), AV (01 §5.0.7), invariantes (01 §6) y casos borde (01 §9, P7-16)
  const tipo = (t: Objetivo['tipo'], ids: string[]) =>
    r.push(...ids.map((id) => ({ id, tipo: t })));
  tipo('ESC', todos(d.d01, /^#### (ESC-\d{2}) /gm));
  tipo('AV', todos(d.d01, /^\| (AV-\d{2}) \|/gm));
  const inv = d.d01.split('## 6. Invariantes')[1]?.split(/^## 7\./m)[0] ?? '';
  tipo(
    'INV',
    todos(inv, /^(\d{1,2})\. /gm).map((n) => 'INV-' + n.padStart(2, '0')),
  );
  tipo(
    'CB',
    todos(d.d01.split('## 9. Casos borde')[1]?.split(/^## 10\./m)[0] ?? '', /^\| (CB-\d{2}) \|/gm),
  );
  // Recorridos de 06 §4 (4.7 no es un recorrido), con las fichas que cita cada uno
  const rec = d.d06.split('## 4. Recorridos')[1]?.split(/^## 5\./m)[0] ?? '';
  for (const b of rec.split(/^### /m).slice(1)) {
    const m = b.match(/^4\.([1-6]) /);
    if (m) r.push({ id: 'REC-4.' + m[1], tipo: 'REC', fts: unicos(b.match(/FT-\d{2}/g) ?? []) });
  }
  // Verificaciones previas: V-nn y H-nn (04), V5-nn (05), V6-nn (06) y la prueba de catálogo de CF-16
  const ver = [
    ...todos(d.d04, /\b(V-\d{2}|H-\d{2})\b/g),
    ...todos(d.d05, /\b(V5-\d{2})\b/g),
    ...todos(d.d06, /\b(V6-\d{2})\b/g),
    'CF-16',
  ];
  tipo('VER', unicos(ver).sort());
  return r;
}

/** Los CF-nn definidos en la tabla de cambios de 06 (`| CF-nn |`). */
export const cambiosFuturos = (d06: string): string[] => unicos(todos(d06, /^\| (CF-\d{2}) \|/gm));
