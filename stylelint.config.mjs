// L12 (05 §1.7, 10.1): ningún color literal fuera de `src/estilos/tokens.css`. Sin `extends`: solo las
// reglas de color, para no imponer estilo a Tailwind (`@import`, `@theme`, `@custom-variant`).
const COLOR = {
  'color-no-hex': true,
  'color-named': 'never',
  'function-disallowed-list': [
    'rgb',
    'rgba',
    'hsl',
    'hsla',
    'hwb',
    'lab',
    'lch',
    'oklab',
    'oklch',
    'color',
    'color-mix',
  ],
};

export default {
  ignoreFiles: ['**/node_modules/**', '**/.next/**', '**/generado/**', 'tools/lint/controles/**'],
  rules: COLOR,
  overrides: [
    {
      files: ['**/estilos/tokens.css'],
      rules: Object.fromEntries(Object.keys(COLOR).map((r) => [r, null])),
    },
  ],
};
