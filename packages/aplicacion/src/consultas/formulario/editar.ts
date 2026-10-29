// `formulario({ operacion: 'editar_transaccion', transaccionId })` (04 §6.14.4): el `DetalleTransaccionDto` completo
// (SMS de origen, cambios posteriores y `monto_original`, como en `detalleTransaccion`), más las cuentas y categorías
// archivadas que ya usa y la capacidad de devolución.
import { formulario } from '@finn/dominio/selectores';
import {
  leerCambiosPosteriores,
  leerReglasComercio,
  montoOriginalDe,
  smsDeTransaccion,
} from '@finn/db';
import type { ParametrosFormulario as Entrada } from '../../contratos/consultas.ts';
import { type ContextoConsulta, noEncontrado } from '../comun.ts';

type P = Extract<Entrada, { operacion: 'editar_transaccion' }>;

export async function editar({ tx, i }: ContextoConsulta, p: P) {
  const { transaccionId } = p;
  if (!i.hechos.transacciones.some((t) => t.id === transaccionId)) throw noEncontrado();
  const sms = await smsDeTransaccion(tx, transaccionId);
  const montoOriginal = await montoOriginalDe(tx, transaccionId);
  const r = formulario(
    i,
    { operacion: 'editar_transaccion', transaccionId },
    {
      reglas: await leerReglasComercio(tx),
      cambios: await leerCambiosPosteriores(tx),
      ...(sms === null ? {} : { sms: new Map([[transaccionId, sms]]) }),
    },
  );
  if (montoOriginal === null) return r;
  // `monto_original` no está en los hechos del motor (5.2): se completa aquí, solo para mostrar
  const { contexto } = r;
  return {
    ...r,
    contexto: {
      ...contexto,
      transaccion: { ...contexto.transaccion, montoOriginal: montoOriginal as never },
      esperado: { ...contexto.esperado, montoOriginal: montoOriginal as never },
    },
  };
}
