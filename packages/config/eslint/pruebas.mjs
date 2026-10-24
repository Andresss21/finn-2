// Lint de las pruebas (07 §7.1): determinismo por diseño. Se compone con la configuración de TA-003.
import playwright from 'eslint-plugin-playwright';
import tseslint from 'typescript-eslint';

export const archivosDePrueba = ['**/*.test.{ts,tsx}', 'apps/web/e2e/**/*.ts'];
export const archivosE2E = ['apps/web/e2e/**/*.ts'];

const dateNow = {
  selector: "CallExpression[callee.object.name='Date'][callee.property.name='now']",
  message: 'Date.now() está prohibido en las pruebas (07 §7.1): recibí `hoy` o fijá el reloj.',
};
const dateSinArgumentos = {
  selector: "NewExpression[callee.name='Date'][arguments.length=0]",
  message:
    'new Date() sin argumentos está prohibido en las pruebas (07 §7.1): pasá un instante explícito.',
};
const esperaFija = {
  selector:
    "CallExpression[callee.name='setTimeout'], CallExpression[callee.property.name='setTimeout']",
  message:
    'setTimeout con espera fija está prohibido en e2e/ (07 §7.1): esperá un evento o una aserción.',
};

export const pruebas = [
  {
    name: 'finn/pruebas/reloj',
    files: archivosDePrueba,
    languageOptions: { parser: tseslint.parser },
    rules: { 'no-restricted-syntax': ['error', dateNow, dateSinArgumentos] },
  },
  {
    name: 'finn/pruebas/e2e',
    files: archivosE2E,
    plugins: { playwright },
    rules: {
      'no-restricted-syntax': ['error', dateNow, dateSinArgumentos, esperaFija],
      'playwright/no-wait-for-timeout': 'error',
    },
  },
];

export default pruebas;
