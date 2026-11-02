// Propiedad del detalle de Listo para asignar (FT-15 CA-15.1; 04 §6.4): para cualquier estado y cualquier cantidad de períodos,
// las entradas menos lo asignado, las reducciones y lo que está en camino dan exactamente `lpa`; la reducción proyectada es la
// suma de sus categorías y tarjetas; y el historial nunca trae más períodos que los pedidos.
import fc from 'fast-check';
import { expect, it } from 'vitest';
import { calcular } from '../calculo/calcular';
import { hechosArb } from '../pruebas/generadores';
import { FechaLocal } from '../valores/fecha-local';
import { detalleLpa } from './detalle-lpa';

// Semilla de la corrida (07 §7.1): FC_SEED la fija vitest.config.ts; 300 casos en PR y FC_RUNS=2000 en local.
const entorno = (globalThis as { process?: { env: Record<string, string | undefined> } }).process
  ?.env;
const opciones = {
  numRuns: Number(entorno?.['FC_RUNS'] ?? '300'),
  seed: Number(entorno?.['FC_SEED'] ?? '0'),
};
const HOY = FechaLocal.desdeTexto('2027-12-31');

it('PRU-PROP-PRES-102 [CA-15.1] la descomposición de Listo para asignar suma exactamente lpa y la reducción proyectada es la suma de sus partes', () => {
  fc.assert(
    fc.property(hechosArb(HOY), fc.integer({ min: 1, max: 60 }), (hechos, periodos) => {
      const i = calcular(hechos, HOY);
      const d = detalleLpa(i, periodos);
      const k = d.descomposicion;
      const entradas =
        k.entradas.ingresos +
        k.entradas.otrasEntradas +
        k.entradas.restituciones +
        k.entradas.saldosIniciales;
      const salidas =
        k.asignadoPeriodosCerrados +
        k.asignadoPeriodoActivo +
        k.asignadoPeriodosFuturos +
        k.reduccionesSobregiroDebito +
        k.reduccionesPagoExcedente +
        k.enCamino;
      expect(entradas - salidas).toBe(d.lpa);
      expect(d.lpaNegativo).toBe(d.lpa < 0);
      const r = d.reduccionProyectadaAlCierre;
      expect(
        r.categorias.reduce((s, c) => s + c.monto, 0) + r.tarjetas.reduce((s, c) => s + c.monto, 0),
      ).toBe(r.total);
      expect(d.historial.length).toBeLessThanOrEqual(periodos);
    }),
    opciones,
  );
});
