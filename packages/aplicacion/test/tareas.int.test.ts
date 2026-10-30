// Tarea diaria (el detalle de los pasos 3 y 4, en PRU-INT-NOTIF-102) y puesta al día (TA-186; 04 §10.1 a §10.3; BE-50, BE-52, EN-1, EN-2) contra
// PostgreSQL como `finn_app`. Sin `sleep` ni reloj de pared (07 §7.1): la edad de cada fila se fija con `now() − intervalo`
// al sembrarla y el paso del tiempo es el `desfaseMs` de `finn.ahora()` (CT-02); `ms` sale de un cronómetro inyectado.
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { escribirSms, guardarSms, Memoria, type OpcionesTx } from '@finn/db';
import { consultar, crearBasePrueba } from '../../db/test/ayudantes/base.ts';
import { escribirHechosDePrueba, HOY } from '../../db/test/ayudantes/hechos-prueba.ts';
import {
  ejecutarDiaria,
  pasoMetricas,
  pasoPurgas,
  type DepsTarea,
  type PasoTarea,
} from '../src/tareas/diaria.ts';
import { ponerAlDia } from '../src/tareas/puesta-al-dia.ts';

const MIN = 60_000;
const reloj = (minutos: number): OpcionesTx => ({ reloj: { hoy: HOY, desfaseMs: minutos * MIN } });
const RECONOCIDO =
  'VISA 1234: has realizado una compra por USD 12.30 en el comercio SUPER SELECTOS 2027/02/04';

/** El `datos` de una fila `nivel|origen|datos` de `eventos()`. */
const datosDe = (fila: string | undefined): Record<string, unknown> =>
  JSON.parse((fila ?? '').split('|').slice(2).join('|')) as Record<string, unknown>;

describe('PRU-INT-PROG', () => {
  const base = crearBasePrueba();
  const sql = (texto: string) => consultar(base.urlAdmin, texto);
  const cuenta = async (texto: string): Promise<number> => Number((await sql(texto))[0]);

  /** Dependencias con el reloj `minutos` adelantado y un cronómetro que avanza 5 ms por lectura. */
  const deps = (minutos = 0, extra: Partial<DepsTarea> = {}): DepsTarea => {
    let t = 0;
    return {
      memoria: new Memoria(),
      opciones: () => reloj(minutos),
      cronometro: () => (t += 5),
      nuevaEjecucion: () => 'EJ-1',
      nuevoIdError: () => 'E-PRUEBA',
      ...extra,
    };
  };
  const eventos = (mensaje: string) =>
    sql(
      `SELECT nivel || '|' || origen || '|' || coalesce(datos::text, '') FROM finn.eventos_sistema
        WHERE mensaje = '${mensaje}' ORDER BY id`,
    );

  beforeAll(async () => {
    await escribirHechosDePrueba(base);
    process.env['DATABASE_URL'] = base.url; // el cliente del proceso (04 §2.5)
  });
  beforeEach(async () => {
    // Cada caso parte sin eventos, avisos, suscripciones ni eliminaciones (el orden de los casos es aleatorio, 07 §7.1)
    await sql(
      'DELETE FROM finn.eventos_sistema; DELETE FROM finn.notificaciones; DELETE FROM finn.suscripciones_push; DELETE FROM finn.eliminaciones',
    );
  });

  it('PRU-INT-PROG-101 10.2 pasos 1 a 7, en orden: la tarea diaria corre dos veces el mismo día sin efectos nuevos; procesa los SMS sin resultado y registra un evento diaria con sus pasos', async () => {
    for (const texto of ['hola', RECONOCIDO])
      await escribirSms((tx) => guardarSms(tx, { texto, remitente: 'BAC' }), reloj(0));
    const total = () =>
      sql(
        `SELECT (SELECT count(*) FROM finn.sms_procesamientos) || '|' || (SELECT count(*) FROM finn.movimientos)
           || '|' || (SELECT count(*) FROM finn.notificaciones)`,
      );
    const antes = await total();

    // 10 minutos después: ambos llevan más de 2 minutos sin resultado (8.6)
    const primera = await ejecutarDiaria(deps(10));
    expect(primera.hoy).toBe(HOY);
    expect(
      primera.pasos.map(({ paso, resultado, cantidad, ms }) => ({ paso, resultado, cantidad, ms })),
    ).toEqual([
      { paso: 1, resultado: 'ok', cantidad: 0, ms: 5 },
      { paso: 2, resultado: 'ok', cantidad: 2, ms: 5 },
      { paso: 3, resultado: 'ok', cantidad: 0, ms: 5 },
      { paso: 4, resultado: 'ok', cantidad: 0, ms: 5 },
      { paso: 5, resultado: 'ok', cantidad: 0, ms: 5 },
      { paso: 6, resultado: 'ok', cantidad: 0, ms: 5 },
    ]);
    expect(await sql('SELECT count(*) FROM finn.sms_procesamientos WHERE intento = 1')).toEqual([
      '2',
    ]);
    const despues = await total();
    expect(despues).not.toEqual(antes);

    // La segunda vez no hay nada nuevo que hacer: los mismos intentos, movimientos y avisos
    const segunda = await ejecutarDiaria(deps(10));
    expect(segunda.pasos.map((p) => [p.paso, p.resultado, p.cantidad])).toEqual([
      [1, 'ok', 0],
      [2, 'ok', 0],
      [3, 'ok', 0],
      [4, 'ok', 0],
      [5, 'ok', 0],
      [6, 'ok', 0],
    ]);
    expect(await total()).toEqual(despues);

    // Paso 7: un evento `diaria` por ejecución con `{ hoy, pasos: { paso, resultado, cantidad, ms }[] }`
    const registros = await eventos('diaria');
    expect(registros).toHaveLength(2);
    expect(datosDe(registros[0])).toEqual({
      hoy: HOY,
      pasos: [
        { paso: 1, resultado: 'ok', cantidad: 0, ms: 5 },
        { paso: 2, resultado: 'ok', cantidad: 2, ms: 5 },
        { paso: 3, resultado: 'ok', cantidad: 0, ms: 5 },
        { paso: 4, resultado: 'ok', cantidad: 0, ms: 5 },
        { paso: 5, resultado: 'ok', cantidad: 0, ms: 5 },
        { paso: 6, resultado: 'ok', cantidad: 0, ms: 5 },
      ],
    });
    expect(registros[0]).toMatch(/^info\|tarea_diaria\|/);
    expect(await eventos('paso_fallido')).toEqual([]);
  });

  it('PRU-INT-PROG-101 10.3: un paso que falla no detiene a los demás; deja paso_fallido sin el texto original y un solo aviso tarea_fallida por día', async () => {
    await sql(
      `INSERT INTO finn.suscripciones_push (endpoint, clave_p256dh, clave_auth, renovada_en)
       VALUES ('https://push.example/a', 'k', 'a', now() - interval '61 days')`,
    );
    const roto: PasoTarea = {
      n: 2,
      ejecutar: () => Promise.reject(new Error('falló la fila 123 de "Ana"')),
    };
    const r = await ejecutarDiaria(deps(), [roto, pasoPurgas, pasoMetricas]);
    expect(r.pasos.map((p) => [p.paso, p.resultado])).toEqual([
      [2, 'error'],
      [5, 'ok'],
      [6, 'ok'],
    ]);
    // Los pasos siguientes sí corrieron: la suscripción vieja se purgó
    expect(await cuenta('SELECT count(*) FROM finn.suscripciones_push')).toBe(0);

    const [fallo] = await eventos('paso_fallido');
    expect(fallo).toMatch(/^error\|tarea_diaria\|/);
    expect(datosDe(fallo)).toEqual({
      paso: 2,
      idError: 'E-PRUEBA',
      mensajeSaneado: 'falló la fila # de #', // 7.8: números y textos entre comillas fuera
    });
    const [diaria] = await eventos('diaria');
    expect((datosDe(diaria)['pasos'] as unknown[])[0]).toEqual({
      paso: 2,
      resultado: 'error',
      cantidad: 0,
      ms: 5,
    });

    // 10.3: el aviso va una vez por día, aunque la tarea vuelva a fallar
    await ejecutarDiaria(deps(), [roto]);
    expect(await sql(`SELECT motivo || '|' || datos::text FROM finn.notificaciones`)).toEqual([
      `tarea_fallida|{"clave": "tarea_fallida:${HOY}", "destino": {"pantalla": "diagnostico"}}`,
    ]);
  });

  it('PRU-INT-PROG-101 10.2 paso 5: la purga respeta los plazos de eliminaciones (30 días), eventos (90, salvo auditoria_formato), notificaciones (180) y suscripciones (60), y sube revision_minima_incremental', async () => {
    const evento = (mensaje: string, dias: number, datos: string) =>
      `INSERT INTO finn.eventos_sistema (ocurrido_en, nivel, origen, mensaje, datos)
       VALUES (now() - interval '${dias} days', 'info', 'app', '${mensaje}', ${datos})`;
    const notificacion = (titulo: string, dias: number) =>
      `INSERT INTO finn.notificaciones (creada_en, motivo, titulo, cuerpo)
       VALUES (now() - interval '${dias} days', 'sms_nuevo', '${titulo}', 'c')`;
    const suscripcion = (n: number, dias: number) =>
      `INSERT INTO finn.suscripciones_push (endpoint, clave_p256dh, clave_auth, renovada_en)
       VALUES ('https://push.example/${n}', 'k', 'a', now() - interval '${dias} days')`;
    const eliminacion = (n: number, revision: number, dias: number) =>
      `INSERT INTO finn.eliminaciones (tabla, fila_id, revision, eliminada_en)
       VALUES ('categorias', '00000000-0000-4000-8000-0000000000${n}', ${revision}, now() - interval '${dias} days')`;
    await sql(
      [
        evento('viejo', 91, 'NULL'),
        evento('auditoria_formato crear', 91, `'{"tipo": "auditoria_formato"}'`),
        evento('otro', 91, `'{"tipo": "auditoria_formato"}'`), // EN-1 mira datos.tipo, no el mensaje
        evento('reciente', 89, 'NULL'),
        notificacion('vieja', 181),
        notificacion('reciente', 179),
        suscripcion(1, 61),
        suscripcion(2, 59),
        eliminacion(10, 5, 31),
        eliminacion(11, 7, 31),
        eliminacion(12, 9, 29),
        `UPDATE finn.revision SET revision_minima_incremental = 0 WHERE id = 1`,
      ].join(';\n'),
    );

    const r = await ejecutarDiaria(deps(), [pasoPurgas]);
    const [purga] = r.pasos;
    expect(purga).toMatchObject({ paso: 5, resultado: 'ok', cantidad: 2 + 1 + 1 + 1 });
    expect(purga?.detalle).toEqual({
      eliminaciones: 2,
      eventos: 1,
      notificaciones: 1,
      suscripciones: 1,
    });

    expect(
      await sql(
        `SELECT mensaje FROM finn.eventos_sistema WHERE mensaje <> 'diaria' ORDER BY mensaje`,
      ),
    ).toEqual(['auditoria_formato crear', 'otro', 'reciente']);
    expect(await sql('SELECT titulo FROM finn.notificaciones')).toEqual(['reciente']);
    expect(await sql('SELECT endpoint FROM finn.suscripciones_push')).toEqual([
      'https://push.example/2',
    ]);
    // EN-2: queda la de 29 días y la revisión mínima pasa a la máxima purgada + 1
    expect(await sql('SELECT revision FROM finn.eliminaciones')).toEqual(['9']);
    expect(await sql('SELECT revision_minima_incremental FROM finn.revision WHERE id = 1')).toEqual(
      ['8'],
    );

    // Idempotente (10.3): una segunda pasada no borra nada ni baja el valor
    const otra = await ejecutarDiaria(deps(), [pasoPurgas]);
    expect(otra.pasos[0]).toMatchObject({ resultado: 'ok', cantidad: 0 });
    expect(await sql('SELECT revision_minima_incremental FROM finn.revision WHERE id = 1')).toEqual(
      ['8'],
    );
  });

  it('PRU-INT-PROG-101 10.2 paso 6: las métricas proyectan el egreso del mes con los bytes de 7 días y dan el p95 de las cargas completas', async () => {
    const carga = (dias: number, bytes: number, ms: number) =>
      `INSERT INTO finn.eventos_sistema (ocurrido_en, nivel, origen, mensaje, datos)
       VALUES (now() - interval '${dias} days', 'info', 'motor', 'carga_completa', '{"bytes": ${bytes}, "ms": ${ms}}')`;
    await sql(
      [carga(0, 1000, 100), carga(0, 1000, 200), carga(1, 1000, 300), carga(8, 9999, 900)].join(
        ';\n',
      ),
    );
    const r = await ejecutarDiaria(deps(), [pasoMetricas]);
    // 3.000 bytes × 30 / 7 (la de 8 días queda fuera); el p95 de {100, 200} es 200 y el de {300}, 300
    expect(r.pasos[0]).toMatchObject({
      paso: 6,
      cantidad: 3,
      detalle: { egresoProyectadoBytes: 12857, p95Maximo: 300 },
    });
  });

  it('PRU-INT-PROG-101 10.1: la puesta al día corre los pasos con inicio y fin de la misma ejecución; no se lanza si hay una de hoy terminada, ni con un inicio de menos de 5 minutos', async () => {
    // 1. Sin eventos de hoy: corre, con el inicio antes y el fin después, con la misma `ejecucion`: los pasos 1 y 2 y el aviso de cuota del paso 4 (10.1, CF-24)
    const primera = await ponerAlDia(deps(10));
    expect(primera).toMatchObject({ ejecutada: true });
    expect(primera.pasos.map((p) => p.paso)).toEqual([1, 2, 4]);
    const [inicio] = await eventos('puesta_al_dia_inicio');
    expect(datosDe(inicio)).toEqual({ hoy: HOY, ejecucion: 'EJ-1' });
    const [fin] = await eventos('puesta_al_dia');
    expect(datosDe(fin)).toMatchObject({ hoy: HOY, ejecucion: 'EJ-1' });

    // 2. Con el evento de fin de hoy no corre, pase el tiempo que pase
    expect(await ponerAlDia(deps(600))).toEqual({ ejecutada: false, pasos: [] });
    expect(await eventos('puesta_al_dia_inicio')).toHaveLength(1);

    // 3. También cuenta el fin de la tarea diaria
    await sql(`DELETE FROM finn.eventos_sistema`);
    await ejecutarDiaria(deps());
    expect((await ponerAlDia(deps(600))).ejecutada).toBe(false);

    // 4. Un inicio sin fin: a 2 minutos sigue en curso (no corre); a 6 se considera interrumpida y corre de nuevo
    await sql(
      `DELETE FROM finn.eventos_sistema;
       INSERT INTO finn.eventos_sistema (nivel, origen, mensaje, datos)
       VALUES ('info', 'tarea_diaria', 'puesta_al_dia_inicio', '{"hoy": "${HOY}", "ejecucion": "EJ-0"}')`,
    );
    expect((await ponerAlDia(deps(2))).ejecutada).toBe(false);
    expect(await eventos('puesta_al_dia_inicio')).toHaveLength(1);
    const reintento = await ponerAlDia(deps(6));
    expect(reintento.ejecutada).toBe(true);
    expect(await eventos('puesta_al_dia_inicio')).toHaveLength(2);
    expect(await eventos('puesta_al_dia')).toHaveLength(1);

    // 5. Un inicio de otro día no cuenta
    await sql(
      `DELETE FROM finn.eventos_sistema;
       INSERT INTO finn.eventos_sistema (nivel, origen, mensaje, datos)
       VALUES ('info', 'tarea_diaria', 'diaria', '{"hoy": "2027-02-04", "pasos": []}')`,
    );
    expect((await ponerAlDia(deps())).ejecutada).toBe(true);
  });
});
