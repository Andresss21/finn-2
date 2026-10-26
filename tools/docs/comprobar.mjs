// tools/docs/comprobar.mjs — `pnpm docs:comprobar` (TA-252; 07 §13.7, §35; 04 §18.4 BE-63; CT-08): los 7 scripts de las
// fases 4 a 6, portados sin cambios desde docs/anexos/07-pruebas-verificacion (cierre/), sobre los documentos de docs/.
// `rapido` lo corre solo si el diff toca docs/ (tools/ci/afecta.mjs). Sale con 1 si alguno falla.
//   node tools/docs/comprobar.mjs [--docs <carpeta>]   por defecto, docs/ del repositorio
// Python 3.12 o posterior (los scripts usan f-strings de PEP 701). `-X utf8`: en Windows la consola y open() no son
// UTF-8. Sin `-I`: prueba_reportes.py y recorridos.py importan sus vecinos (reportes.py, motor_min.py, cf25.py).
import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = fileURLToPath(new URL('.', import.meta.url));
const argv = process.argv.slice(2);
const k = argv.indexOf('--docs');
const docs = resolve(k >= 0 ? (argv[k + 1] ?? '') : join(aqui, '..', '..', 'docs'));
const d = (n) => join(docs, n);
const [d04, d05, d06] = ['04-backend.md', '05-frontend.md', '06-features.md'].map(d);

// [nombre, script, argumentos] en el orden de la tabla de 07 §35
const SCRIPTS = [
  ['04 t17.py (T1 a T7, BE-63)', 't17.py', [d04]],
  ['05 trazabilidad.py --comprobar (CT-08)', 'fase5/trazabilidad.py', [d05, '--comprobar']],
  ['05 cobertura.py (CT-08)', 'fase5/cobertura.py', [d05]],
  ['06 trazabilidad.py (T1 a T8)', 'trazabilidad.py', [d06, d04, d05]],
  ['06 revisar_fichas.py', 'revisar_fichas.py', [d06, d04, d05, '77']],
  ['06 prueba_reportes.py', 'prueba_reportes.py', []],
  ['06 recorridos.py', 'recorridos.py', []],
];

const python = process.env['FINN_PYTHON'] || (process.platform === 'win32' ? 'python' : 'python3');
let fallidos = 0;
for (const [nombre, script, args] of SCRIPTS) {
  const r = spawnSync(python, ['-X', 'utf8', '-B', join(aqui, script), ...args], {
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  });
  if (r.error) {
    console.error(`docs:comprobar: no se pudo ejecutar ${python} (${r.error.message})`);
    process.exit(1);
  }
  const texto = `${r.stdout}${r.stderr}`.trimEnd();
  const salida = texto.split('\n');
  // trazabilidad.py, revisar_fichas.py y recorridos.py (06) salen con 0 aunque fallen: lo dice su línea RESULTADO
  const ok = r.status === 0 && !/^RESULTADO: FALLA/m.test(texto);
  if (!ok) fallidos++;
  console.log(`${ok ? '✓' : '✗'} ${nombre} (código ${r.status})`);
  // Si pasa, el resumen (las últimas líneas); si falla, todo lo que dijo
  for (const l of ok ? salida.slice(-3) : salida) console.log(`    ${l}`);
}
console.log(
  fallidos ? `docs:comprobar: ${fallidos} de ${SCRIPTS.length} fallan` : 'docs:comprobar: pasan los 7',
);
process.exit(fallidos ? 1 : 0);
