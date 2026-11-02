// Los CA de FT-19 que son un número del motor o un rechazo con su código (07 §17: nivel INT): OP-09, OP-11 y la condonación hacia
// una archivada, con las operaciones reales contra PostgreSQL como `finn_app` (06 FT-19; 01 §8 ESC-44; 04 §3.2). Cada fila de
// ESC-44 se comprueba con el ejecutor `int` de TA-188; el rechazo de una programada sin decidir corre en un escenario propio.
import { beforeAll, describe, expect, it } from 'vitest';
import '../../db/test/ayudantes/base.ts'; // la conexión de `int` (conexion.ts) viene del arnés de Vitest
import { correr, type Fila } from '../../dominio/escenarios/ejecutar';
import type { Escenario } from '../../dominio/escenarios/tipos';
import { ESCENARIOS } from '../../dominio/escenarios/todos';
import { ejecutorInt } from './escenarios/int.ts';

const TOPE = 120_000;

// Gimnasio con una programada activa y nada más: lo único que falta decidir al archivar es esa programada.
const CON_PROGRAMADA: Escenario = {
  id: 'SEM-CA-19-5',
  titulo: 'Archivar una categoría con una programada activa',
  refs: [],
  hoy: '2027-03-05',
  estadoInicial: [
    { op: 'OP-01', cuenta: 'Ahorro' },
    { op: 'OP-07', categoria: 'Gimnasio' },
    {
      op: 'OP-42',
      etiqueta: 'gimnasio',
      cuenta: 'Ahorro',
      comercio: 'Gimnasio',
      monto: 30,
      categoria: 'Gimnasio',
      primeraFecha: '2027-03-10',
    },
  ],
  pasos: [
    {
      n: '1',
      ops: [{ op: 'OP-09', categoria: 'Gimnasio' }],
      espera: { rechazo: 'programada_sin_decision' },
    },
    {
      n: '2',
      ops: [{ op: 'OP-09', categoria: 'Gimnasio', desactivar: ['gimnasio'] }],
      espera: { disp: {} },
    },
  ],
};

describe('PRU-INT-CATEG', () => {
  let esc44: Fila[] = [];
  let programada: Fila[] = [];
  const fila = (filas: Fila[], paso: string): Fila | undefined =>
    filas.find((f) => f.paso === paso);

  beforeAll(async () => {
    esc44 = await correr('ESC-44', ESCENARIOS, ejecutorInt);
    programada = await correr(
      CON_PROGRAMADA.id,
      new Map([[CON_PROGRAMADA.id, CON_PROGRAMADA]]),
      ejecutorInt,
    );
  }, TOPE * 2);

  it('PRU-INT-CATEG-108 [CA-19.1, ESC-44] archivar Gimnasio con su Disponible a LPA, las futuras devueltas y la programada desactivada deja LPA en $670.00 y Gimnasio sin Disponible', () => {
    expect(fila(esc44, '1')?.fallos).toEqual([]);
  });

  it('PRU-INT-CATEG-112 [CA-19.5] archivar con una programada activa sin decidir se rechaza con programada_sin_decision y, decidida, se archiva', () => {
    expect(fila(programada, '1')?.fallos).toEqual([]);
    expect(fila(programada, '2')?.fallos).toEqual([]);
  });
});
