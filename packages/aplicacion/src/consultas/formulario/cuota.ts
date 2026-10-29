// `formulario({ operacion: 'cuota_prestamo', prestamoId, modalidad, fecha? })` (04 §6.14.4): capital pendiente, cuota
// pactada, desglose propuesto de la primera cuota impaga y la categoría de la última cuota.
import { formulario } from '@finn/dominio/selectores';
import type { ParametrosFormulario as Entrada } from '../../contratos/consultas.ts';
import { type ContextoConsulta, noEncontrado } from '../comun.ts';
import { sinIndefinidos } from '../sin-indefinidos.ts';

type P = Extract<Entrada, { operacion: 'cuota_prestamo' }>;

export function cuota({ i }: ContextoConsulta, p: P) {
  if (!i.hechos.prestamos.some((x) => x.cuentaId === p.prestamoId)) throw noEncontrado();
  return formulario(i, {
    operacion: 'cuota_prestamo',
    prestamoId: p.prestamoId,
    modalidad: p.modalidad,
    ...sinIndefinidos({ fecha: p.fecha }),
  });
}
