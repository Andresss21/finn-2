// Programadas y registro automático contra PostgreSQL como `finn_app` (TA-194; 04 §3.7, §10.2 paso 1, §4.2, §4.3, §4.6;
// 01 §5.7). Cada operación va de punta a punta (previsualizar, confirmar, releer los hechos), repite la entrada con el
// mismo id y prueba un rechazo del dominio con su código y su mensaje. Los hechos de prueba traen la Netflix (PG1, con
// historial) y el pago de la Visa (PG2, inactiva y reactivada el 2027-03-01); HOY es 2027-02-05 y el período activo
// empieza el 2027-01-21, así que el 2027-01-10 está en un período cerrado (PR-3).
import { beforeAll, describe, expect, it } from 'vitest';
import type { Hechos, Instante, Uuid } from '@finn/dominio';
import { cargarHechos, leer, Memoria } from '@finn/db';
import { consultar, crearBasePrueba } from '../../db/test/ayudantes/base.ts';
import { escribirHechosDePrueba, HOY, RELOJ } from '../../db/test/ayudantes/hechos-prueba.ts';
import {
  confirmar,
  previsualizar,
  type DefinicionOperacion,
  type DepsMarco,
} from '../src/operaciones/marco.ts';
import { OP42, OP43, OP44, OP51 } from '../src/operaciones/programadas/index.ts';
import { pasoRegistro } from '../src/tareas/registro-automatico.ts';
import type { DepsTarea } from '../src/tareas/diaria.ts';

const uuid = (n: number): Uuid => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}` as Uuid;
const E1 = uuid(1), // efectivo
  T1 = uuid(3), // Visa
  C1 = uuid(11), // Comida
  PG1 = uuid(17), // Netflix, con historial
  PG2 = uuid(18); // pago de la Visa, inactiva
const INSTANTE = `${HOY}T12:00:00.000Z` as Instante;
const GASTO = uuid(9001),
  CERRADA = uuid(9002),
  MANUAL = uuid(9004),
  OMITIDA = uuid(9005),
  SOBRA = uuid(9006);

const gasto = (id: Uuid, extra: Record<string, unknown>) => ({
  accion: 'crear',
  id,
  tipo: 'gasto',
  cuentaId: E1,
  comercio: 'Gimnasio',
  monto: '10.00',
  frecuencia: 'mensual',
  primeraFecha: '2027-01-22',
  registroAutomatico: false,
  lineas: [{ monto: '10.00', categoriaId: C1 }],
  ...extra,
});
const rechazo = (codigo: string, mensaje: string) => ({
  ok: false,
  error: { categoria: 'DOMINIO', codigo, mensaje },
});

describe('PRU-INT-PROG', () => {
  const base = crearBasePrueba();
  const sql = (texto: string) => consultar(base.urlAdmin, texto);
  const deps = (): DepsMarco => ({
    memoria: new Memoria(),
    opciones: () => RELOJ,
    instante: () => INSTANTE,
  });
  const tarea = (): DepsTarea => ({ ...deps(), nuevoIdError: () => 'E-PRUEBA' });
  const hechos = (): Promise<Hechos> => leer((t) => cargarHechos(t), RELOJ);
  const ejecutar = <E, R, S>(def: DefinicionOperacion<E, R, S>, entrada: unknown) =>
    confirmar(def, entrada, deps());
  const vista = async <E, R, S>(def: DefinicionOperacion<E, R, S>, entrada: unknown) => {
    const v = await previsualizar(def, entrada, deps());
    if (!v.ok) throw new Error('previsualizar falló');
    return v.valor;
  };
  const programada = async (id: Uuid) => (await hechos()).programadas.find((p) => p.id === id);
  const resolucion = async (id: Uuid, fecha: string) =>
    (await hechos()).ocurrencias_resueltas.find(
      (o) => o.programadaId === id && o.fechaEsperada === fecha,
    );
  const notificaciones = (motivo: string) =>
    sql(`SELECT datos->>'clave' FROM finn.notificaciones WHERE motivo = '${motivo}' ORDER BY id`);

  beforeAll(async () => {
    await escribirHechosDePrueba(base);
    process.env['DATABASE_URL'] = base.url; // el cliente del proceso (04 §2.5)
  });

  it('PRU-INT-PROG-102 [ESC-50, INV-15, CB-33, CF-20, V-06] OP-42, OP-43, OP-44, OP-51 y el registro automático: de punta a punta, idempotentes y con sus rechazos', async () => {
    // OP-42 crear: previsualizar no escribe; repetir es ya aplicada y otros datos con el mismo id, conflicto_id
    const auto = gasto(GASTO, {
      registroAutomatico: true,
      monto: '12.00',
      lineas: [{ monto: '12.00', categoriaId: C1 }],
    });
    expect(await vista(OP42, auto)).toMatchObject({ rechazos: [] });
    expect(await programada(GASTO)).toBeUndefined();
    expect(await ejecutar(OP42, auto)).toMatchObject({
      ok: true,
      valor: { id: GASTO },
      yaAplicada: false,
    });
    expect(await programada(GASTO)).toMatchObject({
      comercio: 'Gimnasio',
      monto: 1200,
      activa: true,
      reactivadaDesde: null,
    });
    expect(await ejecutar(OP42, auto)).toMatchObject({ ok: true, yaAplicada: true });
    expect(await ejecutar(OP42, { ...auto, comercio: 'Otro' })).toMatchObject({
      ok: false,
      error: { categoria: 'CONFLICTO', codigo: 'conflicto_id' },
    });
    // una forma que no corresponde al tipo es VALIDACION; el calendario con historial lo rechaza el dominio
    expect(await ejecutar(OP42, gasto(uuid(9010), { cuentaDestinoId: T1 }))).toMatchObject({
      ok: false,
      error: { categoria: 'VALIDACION' },
    });
    expect(
      await ejecutar(OP42, {
        accion: 'editar',
        programadaId: PG1,
        primeraFecha: '2027-01-26',
        esperado: { primeraFecha: '2027-01-25' },
      }),
    ).toMatchObject(
      rechazo(
        'calendario_con_historial',
        'Esta programada ya tiene pagos registrados. Terminala y creá otra con el calendario nuevo.',
      ),
    );

    // OP-42 editar: valor absoluto. Repetirla es ya aplicada; con lo visto viejo, conflicto_desactualizado con lo actual
    const edicion = {
      accion: 'editar',
      programadaId: GASTO,
      monto: '15.00',
      lineas: [{ monto: '15.00', categoriaId: C1 }],
      esperado: { monto: '12.00', lineas: [{ monto: '12.00', categoriaId: C1 }] },
    };
    expect(await ejecutar(OP42, edicion)).toMatchObject({ ok: true, yaAplicada: false });
    expect(await programada(GASTO)).toMatchObject({ monto: 1500 });
    expect(
      (await hechos()).programada_lineas.filter((l) => l.programadaId === GASTO),
    ).toMatchObject([{ monto: 1500, orden: 1 }]);
    expect(await ejecutar(OP42, edicion)).toMatchObject({ ok: true, yaAplicada: true });
    expect(
      await ejecutar(OP42, {
        ...edicion,
        monto: '16.00',
        lineas: [{ monto: '16.00', categoriaId: C1 }],
      }),
    ).toMatchObject({
      ok: false,
      error: {
        categoria: 'CONFLICTO',
        codigo: 'conflicto_desactualizado',
        datos: { actuales: { monto: 1500 } },
      },
    });

    // OP-42 activar: reactivar fija `reactivada_desde` = hoy; desactivar no la toca; repetir es ya aplicada
    expect(
      await ejecutar(OP42, { accion: 'activar', programadaId: PG2, activa: true }),
    ).toMatchObject({ ok: true, yaAplicada: false });
    expect(await programada(PG2)).toMatchObject({ activa: true, reactivadaDesde: HOY });
    expect(
      await ejecutar(OP42, { accion: 'activar', programadaId: PG2, activa: true }),
    ).toMatchObject({ ok: true, yaAplicada: true });
    expect(
      await ejecutar(OP42, { accion: 'activar', programadaId: PG2, activa: false }),
    ).toMatchObject({ ok: true, yaAplicada: false });
    expect(await programada(PG2)).toMatchObject({ activa: false, reactivadaDesde: HOY });

    // Registro automático (paso 1): el 2027-01-22 se registra con su fecha esperada; el 2027-01-10 es de un período
    // cerrado y queda pendiente con una notificación; repetir la tarea no cambia nada
    expect(
      await ejecutar(
        OP42,
        gasto(CERRADA, { registroAutomatico: true, primeraFecha: '2027-01-10' }),
      ),
    ).toMatchObject({ ok: true });
    expect(await pasoRegistro.ejecutar(tarea())).toEqual({
      cantidad: 1,
      detalle: { registradas: 1, sinRegistrar: 1 },
    });
    const registrada = await resolucion(GASTO, '2027-01-22');
    expect(registrada).toMatchObject({ estado: 'registrada' });
    const hecha = (await hechos()).transacciones.find((t) => t.id === registrada?.transaccionId);
    expect(hecha).toMatchObject({ fecha: '2027-01-22', origen: 'programada', total: 1500 });
    expect(await resolucion(CERRADA, '2027-01-10')).toBeUndefined();
    const antes = (await hechos()).transacciones.length;
    expect(await pasoRegistro.ejecutar(tarea())).toEqual({
      cantidad: 0,
      detalle: { registradas: 0, sinRegistrar: 1 },
    });
    expect((await hechos()).transacciones).toHaveLength(antes);
    expect(await notificaciones('ocurrencia_en_periodo_cerrado')).toEqual([
      `ocurrencia_en_periodo_cerrado:${CERRADA}:2027-01-10`,
    ]);
    expect(await notificaciones('registro_automatico')).toEqual([
      `registro_automatico:${GASTO}:2027-01-22`,
    ]);

    // OP-43 de un toque: previsualizar no escribe; la fecha de la transacción es la esperada; repetir con el mismo id
    // es ya aplicada y con otro id, ocurrencia_ya_resuelta; una fecha que no es ocurrencia, ocurrencia_no_valida
    expect(
      await ejecutar(
        OP42,
        gasto(MANUAL, {
          primeraFecha: '2027-01-23',
          monto: '7.00',
          lineas: [{ monto: '7.00', categoriaId: C1 }],
        }),
      ),
    ).toMatchObject({ ok: true });
    const uno = { id: uuid(9100), programadaId: MANUAL, fechaEsperada: '2027-01-23' };
    expect(await vista(OP43, uno)).toMatchObject({ rechazos: [] });
    expect(await resolucion(MANUAL, '2027-01-23')).toBeUndefined();
    expect(await ejecutar(OP43, uno)).toMatchObject({
      ok: true,
      valor: { id: uno.id },
      yaAplicada: false,
    });
    expect(await resolucion(MANUAL, '2027-01-23')).toMatchObject({
      estado: 'registrada',
      transaccionId: uno.id,
    });
    expect((await hechos()).transacciones.find((t) => t.id === uno.id)).toMatchObject({
      fecha: '2027-01-23',
      origen: 'programada',
      total: 700,
    });
    expect(await ejecutar(OP43, uno)).toMatchObject({ ok: true, yaAplicada: true });
    expect(await ejecutar(OP43, { ...uno, id: uuid(9101) })).toMatchObject(
      rechazo('ocurrencia_ya_resuelta', 'Ese pago programado ya está registrado.'),
    );
    expect(
      await ejecutar(OP43, { ...uno, id: uuid(9102), fechaEsperada: '2027-01-24' }),
    ).toMatchObject(rechazo('ocurrencia_no_valida', 'Esa fecha no corresponde a la programada.'));

    // OP-44: la ocurrencia queda omitida sin transacción; repetirla es ya aplicada; después no se registra
    expect(await ejecutar(OP42, gasto(OMITIDA, { primeraFecha: '2027-01-24' }))).toMatchObject({
      ok: true,
    });
    const omitir = { programadaId: OMITIDA, fechaEsperada: '2027-01-24' };
    expect(await ejecutar(OP44, omitir)).toMatchObject({ ok: true, yaAplicada: false });
    expect(await resolucion(OMITIDA, '2027-01-24')).toMatchObject({
      estado: 'omitida',
      transaccionId: null,
    });
    expect(await ejecutar(OP44, omitir)).toMatchObject({ ok: true, yaAplicada: true });
    expect(await ejecutar(OP43, { id: uuid(9103), ...omitir })).toMatchObject(
      rechazo('ocurrencia_ya_resuelta', 'Ese pago programado ya está registrado.'),
    );

    // OP-51: elimina una sin historial; repetirla es ya aplicada; una desconocida, NO_ENCONTRADO; con historial se rechaza
    expect(await ejecutar(OP42, gasto(SOBRA, {}))).toMatchObject({ ok: true });
    expect(await ejecutar(OP51, { programadaId: SOBRA })).toMatchObject({
      ok: true,
      yaAplicada: false,
    });
    expect(await programada(SOBRA)).toBeUndefined();
    expect(await ejecutar(OP51, { programadaId: SOBRA })).toMatchObject({
      ok: true,
      yaAplicada: true,
    });
    expect(await ejecutar(OP51, { programadaId: uuid(9999) })).toMatchObject({
      ok: false,
      error: { categoria: 'NO_ENCONTRADO' },
    });
    expect(await ejecutar(OP51, { programadaId: PG1 })).toMatchObject(
      rechazo('programada_con_historial', 'Esta programada tiene historial. Podés desactivarla.'),
    );
  });
});
