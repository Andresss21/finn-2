// ESLint en configuración plana (ADR-21, 04 §1.5 d). `configurar({ controles: true })` suma los
// archivos de tools/lint/controles/paquetes/ a cada paquete según su prefijo, para que las pruebas
// exijan que cada uno falle con su regla; la configuración normal los ignora.
import { builtinModules } from 'node:module';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import finn from './reglas.mjs';
import { configurarWeb } from './web.mjs';

const TS = '**/*.{ts,tsx}';
const CONTROLES = 'tools/lint/controles/paquetes';
const PRISMA = [
  '@prisma/client',
  '@prisma/client/*',
  '@prisma/adapter-pg',
  'pg',
  '**/generado/prisma',
  '**/generado/prisma/**',
];
const PRISMA_8 = ['@prisma/orm-*'];
const E_S = [
  'next',
  'next/*',
  'node:*',
  'server-only',
  'react',
  'react-dom',
  '@supabase/*',
  ...builtinModules,
];
const DOMINIO_SOLO_TIPOS = {
  name: '@finn/dominio',
  allowTypeImports: true,
  message: 'Solo tipos desde la API de dominio (04 §1.3).',
};

// Módulos de dinero y fechas (ADR-21) y excepciones de L20 (formato y reloj de prueba).
const DINERO_Y_FECHAS = [
  'packages/dominio/src/valores/**',
  'packages/db/src/mapeo/**',
  'packages/aplicacion/src/tiempo/**',
];
const EXCEPCIONES_L20 = [
  'packages/aplicacion/src/tiempo/**',
  '**/formato/**',
  '**/reloj-prueba/**',
  '**/reloj-prueba.ts',
];

const prohibir = (paths, patterns, message) => ({
  '@typescript-eslint/no-restricted-imports': [
    'error',
    { paths, patterns: [{ group: patterns, message }] },
  ],
});

export function configurar({ controles = false } = {}) {
  const alcance = (prefijo, ...globs) => [
    ...globs,
    ...(controles ? [`${CONTROLES}/${prefijo}-*.ts`] : []),
  ];
  const dominio = alcance('dominio', 'packages/dominio/**/*.{ts,tsx}');
  const db = alcance('db', 'packages/db/**/*.{ts,tsx}');
  const sms = alcance('sms', 'packages/sms/**/*.{ts,tsx}');
  const conciliacion = alcance('conciliacion', 'packages/conciliacion/**/*.{ts,tsx}');
  const aplicacion = alcance('aplicacion', 'packages/aplicacion/**/*.{ts,tsx}');
  const web = alcance('web', 'apps/web/**/*.{ts,tsx}');

  return tseslint.config(
    {
      ignores: [
        '**/node_modules/**',
        '**/generado/**',
        '**/.next/**',
        '**/dist/**',
        'docs/**',
        'plan/**',
        'supabase/**',
        'tools/plan/**',
        ...(controles ? [] : [`tools/lint/controles/**`]),
      ],
    },
    { linterOptions: { reportUnusedDisableDirectives: 'error' } },
    { ...js.configs.recommended, files: ['**/*.{js,mjs,cjs}'] },
    ...tseslint.configs.strictTypeChecked.map((c) => ({ ...c, files: [TS] })),
    {
      files: [TS],
      languageOptions: { parserOptions: { projectService: true, tsconfigRootDir: process.cwd() } },
    },
    { ...tseslint.configs.disableTypeChecked, files: ['**/*.{js,mjs,cjs}'] },
    {
      files: ['**/*.{js,mjs,cjs}'],
      languageOptions: { globals: { process: 'readonly', console: 'readonly', URL: 'readonly' } },
    },
    {
      files: [TS],
      rules: {
        '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      },
    },
    { files: ['**/*.test.ts'], rules: { '@typescript-eslint/no-floating-promises': 'off' } },
    { files: ['**/*.{js,mjs,cjs,ts,tsx}'], plugins: { finn }, rules: { 'finn/cliente': 'error' } },
    // Prisma 8 y Prisma fuera de @finn/db, en todo el repositorio.
    {
      files: [TS],
      ignores: ['packages/db/**'],
      rules: prohibir(
        [],
        [...PRISMA, ...PRISMA_8],
        'Solo @finn/db importa Prisma 7 y su cliente (ADR-21); nunca @prisma/orm-*.',
      ),
    },
    {
      files: db,
      rules: prohibir(
        [DOMINIO_SOLO_TIPOS],
        ['@finn/sms', '@finn/conciliacion', '@finn/aplicacion', '@finn/web', ...PRISMA_8],
        'db no depende de esa capa (04 §1.3).',
      ),
    },
    {
      files: dominio,
      rules: {
        ...prohibir(
          [],
          ['@finn/*', ...PRISMA, ...PRISMA_8, ...E_S],
          'dominio es puro: sin E/S, Prisma, Next, Node ni otros paquetes (ADR-21).',
        ),
        'finn/reloj': 'error',
      },
    },
    { files: [...sms, ...conciliacion], rules: { 'finn/reloj': 'error' } },
    {
      files: sms,
      rules: prohibir(
        [DOMINIO_SOLO_TIPOS],
        ['@finn/db', '@finn/conciliacion', '@finn/aplicacion', '@finn/web', ...PRISMA, ...PRISMA_8],
        'sms no depende de esa capa (04 §1.3).',
      ),
    },
    {
      files: conciliacion,
      rules: prohibir(
        [DOMINIO_SOLO_TIPOS],
        ['@finn/db', '@finn/sms', '@finn/aplicacion', '@finn/web', ...PRISMA, ...PRISMA_8],
        'conciliacion no depende de esa capa (04 §1.3).',
      ),
    },
    {
      files: aplicacion,
      rules: prohibir(
        [],
        ['@finn/web', ...PRISMA, ...PRISMA_8],
        'aplicacion no depende de la web ni de Prisma (04 §1.3).',
      ),
    },
    ...configurarWeb({
      archivos: web,
      paths: [DOMINIO_SOLO_TIPOS],
      patrones: [
        {
          group: ['@finn/db', '@finn/sms', '@finn/conciliacion', ...PRISMA, ...PRISMA_8],
          message: 'La web llega a la base solo por @finn/aplicacion (04 §1.3).',
        },
      ],
    }),
    // L20 (CT-02).
    {
      files: [...aplicacion, ...web.map((g) => g.replace('apps/web/**', 'apps/web/src/app/**'))],
      ignores: EXCEPCIONES_L20,
      rules: { 'finn/l20': 'error' },
    },
    // Dinero (ADR-21): parseFloat, toFixed y `/` sobre Centavos.
    { files: [TS], ignores: DINERO_Y_FECHAS, rules: { 'finn/dinero': 'error' } },
  );
}
