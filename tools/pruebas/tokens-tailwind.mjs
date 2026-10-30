// Puente de Tailwind v4 (05 §10.1, CF-11, CF-12): genera `apps/web/tailwind.css` desde `tokens.json`.
// `node tools/pruebas/tokens-tailwind.mjs` lo reescribe; tokens.test.ts comprueba que no se desvía.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const TOKENS = new URL('../../apps/web/src/app/tokens.json', import.meta.url);
const SALIDA = new URL('../../apps/web/tailwind.css', import.meta.url);

// `extra` de tokens.json: "a: b; c: d" → declaraciones por separado.
const declaraciones = (extra) =>
  extra
    .split(';')
    .map((d) => d.trim())
    .filter(Boolean)
    .map((d) => `${d};`);

export function generar(tokens) {
  const linea = (nombre, valor) => `  --${nombre}: ${valor};`;
  const colores = Object.keys(tokens.color).map((n) => linea(`color-${n}`, `var(--${n})`));
  const radios = Object.keys(tokens.otros)
    .filter((n) => n.startsWith('radio-'))
    .map((n) => linea(`radius-${n.slice(6)}`, `var(--${n})`));
  const sombras = Object.keys(tokens.elevacion).map((n) => linea(`shadow-${n}`, `var(--${n})`));
  const curvas = Object.keys(tokens.otros)
    .filter((n) => n.startsWith('curva-'))
    .map((n) => linea(`ease-${n.slice(6)}`, `var(--${n})`));
  const fuentes = [
    linea('font-titulo', 'var(--fuente-titulo)'),
    linea('font-cuerpo', 'var(--fuente-cuerpo)'),
  ];
  const roles = Object.entries(tokens.tipografia).map(([rol, t]) =>
    [
      `@utility text-${rol} {`,
      `  font-family: var(--${t.fuente});`,
      `  font-size: ${t.tamano};`,
      `  line-height: ${t.interlineado};`,
      `  font-weight: ${t.peso};`,
      ...declaraciones(t.extra).map((d) => `  ${d}`),
      '}',
    ].join('\n'),
  );
  return [
    '/* Generado por tools/pruebas/tokens-tailwind.mjs desde tokens.json. No editar a mano (CF-11, CF-12). */',
    '@custom-variant dark (&:where([data-theme=oscuro], [data-theme=oscuro] *));',
    '',
    '@theme inline {',
    linea('spacing', 'var(--espacio-1)'),
    ...colores,
    ...radios,
    ...sombras,
    ...curvas,
    ...fuentes,
    '}',
    '',
    roles.join('\n\n'),
    '',
  ].join('\n');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync(SALIDA, generar(JSON.parse(readFileSync(TOKENS, 'utf8'))));
}
