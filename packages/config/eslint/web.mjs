// Reglas del cliente L1 a L19 (05 §1.7, FE-22; L12 a L14 de 10.1), apuntadas a las carpetas de 05 §1.1.
// En flat config la última regla que coincide reemplaza las opciones de la anterior: cada bloque
// arma la lista completa de `no-restricted-*` que le corresponde a su carpeta.
import jsxA11y from 'eslint-plugin-jsx-a11y';
import react from 'eslint-plugin-react';
import finn from './reglas.mjs';

const SRC = 'apps/web/src';
const EXT = '{ts,tsx}';
const src = (g) => `${SRC}/${g}/**/*.${EXT}`;
const PRUEBAS = ['apps/web/**/*.test.{ts,tsx}', 'apps/web/e2e/**/*.ts'];
const FORMATO = src('formato');
const ALMACEN = `${SRC}/cliente/almacen.ts`;
const ENLACE = `${SRC}/componentes/navegacion/enlace-finn.tsx`;

// Importaciones (L1, L2, L11, L16, L18, L19) sobre lo que TA-003 ya prohíbe; `ok` levanta lo que la carpeta permite.
function importaciones({ paths, patrones }, ok = {}) {
  const p = [...paths];
  const g = [...patrones];
  const msg = (name, message, extra) => p.push({ name, message, ...extra });
  if (!ok.valores)
    msg(
      '@finn/dominio/valores',
      'L1: valores de dominio solo en formularios; si no, `import type`.',
      {
        allowTypeImports: true,
      },
    );
  if (!ok.link)
    msg('next/link', 'L11: `next/link` solo en componentes/navegacion/enlace-finn.tsx.');
  if (!ok.router)
    msg('next/navigation', 'L19: `useRouter` solo en navegacion/ y formularios/ (8.5).', {
      importNames: ['useRouter'],
    });
  if (!ok.ui)
    g.push({
      group: ['**/components/ui', '**/components/ui/**', '@radix-ui/*'],
      message: 'L16: `components/ui/` y `@radix-ui/*` solo desde componentes/base/ (10.7).',
    });
  g.push({
    group: ['moment', 'date-fns', 'dayjs', 'luxon', 'lodash', 'lodash-es', 'numeral'],
    message: 'L18: sin bibliotecas de fechas, formato o utilidades; usá Intl y src/formato (13.3).',
  });
  for (const icono of ['react-icons', 'lucide-react', '@tabler/icons-react', '@heroicons/react'])
    msg(icono, 'L18: sin paquetes de iconos completos; SVG propios o de a uno (13.3).');
  return { '@typescript-eslint/no-restricted-imports': ['error', { paths: p, patterns: g }] };
}

// Cadenas con clases de Tailwind (se revisan todas las de src/, no solo `className`, porque L13 manda
// las variantes a mapas de clases literales): L12 (paleta y colores literales) y L14 (valores arbitrarios).
const COLOR =
  'text|bg|border|ring|ring-offset|fill|stroke|from|via|to|divide|outline|decoration|shadow|accent|caret|placeholder';
const PALETA =
  'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';
const ESPACIADO =
  'p[xytrblse]?|m[xytrblse]?|gap(-[xy])?|space-[xy]|rounded(-[a-z]{1,2})?|shadow|duration|delay';
const clases = (regex, message) =>
  ['Literal[value=/', 'TemplateElement[value.raw=/'].map((s) => ({
    selector: `${s}(^|[\\s:!])${regex}/]`,
    message,
  }));
const CLASES = [
  ...clases(
    `(${COLOR})-((${PALETA})-[0-9]|(white|black)([\\s:]|$)|\\[(#|rgb|hsl|oklch|oklab|lab|lch|color))`,
    'L12: ni paleta de Tailwind ni color literal; solo utilidades de tokens (10.1).',
  ),
  ...clases(
    `-?(${ESPACIADO})-\\[`,
    'L14: sin espaciado, radio, sombra ni duración arbitrarios; solo tokens (10.1).',
  ),
];
const INTL = "[callee.object.name='Intl'][callee.property.name=/^(NumberFormat|DateTimeFormat)$/]";
const L6 = [
  {
    selector: `:matches(NewExpression, CallExpression)${INTL}, CallExpression[callee.property.name=/^(toLocaleString|toFixed)$/]`,
    message: 'L6: `Intl`, `toLocaleString` y `toFixed` solo en src/formato/ (5.4).',
  },
];
const L9 = {
  selector: "ImportDeclaration[source.value='zod'] > ImportSpecifier[imported.name='z']",
  message: "L9: usá `import * as z from 'zod'`, no `import { z } from 'zod'` (CP-7).",
};
const L13 = {
  selector: "JSXAttribute[name.name='className'] TemplateLiteral[expressions.length>0]",
  message: 'L13: sin clases armadas con plantillas; usá un mapa de clases literales (10.1).',
};

// L5 y L7. Los excluidos de cada uno están en `almacen` y `fecha`.
const nombres = ({ almacen = true, fecha = true } = {}) => ({
  'no-restricted-globals': [
    'error',
    ...(almacen ? ['sessionStorage', 'localStorage'] : []).map((name) => ({
      name,
      message: 'L5: `sessionStorage` y `localStorage` solo vía src/cliente/almacen.ts.',
    })),
    ...(fecha
      ? [{ name: 'Date', message: 'L7: `Date` solo en src/formato/ y cliente/reloj.ts.' }]
      : []),
  ],
});
const sintaxis = (l6) => ({
  'no-restricted-syntax': ['error', ...(l6 ? L6 : []), L9, L13, ...CLASES],
});

/** `base`: lo que 04 §1.3 ya prohíbe a `apps/web` y los archivos a los que aplica. */
export function configurarWeb({ archivos, paths, patrones }) {
  const base = { paths, patrones };
  const sinPruebas = { files: [`${SRC}/**/*.${EXT}`], ignores: PRUEBAS };
  const tsx = { files: [`${SRC}/**/*.tsx`], ignores: PRUEBAS };
  return [
    { files: archivos, rules: importaciones(base) },
    { files: [src('componentes/navegacion')], rules: importaciones(base, { router: true }) },
    { files: [ENLACE], rules: importaciones(base, { router: true, link: true }) },
    {
      files: [src('formularios'), src('componentes/formularios')],
      rules: importaciones(base, { router: true, valores: true }),
    },
    // `components/ui/` es el código de shadcn (Radix debajo, 10.7): importa de `@radix-ui/*`; L16 vale para quien lo usa.
    {
      files: [src('componentes/base'), src('components/ui')],
      rules: importaciones(base, { ui: true }),
    },
    {
      files: PRUEBAS,
      rules: importaciones(base, { router: true, valores: true, link: true, ui: true }),
    },
    // L5 a L7, L9, L12 a L14.
    { ...sinPruebas, rules: { ...sintaxis(true), ...nombres() } },
    { files: [FORMATO], rules: { ...sintaxis(false), ...nombres({ fecha: false }) } },
    { files: [ALMACEN], rules: nombres({ almacen: false }) },
    { files: [`${SRC}/cliente/reloj.ts`], rules: nombres({ fecha: false }) },
    {
      ...sinPruebas,
      ignores: [...PRUEBAS, ALMACEN],
      rules: {
        'no-restricted-properties': [
          'error',
          ...['window', 'globalThis', 'self'].flatMap((object) =>
            ['sessionStorage', 'localStorage'].map((property) => ({ object, property })),
          ),
        ],
      },
    },
    // L3 y L4.
    { ...sinPruebas, ignores: [...PRUEBAS, FORMATO], rules: { 'finn/centavos': 'error' } },
    { files: [src('app')], rules: { 'finn/archivos-servidor': 'error' } },
    // L8, L15 y L17.
    {
      ...tsx,
      plugins: { finn, react, 'jsx-a11y': jsxA11y },
      settings: { react: { version: '19.0' } },
      languageOptions: jsxA11y.flatConfigs.recommended.languageOptions,
      rules: { ...jsxA11y.flatConfigs.recommended.rules, 'finn/jsx-deshabilitado': 'error' },
    },
    {
      ...tsx,
      ignores: [...PRUEBAS, src('textos')],
      plugins: { react },
      rules: {
        'react/jsx-no-literals': [
          'error',
          { allowedStrings: ['.', ',', ':', ';', '-', '–', '—', '/', '(', ')', '|', '·', '…'] },
        ],
      },
    },
  ];
}
