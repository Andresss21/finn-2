// Registro automático de las programadas (FT-42, 04 §10.2 paso 1) contra PostgreSQL como `finn_app` (TA-415). HOY es
// 2027-02-05 y el período activo empieza el 2027-01-21: el 2027-01-10 está en un período cerrado (PR-3). El detalle de
// OP-43 y de la cuota sin modelo está en PRU-INT-PROG-102; ESC-50 de punta a punta, en PRU-ESC-50@int.
import { beforeAll, describe, expect, it } from 'vitest';
import type { Hechos, Instante, Uuid } from '@finn/dominio';
import { cargarHechos, leer, Memoria } from '@finn/db';
import { consultar, crearBasePrueba } from '../../db/test/ayudantes/base.ts';
import { escribirHechosDePrueba, HOY, RELOJ } from '../../db/test/ayudantes/hechos-prueba.ts';
import { confirmar, type DepsMarco } from '../src/operaciones/marco.ts';
import { OP01, OP04 } from '../src/operaciones/cuentas/index.ts';
import { OP42 } from '../src/operaciones/programadas/index.ts';
import { pasoRegistro } from '../src/tareas/registro-automatico.ts';
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

describe('PRU-INT-PROG registro automático (FT-42)', () => {
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

  it('PRU-INT-PROG-110 [CA-42.1, ESC-50, PR-3, AV-23] la tarea registra la ocurrencia del período abierto y deja pendiente la del cerrado con una notificación', async () => {
    const P = uuid(9301);
    // quincenal desde el 10 ene: 10 ene (período cerrado) y 24 ene (activo); la siguiente, 7 feb, es futura
    await crear(programada(P, { frecuencia: 'quincenal', primeraFecha: '2027-01-10' }));
    expect(await pasoRegistro.ejecutar(tarea())).toEqual({
      cantidad: 1,
      detalle: { registradas: 1, sinRegistrar: 1 },
    });
    expect(await resueltas(P)).toEqual(['2027-01-24']);
    const tx = (await hechos()).transacciones.filter((t) => t.comercio === 'Suscripción');
    expect(tx).toHaveLength(1);
    expect(tx[0]).toMatchObject({ fecha: '2027-01-24', origen: 'programada', total: 100 });
    expect(await claves('ocurrencia_en_periodo_cerrado')).toEqual([
      `ocurrencia_en_periodo_cerrado:${P}:2027-01-10`,
    ]);
  });

  it('PRU-INT-PROG-111 [CA-42.2, ESC-50, INV-15] repetir la tarea el mismo día no cambia nada ni avisa otra vez', async () => {
    const antes = (await hechos()).transacciones.length;
    const avisos = await sql(`SELECT count(*) FROM finn.notificaciones`);
    expect(await pasoRegistro.ejecutar(tarea())).toEqual({
      cantidad: 0,
      detalle: { registradas: 0, sinRegistrar: 1 },
    });
    expect((await hechos()).transacciones).toHaveLength(antes);
    expect(await sql(`SELECT count(*) FROM finn.notificaciones`)).toEqual(avisos);
  });

  it('PRU-INT-PROG-112 [CA-42.3, CB-33, AV-23] con la cuenta archivada la ocurrencia queda pendiente con registro_automatico_fallido y las demás se registran', async () => {
    const ARCH = uuid(9310),
      PA = uuid(9311),
      PB = uuid(9312);
    const alta = { id: ARCH, tipo: 'efectivo', nombre: 'Cuenta vieja', saldo: '0' };
    expect(await confirmar(OP01, alta, deps())).toMatchObject({ ok: true });
    await crear(programada(PA, { cuentaId: ARCH, primeraFecha: '2027-02-01' }));
    await crear(programada(PB, { primeraFecha: '2027-02-02' }));
    expect(await confirmar(OP04, { cuentaId: ARCH }, deps())).toMatchObject({ ok: true });

    const r = await pasoRegistro.ejecutar(tarea());
    expect(r.detalle).toMatchObject({ registradas: 1 });
    expect(await resueltas(PA)).toEqual([]);
    expect(await resueltas(PB)).toEqual(['2027-02-02']);
    expect(await claves('registro_automatico_fallido')).toEqual([
      `registro_automatico_fallido:${PA}:2027-02-01`,
    ]);
  });
});
