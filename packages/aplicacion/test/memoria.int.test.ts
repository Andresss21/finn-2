// Memoria por instancia (TA-154; 04 §5.3, BE-22; V-16): después de cada operación aceptada, la memoria de la instancia
// que escribe es igual a una carga nueva desde la base. Las operaciones salen de `operacionesArb` (07 §12.5), se
// escriben con `escribir()` y la memoria se actualiza solo con lo que devolvió la base. Vive en @finn/aplicacion
// porque necesita `calcular` y `operacionesArb` de @finn/dominio además de @finn/db [CH-28].
import fc from 'fast-check';
import { beforeAll, describe, expect, it } from 'vitest';
import { calcular, type Hechos, type Instantanea, type Uuid } from '@finn/dominio';
import { FechaLocal } from '@finn/dominio/valores';
import { Sistema, operacionesArb } from '@finn/dominio/pruebas';
import { cargarHechos, escribir, leer, Memoria } from '@finn/db';
import { crearBasePrueba } from '../../db/test/ayudantes/base.ts';
import { HOY, RELOJ } from '../../db/test/ayudantes/hechos-prueba.ts';

// Pocos casos en la corrida normal; FC_RUNS (10.000 en el nocturno) los sube
const CASOS = Number(process.env['FC_RUNS'] ?? '4');

/** Las filas de cada tabla ordenadas por clave: la carga no fija un orden (inv. 26) y la memoria conserva el del dominio. */
function canonicos(hechos: Hechos): Record<string, unknown[]> {
  const clave = (f: object): string =>
    String((f as Record<string, unknown>)['id'] ?? (f as Record<string, unknown>)['cuentaId']);
  return Object.fromEntries(
    Object.entries(hechos).map(([t, filas]) => [
      t,
      [...(filas as object[])].sort((a, b) => clave(a).localeCompare(clave(b))),
    ]),
  );
}

/** `Sistema` cuyos ids no chocan entre corridas: todas comparten la misma base. */
class SistemaDeCorrida extends Sistema {
  #n = 0;
  constructor(
    hechos: Hechos,
    hoy: FechaLocal,
    private readonly corrida: number,
  ) {
    super(hechos, hoy);
  }
  override ids() {
    const c = String(this.corrida).padStart(4, '0');
    return {
      siguiente: () => `ffffffff-${c}-4000-8000-${String(++this.#n).padStart(12, '0')}` as Uuid,
    };
  }
}

describe('PRU-INT-MOTOR', () => {
  const base = crearBasePrueba();
  beforeAll(() => {
    process.env['DATABASE_URL'] = base.url; // el cliente del proceso (04 §2.5)
  });

  const cargaNueva = (): Promise<{ revision: string; hechos: Hechos }> =>
    leer(async (t) => ({ revision: t.estado.revision, hechos: await cargarHechos(t) }), RELOJ);

  it('PRU-INT-MOTOR-001 [V-16] después de cada operación, la memoria de la instancia que escribe es igual a una carga nueva', async () => {
    const hoy = FechaLocal.desdeTexto(HOY);
    let corrida = 0;
    let escrituras = 0;
    await fc.assert(
      fc.asyncProperty(operacionesArb(), async (comandos) => {
        const memoria = new Memoria<Instantanea>();
        const inicial = await cargaNueva();
        const cargado = await memoria.hechos(inicial.revision, () =>
          Promise.resolve(inicial.hechos),
        );
        const sistema = new SistemaDeCorrida(cargado, hoy, ++corrida);
        for (const comando of comandos) {
          const antes = sistema.pasos.length;
          comando.run({}, sistema);
          for (const paso of sistema.pasos.slice(antes)) {
            if (!paso.resultado.ok) continue; // un rechazo no escribe y deja los hechos como estaban
            const { cambios, hechosNuevos, operacionDeclarada } = paso.resultado;
            const escrito = await escribir(async (tx) => {
              if (operacionDeclarada) await tx.declararOperacion(operacionDeclarada);
              const valores = await tx.aplicarCambios(cambios);
              return { valores, revision: await tx.revisionActual() };
            }, RELOJ);
            escrituras++;
            const apta = memoria.registrarEscritura(
              escrito.revision,
              hechosNuevos,
              escrito.valores,
            );
            expect(apta, 'la base completó todos los valores (BE-32)').toBe(true);
            const nueva = await cargaNueva();
            expect(memoria.revision).toBe(nueva.revision);
            // la instancia que escribió no recarga: lee su memoria
            const enMemoria = await memoria.hechos(escrito.revision, () => {
              throw new Error('la memoria debía tener la revisión');
            });
            expect(canonicos(enMemoria)).toEqual(canonicos(nueva.hechos));
            expect(
              memoria.instantanea(escrito.revision, HOY, () => calcular(enMemoria, hoy)),
            ).toEqual(calcular(nueva.hechos, hoy));
            sistema.hechos = enMemoria; // el sistema sigue con lo que tiene la memoria
          }
        }
      }),
      {
        numRuns: CASOS,
        ...(process.env['FC_SEED'] ? { seed: Number(process.env['FC_SEED']) } : {}),
      },
    );
    expect(escrituras).toBeGreaterThan(0);
  }, 600_000);

  it('PRU-INT-MOTOR-001 [V-16] la memoria se vacía ante la duda (fila pendiente, revisión menor), carga una sola vez y guarda dos instantáneas', async () => {
    const m = new Memoria<number>();
    const { revision, hechos } = await cargaNueva();
    let cargas = 0;
    const cargar = (): Promise<Hechos> => (cargas++, Promise.resolve(hechos));
    await Promise.all([m.hechos(revision, cargar), m.hechos(revision, cargar)]);
    expect(cargas).toBe(1);
    expect(await m.hechos(revision, cargar)).toBe(hechos);
    // una revisión menor que la memorizada vacía y recarga
    await m.hechos('0', cargar);
    expect(cargas).toBe(2);
    // una fila nueva sin valores de la base queda pendiente: vacía
    const pendiente = {
      ...hechos,
      vigencias_ciclo: [
        ...hechos.vigencias_ciclo,
        { ...(hechos.vigencias_ciclo[0] as object), id: 'x' as Uuid, revision: null },
      ],
    } as unknown as Hechos;
    expect(m.registrarEscritura('9', pendiente, [])).toBe(false);
    expect(m.revision).toBeNull();
    // dos instantáneas por (revisión, hoy)
    const m2 = new Memoria<number>();
    let n = 0;
    for (const h of ['a', 'b', 'a', 'c', 'a']) m2.instantanea('1', h, () => ++n);
    expect(n).toBe(4);
  });
});
