// Control negativo de V7-08: cuenta filas y aserciones evaluadas; con un dato alterado o un mutante del núcleo, debe fallar.
import { ESCENARIOS } from './todos';
import { correr } from './ejecutar';
import { ejecutorMotor } from './motor';
const alterar = process.env.ALTERAR;   // p. ej. 'ESC-06:3:lpa:601'
if (alterar) { const [id, n, campo, v] = alterar.split(':'); const p = ESCENARIOS.get(id)!.pasos.find(x => x.n === n)!; (p.espera as any)[campo] = Number(v); }
let filas = 0, fallidas = 0; const omit: string[] = [];
let bases = 0;
for (const id of ESCENARIOS.keys()) {
  let fs; try { fs = await correr(id, ESCENARIOS, ejecutorMotor as any); } catch (e) { bases++; console.log(`  ${id}: ${(e as Error).message.slice(0, 120)}`); continue; }
  for (const f of fs) { filas++; if (f.fallos.length) { fallidas++; console.log(`  ${id} paso ${f.paso}: ${f.fallos.join('; ').slice(0, 140)}`); } if (f.omitidos.length) omit.push(`${id}/${f.paso}: ${f.omitidos}`); }
}
console.log(`mutante=${process.env.FINN_MUTANTE ?? '-'} alterar=${alterar ?? '-'} → filas ${filas}, fallidas ${fallidas}, escenarios con la base rota ${bases}, omitidas [${omit.join(' | ')}]`);
