// Registro automático de las programadas reactivadas (FT-40, CA-40.6; 01 §4.16, CF-20): el tramo en que la programada estuvo inactiva no
// genera ocurrencias, así que la tarea diaria no registra ninguna de ese tramo.
import { describe, expect, it } from 'vitest';
import type { Hechos, Programada, Uuid } from '../hechos';
import { Centavos } from '../valores/centavos';
import { FechaLocal } from '../valores/fecha-local';
import { ocurrenciasAutomaticas } from './registro-automatico';

const f = (t: string) => FechaLocal.desdeTexto(t);
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}` as Uuid;
const mensualDel17: Programada = {
  id: id(1),
  tipo: 'gasto',
  cuentaId: id(2),
  cuentaDestinoId: null,
  comercio: 'Netflix',
  monto: Centavos.desdeEntero(1549),
  tolerancia: Centavos.desdeEntero(0),
  frecuencia: 'mensual',
  frecuenciaDias: null,
  primeraFecha: f('2027-05-17'),
  fechaFin: null,
  registroAutomatico: true,
  activa: true,
  reactivadaDesde: f('2027-09-20'),
  revision: null,
};
const hechos = (p: Programada): Hechos =>
  ({ programadas: [p], ocurrencias_resueltas: [] }) as unknown as Hechos;

describe('PRU-DOM-PROG-102', () => {
  it('PRU-DOM-PROG-102 [CA-40.6] una programada mensual del 17 con registro automático, reactivada el 20 de septiembre, no registra el 20 de septiembre ninguna ocurrencia del tramo inactivo', () => {
    expect(ocurrenciasAutomaticas(hechos(mensualDel17), f('2027-09-20'))).toEqual([]);
    expect(ocurrenciasAutomaticas(hechos(mensualDel17), f('2027-10-17'))).toEqual([
      { programadaId: id(1), fechaEsperada: f('2027-10-17') },
    ]);
  });
});
