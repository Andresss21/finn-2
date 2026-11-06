// Tope por ejecución del registro automático (FT-42, CA-42.4; 04 §10.2 paso 1) contra PostgreSQL como `finn_app` (TA-415). HOY es
// 2027-02-05 y el período activo empieza el 2027-01-21: el 2027-01-10 está en un período cerrado (PR-3). El detalle de
// OP-43 y de la cuota sin modelo está en PRU-INT-PROG-102; ESC-50 de punta a punta, en PRU-ESC-50@int.
import { beforeAll, describe, expect, it } from 'vitest';
import type { Hechos, Instante, Uuid } from '@finn/dominio';
import { cargarHechos, leer, Memoria } from '@finn/db';
import { consultar, crearBasePrueba } from '../../db/test/ayudantes/base.ts';
import { escribirHechosDePrueba, HOY, RELOJ } from '../../db/test/ayudantes/hechos-prueba.ts';
import { confirmar, type DepsMarco } from '../src/operaciones/marco.ts';
import { OP42 } from '../src/operaciones/programadas/index.ts';
import { LIMITE_REGISTRO, pasoRegistro } from '../src/tareas/registro-automatico.ts';
import type { DepsTarea } from '../src/tareas/diaria.ts';

const uuid = (n: number): Uuid => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}` as Uuid;
const E1 = uuid(1), // efectivo
  C1 = uuid(11); // Comida
const INSTANTE = `${HOY}T12:00:00.000Z` as Instante;

const programada = (id: Uuid, extra: Record<string, unknown>) => ({
  accion: 'crear',
  id,
  tipo: 'gasto',
  cuentaId: E1,
  comercio: 'Suscripción',
  monto: '1.00',
  frecuencia: 'mensual',
  primeraFecha: '2027-01-25',
  registroAutomatico: true,
  lineas: [{ monto: '1.00', categoriaId: C1 }],
  ...extra,
});

describe('PRU-INT-PROG registro automático, tope por ejecución (FT-42)', () => {
  const base = crearBasePrueba();
  const sql = (texto: string) => consultar(base.urlAdmin, texto);
  const deps = (): DepsMarco => ({
    memoria: new Memoria(),
    opciones: () => RELOJ,
    instante: () => INSTANTE,
  });
  const tarea = (): DepsTarea => ({ ...deps(), nuevoIdError: () => 'E-PRUEBA' });
  const hechos = (): Promise<Hechos> => leer((t) => cargarHechos(t), RELOJ);
  const crear = async (def: unknown) =>
    expect(await confirmar(OP42, def, deps())).toMatchObject({ ok: true });
  const resueltas = async (id: Uuid) =>
    (await hechos()).ocurrencias_resueltas
      .filter((o) => o.programadaId === id)
      .map((o) => o.fechaEsperada)
      .sort();
  const claves = (motivo: string) =>
    sql(`SELECT datos->>'clave' FROM finn.notificaciones WHERE motivo = '${motivo}' ORDER BY id`);

  beforeAll(async () => {
    await escribirHechosDePrueba(base);
    process.env['DATABASE_URL'] = base.url; // el cliente del proceso (04 §2.5)
  });

  it('PRU-INT-PROG-113 [CA-42.4] con 250 ocurrencias pendientes registra 200 y el resto en la siguiente ejecución', async () => {
    // 15 programadas diarias desde el 21 ene (16 ocurrencias cada una) y una desde el 27 ene (10): 250 en el período activo
    const ids = Array.from({ length: 16 }, (_, i) => uuid(9400 + i));
    for (const [i, id] of ids.entries())
      await crear(
        programada(id, {
          frecuencia: 'cada_n_dias',
          frecuenciaDias: 1,
          primeraFecha: i < 15 ? '2027-01-21' : '2027-01-27',
          comercio: `Diaria ${i}`,
        }),
      );
    const contar = async () => {
      let n = 0;
      for (const id of ids) n += (await resueltas(id)).length;
      return n;
    };
    expect(LIMITE_REGISTRO).toBe(200);
    expect(await pasoRegistro.ejecutar(tarea())).toMatchObject({ cantidad: 200 });
    expect(await contar()).toBe(200);
    expect(await pasoRegistro.ejecutar(tarea())).toMatchObject({ cantidad: 50 });
    expect(await contar()).toBe(250);
    expect(await pasoRegistro.ejecutar(tarea())).toMatchObject({ cantidad: 0 });
  }, 240_000);
});
