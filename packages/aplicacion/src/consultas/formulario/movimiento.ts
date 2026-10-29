// `formulario({ operacion: 'movimiento', movimientoId })` (04 §6.14.4, CH-30): el `MovimientoDto` de la bandeja y,
// si propone una devolución, las `candidatas`. Los movimientos son [H] e [I]: se leen en la misma instantánea.
import { formulario } from '@finn/dominio/selectores';
import { leerDatosDeBandeja, leerReglasComercio } from '@finn/db';
import type { ParametrosFormulario as Entrada } from '../../contratos/consultas.ts';
import { type ContextoConsulta, noEncontrado } from '../comun.ts';

type P = Extract<Entrada, { operacion: 'movimiento' }>;

export async function movimiento({ tx, i }: ContextoConsulta, p: P) {
  const bandeja = await leerDatosDeBandeja(tx);
  if (!bandeja.movimientos.some((x) => x.movimiento.id === p.movimientoId)) throw noEncontrado();
  return formulario(
    i,
    { operacion: 'movimiento', movimientoId: p.movimientoId },
    { bandeja, reglas: await leerReglasComercio(tx) },
  );
}
