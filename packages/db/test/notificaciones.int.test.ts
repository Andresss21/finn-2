// Catálogo de notificaciones y eventos frente al esquema migrado (TA-054, CF-16; 06 §3.13.2, V6-04).
// Los catálogos son los de V6-04 (06-features-verificacion, v6_04_catalogo_notificaciones.sql), copiados a
// mano: la constante MOTIVOS de @finn/aplicacion/push/motivos.ts todavía no existe (TA-185). Inserta como
// finn_app dentro de una transacción que se revierte (06 §3.13.2, paso 4).
import pg from 'pg';
import { describe, expect, it } from 'vitest';
import { crearBasePrueba } from './ayudantes/base.ts';

/** 04 §11.2 + FD-22 + CF-24: motivo y aviso (null = motivo sin aviso del dominio). */
const MOTIVOS: ReadonlyArray<readonly [string, string | null]> = [
  ['sms_nuevo', 'AV-23'],
  ['sms_coincidencia', 'AV-23'],
  ['sms_posible_duplicado', 'AV-23'],
  ['sms_no_reconocido', 'AV-23'],
  ['sms_error', 'AV-23'],
  ['registro_automatico', 'AV-23'],
  ['registro_automatico_fallido', 'AV-23'],
  ['ocurrencia_en_periodo_cerrado', 'AV-23'],
  ['cierre_periodo', null],
  ['meta_vencida', 'AV-17'],
  ['respaldo_atrasado', null],
  ['restauracion_atrasada', null],
  ['deriva_catalogo', null],
  ['tarea_fallida', null],
  ['carga_incremental', null],
  ['cambio_retroactivo', 'AV-01'],
  ['pago_tarjeta_proximo', null],
  ['cuota_proxima', null],
];

/** 04 §15.2: origen, nivel y mensaje. */
const EVENTOS: ReadonlyArray<readonly [string, string, string]> = [
  ['app', 'error', 'INTERNO FN003 OP-20'],
  ['app', 'aviso', 'OCUPADO 55P03 OP-14'],
  ['app', 'info', 'auditoria_formato crear'],
  ['webhook', 'aviso', 'token_invalido'],
  ['webhook', 'aviso', 'cuerpo_invalido'],
  ['webhook', 'error', 'guardar_fallido'],
  ['webhook', 'error', 'procesar_fallido'],
  ['tarea_diaria', 'info', 'puesta_al_dia_inicio'],
  ['tarea_diaria', 'info', 'diaria'],
  ['tarea_diaria', 'info', 'puesta_al_dia'],
  ['tarea_diaria', 'error', 'paso_fallido'],
  ['motor', 'info', 'carga_completa'],
  ['motor', 'info', 'carga_incremental'],
  ['motor', 'aviso', 'memoria_invalidada'],
  ['respaldo', 'info', 'respaldo'],
  ['respaldo', 'info', 'restauracion'],
  ['respaldo', 'error', 'deriva'],
];

/** El SQLSTATE con que falla la sentencia, o `ok`; un punto de guardado aísla cada intento. */
async function intentar(c: pg.Client, sql: string, valores: unknown[]): Promise<string> {
  await c.query('SAVEPOINT intento');
  try {
    await c.query(sql, valores);
    await c.query('RELEASE SAVEPOINT intento');
    return 'ok';
  } catch (e) {
    await c.query('ROLLBACK TO SAVEPOINT intento');
    return (e as { code?: string }).code ?? String(e);
  }
}

const NOTIFICACION =
  'INSERT INTO finn.notificaciones (aviso, motivo, titulo, cuerpo) VALUES ($1, $2, $3, $4)';
const EVENTO =
  'INSERT INTO finn.eventos_sistema (nivel, origen, mensaje) VALUES ($1::finn.nivel_evento, $2, $3)';

describe('PRU-INT-NOTIF', () => {
  const base = crearBasePrueba();
  it('PRU-INT-NOTIF-001 [V6-04, CF-16] las 35 inserciones del catálogo (18 motivos, con aviso nulo, y 17 eventos) entran como finn_app; un aviso AV-1 y un origen inexistente siguen rechazados', async () => {
    const c = new pg.Client({ connectionString: base.url });
    await c.connect();
    try {
      await c.query('BEGIN');
      const resultados: string[] = [];
      for (const [motivo, aviso] of MOTIVOS)
        resultados.push(`${motivo} ${await intentar(c, NOTIFICACION, [aviso, motivo, 't', 'c'])}`);
      for (const [origen, nivel, mensaje] of EVENTOS)
        resultados.push(
          `${origen} ${mensaje} ${await intentar(c, EVENTO, [nivel, origen, mensaje])}`,
        );
      expect(resultados).toHaveLength(35);
      expect(resultados.filter((r) => !r.endsWith(' ok'))).toEqual([]);
      // Controles negativos (06 §3.13.2, paso 5): el CHECK de formato no cambia con CF-16
      expect(await intentar(c, NOTIFICACION, ['AV-1', 'x', 't', 'c'])).toBe('23514');
      expect(await intentar(c, EVENTO, ['info', 'inexistente', 'm'])).toBe('23514');
    } finally {
      await c.query('ROLLBACK');
      await c.end();
    }
  });
});
