// `pnpm ci:politica-patrones` (04 §8.5 y §14.1, QC-3): `validarFormato` sobre cada formato bancario
// activo. Requisito solo de `desplegar`.
//
// Fuente de los formatos (TA-181): la siembra de 03 §9.5 más las sentencias de las migraciones que
// nombran `formatos_bancarios`, aplicadas en orden de carpeta (`formatos-activos.ts`). Una sentencia
// que esa lectura no entiende hace fallar el script: nunca se evalúa una lista incompleta.
import { performance } from 'node:perf_hooks';
import { validarFormato } from '../../packages/sms/src/validar-formato.ts';
import { leerFormatos } from './formatos-activos.ts';

function main(): number {
  let leidos: ReturnType<typeof leerFormatos>;
  try {
    leidos = leerFormatos(process.argv[2] ?? process.cwd());
  } catch (e) {
    console.error(`politica-patrones: ${(e as Error).message}. Falla cerrado.`);
    return 1;
  }
  const activos = leidos.formatos.filter((f) => f.activo);
  console.log(
    `politica-patrones: ${activos.length} de ${leidos.formatos.length} formatos activos (${leidos.fuentes.join(' + ')})`,
  );
  if (activos.length === 0) {
    console.error('politica-patrones: ningún formato activo leído; la fuente está mal');
    return 1;
  }
  let fallas = 0;
  for (const f of activos) {
    const t0 = performance.now();
    const v = validarFormato(f);
    const ms = `${Math.round(performance.now() - t0)} ms`;
    if (v.valido) {
      console.log(`  pasa   ${f.nombre} (grado ${v.grado ?? 'seguro'}, ${ms})`);
      continue;
    }
    fallas++;
    const detalle =
      v.error === 'patron_lento'
        ? ` grado ${v.grado ?? 'sin terminar (unknown)'}${v.ataque === '' ? '' : `, ataque ${v.ataque}`}`
        : '';
    console.error(`  FALLA  ${f.nombre}: ${v.error}${detalle} (${ms})`);
  }
  console.log(
    fallas === 0
      ? 'RESULTADO: PASA'
      : `RESULTADO: FALLA (${fallas} de ${activos.length}; BE-46, se corrige reescribiendo los patrones, QC-3)`,
  );
  return fallas === 0 ? 0 : 1;
}

process.exitCode = main();
