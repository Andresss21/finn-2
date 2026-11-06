// `formulario({ operacion: 'conciliar', cuentaId })` (04 §6.14.4, CP-16): la cuenta, los tipos de alta que admite el signo de un
// movimiento y los catálogos de OP-46. Una cuenta que no es de efectivo ni tarjeta, o que está archivada, no se concilia (05 §7.7).
import { formulario } from '@finn/dominio/selectores';
import { leerReglasComercio } from '@finn/db';
import type { ParametrosFormulario as Entrada } from '../../contratos/consultas.ts';
import { type ContextoConsulta, noEncontrado } from '../comun.ts';

type P = Extract<Entrada, { operacion: 'conciliar' }>;

export async function conciliar({ tx, i }: ContextoConsulta, p: P) {
  const k = i.hechos.cuentas.find((x) => x.id === p.cuentaId);
  if (k === undefined || k.archivada || (k.tipo !== 'efectivo' && k.tipo !== 'tarjeta'))
    throw noEncontrado();
  return formulario(
    i,
    { operacion: 'conciliar', cuentaId: p.cuentaId },
    { reglas: await leerReglasComercio(tx) },
  );
}
