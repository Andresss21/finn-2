import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { calcular } from '../calculo/calcular';
import { estadoDe, periodoDe } from '../calculo/periodos';
import type { Hechos } from '../hechos';
import { FechaLocal } from '../valores/fecha-local';
import { fechaArb, hechosArb } from './generadores';
import { Sistema, operacionesArb } from './operaciones';
import type { Paso } from './operaciones';

// Semilla de la corrida (07 §7.1): FC_SEED la fija vitest.config.ts; 300 casos en PR (07 §1.1).
const entorno = (globalThis as { process?: { env: Record<string, string | undefined> } }).process
  ?.env;
const opciones = {
  numRuns: Number(entorno?.['FC_RUNS'] ?? '300'),
  seed: Number(entorno?.['FC_SEED'] ?? '0'),
};

const hoyArb = fechaArb(FechaLocal.desdePartes(2027, 12, 31));

type Mapa = ReadonlyMap<string, number>;
const asignaciones = (h: Hechos): Mapa =>
  new Map(h.asignaciones.map((a) => [`${a.categoriaId}|${a.periodoInicio}`, a.monto]));

/** Claves cuyo monto difiere entre antes y después (una fila ausente vale 0). */
function cambiadas(a: Mapa, b: Mapa): { clave: string; antes: number; despues: number }[] {
  return [...new Set([...a.keys(), ...b.keys()])]
    .map((clave) => ({ clave, antes: a.get(clave) ?? 0, despues: b.get(clave) ?? 0 }))
    .filter((x) => x.antes !== x.despues);
}

/** Inv. 18, 19, 20, 21 y 24 después de un paso aceptado; un rechazo deja los hechos iguales. */
function comprobar({ comando, antes, resultado, fotoAntes, fotoDespues }: Paso): void {
  // Un rechazo es un resultado válido y no escribe nada (04 §5.3).
  if (!resultado.ok) {
    expect(resultado.rechazos.length).toBeGreaterThan(0);
    expect(fotoDespues).toBe(fotoAntes);
    return;
  }
  const despues = calcular(resultado.hechosNuevos, antes.hoy);
  const dif = cambiadas(asignaciones(antes.hechos), asignaciones(resultado.hechosNuevos));
  const inicioDe = (clave: string) => FechaLocal.desdeTexto(clave.split('|')[1] as string);
  const estado = (clave: string) => estadoDe(periodoDe(antes.ciclo, inicioDe(clave)), antes.hoy);

  // Inv. 18: Asig(c, p) de un período cerrado no cambia, salvo por la fusión (OP-12) y la
  // eliminación de una tarjeta con solo saldo inicial (OP-06).
  if (comando.operacion !== 'OP-12' && comando.operacion !== 'OP-06')
    expect(dif.filter((x) => estado(x.clave) === 'cerrado')).toEqual([]);

  // Inv. 19: una asignación que sube en un período futuro, o un auto-asignar, deja LPA ≥ 0 (si ya
  // era negativo, el auto-asignar no hace nada); una manual en el activo puede dejarlo negativo
  // pero con AV-11.
  if (comando.operacion === 'OP-14' && estado(`|${comando.periodoInicio}`) === 'futuro') {
    const sube = dif.some((x) => x.despues > x.antes);
    if (sube) expect(despues.lpa.total).toBeGreaterThanOrEqual(0);
  }
  if (comando.operacion === 'OP-17') {
    if (antes.lpa.total >= 0) expect(despues.lpa.total).toBeGreaterThanOrEqual(0);
    else expect(dif).toEqual([]);
  }
  if (comando.operacion === 'OP-14' && despues.lpa.total < 0 && antes.lpa.total >= 0)
    expect(estado(`|${comando.periodoInicio}`)).toBe('activo');
  if (
    comando.operacion === 'OP-14' &&
    despues.lpa.total < 0 &&
    dif.some((x) => x.despues > x.antes)
  )
    expect(resultado.avisos.map((a) => a.codigo)).toContain('AV-11');

  // Inv. 20: una categoría archivada (después del paso) no recibe asignaciones positivas nuevas
  // (OP-09 sube la suya para cubrir su sobregiro) ni líneas nuevas.
  const archivadas = new Set<string>(
    resultado.hechosNuevos.categorias.filter((x) => x.archivada).map((x) => x.id),
  );
  if (comando.operacion !== 'OP-09')
    expect(
      dif.filter((x) => x.despues > x.antes && archivadas.has(x.clave.split('|')[0] as string)),
    ).toEqual([]);
  const previas = new Set<string>(antes.hechos.lineas.map((l) => l.id));
  expect(
    resultado.hechosNuevos.lineas.filter(
      (l) => !previas.has(l.id) && l.categoriaId !== null && archivadas.has(l.categoriaId),
    ),
  ).toEqual([]);

  // Inv. 21: ningún período con asignaciones cambia de fechas, tampoco con una vigencia nueva (OP-19).
  const inicios = new Set(antes.hechos.asignaciones.map((a) => a.periodoInicio));
  for (const inicio of inicios)
    expect(periodoDe(despues.ciclo, inicio)).toEqual(periodoDe(antes.ciclo, inicio));

  // Inv. 24: una cuenta archivada tiene saldo cero y una tarjeta con deuda no está archivada.
  const archivada = new Set<string>(
    resultado.hechosNuevos.cuentas.filter((k) => k.archivada).map((k) => k.id),
  );
  for (const k of despues.cuentas) if (archivada.has(k.cuentaId)) expect(k.saldo).toBe(0);
  for (const t of despues.tarjetas) if (t.deuda > 0) expect(archivada.has(t.tarjetaId)).toBe(false);
}

describe('PRU-PROP-MOTOR-107: operacionesArb', () => {
  it('PRU-PROP-MOTOR-107 [INV-18, INV-19, INV-20, INV-21, INV-24] GEN-operaciones: con secuencias de operaciones generadas, después de cada paso aceptado se cumplen inv. 18, 19, 20, 21 y 24, y un rechazo deja los hechos iguales', () => {
    fc.assert(
      fc.property(
        hoyArb.chain((hoy) => fc.tuple(fc.constant(hoy), hechosArb(hoy), operacionesArb())),
        ([hoy, hechos, comandos]) => {
          const sistema = new Sistema(hechos, hoy, comprobar);
          fc.modelRun(() => ({ model: {}, real: sistema }), comandos);
        },
      ),
      opciones,
    );
  });
});
