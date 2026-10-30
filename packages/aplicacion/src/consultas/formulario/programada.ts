// `formulario({ operacion: 'programada', programadaId?, fechaEsperada? })` (04 §6.14.4): los préstamos con modelo y,
// con `programadaId`, la programada, su calendario editable ([H], 6.12.1) y la ocurrencia pedida. Del dominio (inv. 27).
import { formulario } from '@finn/dominio/selectores';
import { leerReferenciasDeProgramadas } from '@finn/db';
import type { ParametrosFormulario as Entrada } from '../../contratos/consultas.ts';
import { type ContextoConsulta, noEncontrado } from '../comun.ts';
import { sinIndefinidos } from '../sin-indefinidos.ts';

type P = Extract<Entrada, { operacion: 'programada' }>;

export async function programada({ tx, i }: ContextoConsulta, p: P) {
  if (p.programadaId !== undefined && !i.hechos.programadas.some((q) => q.id === p.programadaId))
    throw noEncontrado();
  try {
    return formulario(
      i,
      {
        operacion: 'programada',
        ...sinIndefinidos({ programadaId: p.programadaId, fechaEsperada: p.fechaEsperada }),
      },
      { referencias: await leerReferenciasDeProgramadas(tx) },
    );
  } catch (e) {
    if (e instanceof RangeError) throw noEncontrado(); // la fecha no es una ocurrencia
    throw e;
  }
}
