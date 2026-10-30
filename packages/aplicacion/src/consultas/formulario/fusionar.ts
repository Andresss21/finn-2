// `formulario({ operacion: 'fusionar', categoriaId })` (04 §6.14.4): el origen, los destinos válidos y el resumen de lo
// que se mueve (OP-10). Las reglas de comercio son [H]: se leen en la misma instantánea.
import { formulario } from '@finn/dominio/selectores';
import { leerReglasComercio } from '@finn/db';
import type { ParametrosFormulario as Entrada } from '../../contratos/consultas.ts';
import { type ContextoConsulta, noEncontrado } from '../comun.ts';

type P = Extract<Entrada, { operacion: 'fusionar' }>;

export async function fusionar({ tx, i }: ContextoConsulta, p: P) {
  const c = i.hechos.categorias.find((x) => x.id === p.categoriaId);
  if (c === undefined || c.clase !== 'normal') throw noEncontrado();
  return formulario(
    i,
    { operacion: 'fusionar', categoriaId: p.categoriaId },
    { reglas: await leerReglasComercio(tx) },
  );
}
