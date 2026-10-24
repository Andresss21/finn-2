// Prototipo de las reglas FE-21 (PF-3): importación de @finn/dominio/valores en el cliente.
import tseslint from 'typescript-eslint';
const prohibirValores = {
  name: '@finn/dominio/valores',
  message: 'Solo los formularios pueden importar Centavos en ejecución (PF-3). Fuera de ellos, usá "import type".',
  allowTypeImports: true,
};
const prohibirDominio = { name: '@finn/dominio', message: 'La interfaz solo importa tipos del dominio.', allowTypeImports: true };
export default tseslint.config(
  { files: ['apps/web/src/**/*.{ts,tsx}'], languageOptions: { parser: tseslint.parser },
    plugins: { '@typescript-eslint': tseslint.plugin },
    rules: { '@typescript-eslint/no-restricted-imports': ['error', { paths: [prohibirValores, prohibirDominio] }] } },
  { files: ['apps/web/src/componentes/formularios/**/*.{ts,tsx}', 'apps/web/src/formularios/**/*.{ts,tsx}'],
    rules: { '@typescript-eslint/no-restricted-imports': ['error', { paths: [prohibirDominio] }] } },
);
