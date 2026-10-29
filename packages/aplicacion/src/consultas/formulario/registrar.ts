// `formulario({ operacion: 'registrar', tipo, cuentaId? })` (04 §6.14.4): catálogos de 6.14.2 según el tipo y la
// cuenta propuesta. Los comercios necesitan las reglas [H] (6.14.3) solo cuando el tipo los pide.
import { formulario, type ParametrosFormulario } from '@finn/dominio/selectores';
import { leerReglasComercio } from '@finn/db';
import type { ParametrosFormulario as Entrada } from '../../contratos/consultas.ts';
import { type ContextoConsulta, noEncontrado } from '../comun.ts';

type P = Extract<Entrada, { operacion: 'registrar' }>;

export async function registrar({ tx, i }: ContextoConsulta, p: P) {
  if (p.cuentaId !== undefined && !i.hechos.cuentas.some((k) => k.id === p.cuentaId))
    throw noEncontrado();
  const pideComercios = p.tipo === 'gasto' || p.tipo === 'devolucion_sin_compra';
  const dominio: ParametrosFormulario = {
    operacion: 'registrar',
    tipo: p.tipo,
    ...(p.cuentaId === undefined ? {} : { cuentaId: p.cuentaId }),
  };
  return formulario(i, dominio, pideComercios ? { reglas: await leerReglasComercio(tx) } : {});
}
