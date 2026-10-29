// Catálogo de motivos, registro y OPT-04 contra PostgreSQL como `finn_app` (TA-185; 04 §3.10, §11.1, §11.2, §11.4;
// 06 §3.13.2; CF-16, BE-38). La prueba de catálogo se genera desde `MOTIVOS`: un motivo nuevo entra sin tocarla.
import { beforeAll, describe, expect, it } from 'vitest';
import {
  contarNoLeidas,
  crearNotificacion,
  escribir,
  leer,
  noLeidasDeAviso,
  notificacionesRecientes,
  sqlstateDe,
} from '@finn/db';
import { crearBasePrueba } from '../../db/test/ayudantes/base.ts';
import { RELOJ } from '../../db/test/ayudantes/hechos-prueba.ts';
import { MOTIVOS, esMotivo, type MotivoNotificacion } from '../src/push/motivos.ts';
import { registrarCambioRetroactivo, registrarNotificacion } from '../src/push/registro.ts';
import { marcarNotificacionesLeidas } from '../src/operaciones/notificaciones/index.ts';

const motivos: MotivoNotificacion[] = Object.keys(MOTIVOS).filter(esMotivo);
const ID = '00000000-0000-4000-8000-000000000901';

/** Un `datos.destino` válido para la pantalla del motivo (04 §11.4). */
function destinoDe(motivo: MotivoNotificacion): Record<string, string> {
  const pantalla = MOTIVOS[motivo].destino;
  switch (pantalla) {
    case 'movimiento':
      return { pantalla, movimientoId: ID };
    case 'transaccion':
      return { pantalla, transaccionId: ID };
    case 'programada':
      return { pantalla, programadaId: ID, fechaEsperada: '2027-02-05' };
    case 'presupuesto':
      return { pantalla, periodoInicio: '2027-01-21' };
    case 'categoria':
      return { pantalla, categoriaId: ID };
    case 'cuenta':
      return { pantalla, cuentaId: ID };
    default:
      return { pantalla };
  }
}

describe('PRU-INT-NOTIF', () => {
  const base = crearBasePrueba();
  beforeAll(() => {
    process.env['DATABASE_URL'] = base.url; // el cliente del proceso (04 §2.5)
  });

  it('PRU-INT-NOTIF-002 [CF-16] NOTIF-catalogo: cada motivo de MOTIVOS entra como finn_app con su aviso (nulo si no es un aviso del dominio) y un destino válido; AV-1 sigue rechazado', async () => {
    expect(motivos).toHaveLength(18);
    expect(motivos.filter((m) => MOTIVOS[m].aviso === null)).toEqual(
      expect.arrayContaining(['cierre_periodo', 'pago_tarjeta_proximo', 'cuota_proxima']),
    );
    // Como lo haría `posteriores()` (04 §4.9): una notificación por motivo, con el aviso del catálogo
    const fallos: string[] = [];
    for (const m of motivos)
      await escribir(
        (tx) =>
          registrarNotificacion(tx, m, {
            titulo: 'Título',
            cuerpo: 'Cuerpo',
            datos: { destino: destinoDe(m) },
          }),
        RELOJ,
      ).catch((e: unknown) => fallos.push(`${m} ${sqlstateDe(e)?.sqlstate ?? String(e)}`));
    expect(fallos).toEqual([]);
    const guardadas = await leer((tx) => notificacionesRecientes(tx, 100), RELOJ);
    for (const m of motivos)
      expect(guardadas.find((f) => f.motivo === m)).toMatchObject({ aviso: MOTIVOS[m].aviso });
    // Control negativo (06 §3.13.2, paso 5): el CHECK de formato no cambia con CF-16
    const malo = escribir(
      (tx) => crearNotificacion(tx, { aviso: 'AV-1', motivo: 'x', titulo: 't', cuerpo: 'c' }),
      RELOJ,
    ).catch((e: unknown) => sqlstateDe(e)?.sqlstate);
    expect(await malo).toBe('23514');
  });

  it('PRU-INT-NOTIF-002 [CF-16] NOTIF-catalogo: la política de 04 §11.2: sin push solo cambio_retroactivo; sms_coincidencia con acciones; avisos y etiquetas', () => {
    expect(motivos.filter((m) => !MOTIVOS[m].push.enviar)).toEqual(['cambio_retroactivo']);
    expect(MOTIVOS.sms_coincidencia.push).toMatchObject({ acciones: ['confirmar', 'rechazar'] });
    expect(MOTIVOS.pago_tarjeta_proximo.push).toMatchObject({
      etiqueta: 'tarjetas',
      ttl: 'hasta_fecha_de_pago',
    });
    expect(MOTIVOS.cuota_proxima.push).toMatchObject({ etiqueta: 'programadas' });
    expect(MOTIVOS.cambio_retroactivo.aviso).toBe('AV-01');
    expect(esMotivo('inventado')).toBe(false);
  });

  it('PRU-INT-NOTIF-002 [CF-16] BE-38, OPT-04: AV-01 se registra sin push, aparece como no leído y se marca como leído por ids o todas', async () => {
    const retro = await escribir(
      (tx) => registrarCambioRetroactivo(tx, { titulo: 'Cambio retroactivo', cuerpo: 'Resumen' }),
      RELOJ,
    );
    expect(retro.conPush).toBe(false);
    const cierre = await escribir(
      (tx) => registrarNotificacion(tx, 'cierre_periodo', { titulo: 'Cierre', cuerpo: 'Cerró' }),
      RELOJ,
    );
    expect(cierre.conPush).toBe(true);

    const filas = await leer((tx) => notificacionesRecientes(tx), RELOJ);
    expect(filas.find((f) => f.id === retro.id)).toMatchObject({
      aviso: 'AV-01',
      motivo: 'cambio_retroactivo',
      pushEnviadaEn: null,
      leidaEn: null,
      datos: { destino: { pantalla: 'inicio' } },
    });
    expect(filas.find((f) => f.id === cierre.id)).toMatchObject({ aviso: null });
    const sinLeer = await leer((tx) => noLeidasDeAviso(tx, 'AV-01'), RELOJ);
    expect(sinLeer.map((f) => f.id)).toContain(retro.id);

    const r = await marcarNotificacionesLeidas({ ids: [retro.id] }, () => RELOJ);
    expect(r).toMatchObject({ ok: true, valor: { marcadas: 1 }, yaAplicada: false });
    expect(
      (await leer((tx) => noLeidasDeAviso(tx, 'AV-01'), RELOJ)).map((f) => f.id),
    ).not.toContain(retro.id);
    const otra = await marcarNotificacionesLeidas({ ids: [retro.id] }, () => RELOJ);
    expect(otra).toMatchObject({ ok: true, valor: { marcadas: 0 }, yaAplicada: true });

    const todas = await marcarNotificacionesLeidas({ todas: true }, () => RELOJ);
    expect(todas).toMatchObject({ ok: true });
    expect(await leer((tx) => contarNoLeidas(tx), RELOJ)).toBe(0);
  });

  it('PRU-INT-NOTIF-002 [CF-16] OPT-04: rechaza una entrada vacía, mezclada o con ids inválidos', async () => {
    for (const mala of [
      {},
      { ids: [] },
      { ids: ['x'] },
      { todas: false },
      { ids: [ID], todas: true },
    ]) {
      const r = await marcarNotificacionesLeidas(mala, () => RELOJ);
      expect(r).toMatchObject({ ok: false, error: { categoria: 'VALIDACION' } });
    }
  });
});
