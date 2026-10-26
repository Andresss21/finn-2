// Lintea código con una ruta virtual (el archivo no existe) usando la configuración real del repositorio.
// Lo usa controles.test.ts en un proceso aparte: el servicio de proyecto de typescript-eslint se comparte
// dentro de un proceso, y los otros controles ya crearon uno sin estas rutas.
// Entrada (stdin): [{ ruta, codigo }]. Salida (stdout): { [ruta]: string[] } con las reglas que fallaron.
import { readFileSync } from 'node:fs';
import { ESLint } from 'eslint';
import { configurar } from '@finn/config/eslint';
import { pruebas } from '../../../packages/config/eslint/pruebas.mjs';

const items = JSON.parse(readFileSync(0, 'utf8'));
const eslint = new ESLint({
  cwd: process.cwd(),
  overrideConfigFile: true,
  overrideConfig: [
    ...configurar(),
    ...pruebas,
    {
      files: ['apps/web/**/*.{ts,tsx}'],
      languageOptions: {
        parserOptions: {
          projectService: {
            allowDefaultProject: items.map((i) => i.ruta),
            defaultProject: 'tools/lint/tsconfig.json',
            maximumDefaultProjectFileMatchCount_THIS_WILL_SLOW_DOWN_LINTING: 200,
          },
        },
      },
    },
  ],
});

const salida = {};
for (const { ruta, codigo } of items) {
  const [r] = await eslint.lintText(codigo, { filePath: ruta });
  salida[ruta] = (r?.messages ?? []).map((m) => m.ruleId ?? `parse:${m.message}`);
}
process.stdout.write(JSON.stringify(salida));
