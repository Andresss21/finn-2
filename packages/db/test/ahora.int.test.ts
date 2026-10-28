// Respaldo b) de P7-12 (TA-157; 07 §32.1; CT-02, CH-24): con el reloj simulado, cada inserción en las tablas
// de las 9 columnas de instantes técnicos deja el instante simulado. La aplicación las escribe con
// `ahoraDb()` y `conAhora()` (packages/db/src/ahora.ts); `eliminaciones` la escribe el trigger
// (m_eliminaciones_ahora). L21 (tools/lint/l21.mjs) es la barrera estática, con sus controles negativos en
// tools/lint/controles/l21/. Ninguna comparación usa el reloj de pared: todas son contra `finn.ahora()` y
// `now()` de la misma transacción.
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ahoraDb, COLUMNAS_AHORA, conAhora } from '../src/ahora.ts';
import { crearCliente, type Cliente } from '../src/cliente.ts';
import { transaccionesSobre, txPrisma } from '../src/transacciones.ts';
import { crearBasePrueba } from './ayudantes/base.ts';

const RELOJ = { hoy: '2027-03-10', desfaseMs: 200 * 86_400_000 }; // 200 días: lejos del reloj real
const raiz = fileURLToPath(new URL('../../..', import.meta.url));
const lint = join(raiz, 'tools', 'lint', 'l21.mjs');
const carpeta = join(raiz, 'tools', 'lint', 'controles', 'l21');

/** L21 sobre un árbol temporal con `archivos` (ruta relativa → contenido). */
function l21(archivos: Record<string, string>): { codigo: number | null; reglas: string[] } {
  const dir = mkdtempSync(join(tmpdir(), 'finn-l21-'));
  try {
    for (const [ruta, contenido] of Object.entries(archivos)) {
      mkdirSync(join(dir, ruta, '..'), { recursive: true });
      writeFileSync(join(dir, ruta), contenido);
    }
    const r = spawnSync(process.execPath, [lint, dir], { encoding: 'utf8' });
    return {
      codigo: r.status,
      reglas: [...(r.stdout + r.stderr).matchAll(/^\[([a-z]+)\]/gm)].map((m) => m[1] ?? ''),
    };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// Cada columna: si quedó en finn.ahora() (al milisegundo) y si quedó a menos de un día de now(), la hora real
type Columna = { columna: string; simulado: boolean; real: boolean };

describe('PRU-INT-RELOJ', () => {
  const base = crearBasePrueba();
  let db: Cliente;
  beforeAll(() => {
    db = crearCliente(base.url);
  });
  afterAll(async () => {
    await db.$disconnect();
  });

  it('PRU-INT-RELOJ-010 CT-02, P7-12 (respaldo b, 07 §32.1): con el reloj simulado, cada inserción en las tablas de las 9 columnas deja finn.ahora(); sin ahoraDb() queda la hora real, y L21 rechaza sus controles negativos', async () => {
    const { escribir } = transaccionesSobre(db);
    const ids = { sms: randomUUID(), grupo: randomUUID(), control: 'sin-ahora' };
    const resultado = await escribir(
      async (tx) => {
        const p = txPrisma(tx);
        // Lo que las filas necesitan, en SQL a mano: una cuenta con su conciliación y un grupo que se elimina
        await p.$executeRaw`INSERT INTO finn.cuentas (tipo, nombre, fecha_apertura)
        VALUES ('efectivo', 'Caja', finn.hoy())`;
        const [conc] = await p.$queryRaw<{ id: string }[]>`INSERT INTO finn.conciliaciones
          (cuenta_id, fecha_estado, saldo_estado, terminada_en, diferencia_aceptada)
        SELECT id, finn.hoy(), 1000, finn.ahora(), 0 FROM finn.cuentas WHERE nombre = 'Caja'
        RETURNING id::text AS id`;
        await p.$executeRaw`INSERT INTO finn.grupos (id, nombre) VALUES (${ids.grupo}::uuid, 'Temporal')`;

        const ahora = await ahoraDb(tx);
        expect(await ahoraDb(tx)).toBe(ahora); // una sola lectura por transacción
        await p.smsRecibido.create({
          data: conAhora('smsRecibido', { id: ids.sms, texto: 'Compra', remitente: 'BAC' }, ahora),
        });
        await p.smsProcesamiento.createMany({
          data: [
            conAhora(
              'smsProcesamiento',
              { smsId: ids.sms, intento: 1, resultado: 'pendiente' as const },
              ahora,
            ),
          ],
        });
        await p.cambioPosterior.create({
          data: conAhora(
            'cambioPosterior',
            {
              conciliacionId: conc?.id ?? '',
              motivos: ['monto' as const],
              fecha: new Date(`${RELOJ.hoy}T00:00:00Z`),
              montoEfecto: 100,
            },
            ahora,
          ),
        });
        await p.suscripcionPush.create({
          data: conAhora(
            'suscripcionPush',
            { endpoint: 'https://push.example/1', claveP256dh: 'p', claveAuth: 'a' },
            ahora,
          ),
        });
        await p.notificacion.create({
          data: conAhora('notificacion', { motivo: 'm', titulo: 't', cuerpo: 'c' }, ahora),
        });
        await p.eventoSistema.create({
          data: conAhora(
            'eventoSistema',
            { nivel: 'info' as const, origen: 'app', mensaje: 'simulado' },
            ahora,
          ),
        });
        await p.tokenWebhook.create({
          data: conAhora('tokenWebhook', { id: 1, hashSha256: 'a'.repeat(64) }, ahora),
        });
        // eliminaciones: la escribe tg_registrar_eliminacion al borrar el grupo
        await p.grupo.delete({ where: { id: ids.grupo } });
        // Control negativo: sin conAhora(), `@default(now())` (que Prisma llena en el cliente, o el DEFAULT
        // now() de la base) deja la hora real, a menos de un día de now() y no a 200 días
        await p.eventoSistema.create({
          data: { nivel: 'info', origen: 'app', mensaje: ids.control },
        });

        const [reloj] = await p.$queryRaw<{ desfase: boolean; leido: boolean }[]>`SELECT
          finn.ahora() - now() = interval '200 days' AS desfase,
          date_trunc('milliseconds', finn.ahora()) = ${ahora} AS leido`;
        const columnas = await p.$queryRaw<Columna[]>`
        WITH c (columna, valor, control) AS (
          SELECT 'sms_recibidos.recibido_en', recibido_en, false FROM finn.sms_recibidos
          UNION ALL SELECT 'sms_procesamientos.procesado_en', procesado_en, false FROM finn.sms_procesamientos
          UNION ALL SELECT 'cambios_posteriores.registrado_en', registrado_en, false FROM finn.cambios_posteriores
          UNION ALL SELECT 'eliminaciones.eliminada_en', eliminada_en, false FROM finn.eliminaciones
            WHERE fila_id = ${ids.grupo}::uuid
          UNION ALL SELECT 'suscripciones_push.creada_en', creada_en, false FROM finn.suscripciones_push
          UNION ALL SELECT 'suscripciones_push.renovada_en', renovada_en, false FROM finn.suscripciones_push
          UNION ALL SELECT 'notificaciones.creada_en', creada_en, false FROM finn.notificaciones
          UNION ALL SELECT 'eventos_sistema.ocurrido_en', ocurrido_en, mensaje = ${ids.control}
            FROM finn.eventos_sistema
          UNION ALL SELECT 'token_webhook.creado_en', creado_en, false FROM finn.token_webhook)
        SELECT columna || CASE WHEN control THEN ' (sin ahoraDb)' ELSE '' END AS columna,
          date_trunc('milliseconds', valor) = date_trunc('milliseconds', finn.ahora()) AS simulado,
          abs(extract(epoch FROM valor - now())) < 86400 AS real
        FROM c ORDER BY 1`;
        return { reloj, columnas };
      },
      { reloj: RELOJ },
    );

    expect(resultado.reloj).toEqual({ desfase: true, leido: true });
    const simulada = (columna: string): Columna => ({ columna, simulado: true, real: false });
    expect(resultado.columnas).toEqual([
      simulada('cambios_posteriores.registrado_en'),
      simulada('eliminaciones.eliminada_en'),
      simulada('eventos_sistema.ocurrido_en'),
      { columna: 'eventos_sistema.ocurrido_en (sin ahoraDb)', simulado: false, real: true },
      simulada('notificaciones.creada_en'),
      simulada('sms_procesamientos.procesado_en'),
      simulada('sms_recibidos.recibido_en'),
      simulada('suscripciones_push.creada_en'),
      simulada('suscripciones_push.renovada_en'),
      simulada('token_webhook.creado_en'),
    ]);
    // Las 9 columnas de CT-02, una vez cada una, en conAhora() y en la prueba
    expect(Object.values(COLUMNAS_AHORA).flat()).toHaveLength(9);
    expect(conAhora('cuenta', { nombre: 'Caja' }, new Date(0))).toEqual({ nombre: 'Caja' });

    // L21: pasa en el repositorio; cada control negativo falla solo con su regla, en los dos paquetes
    const repo = spawnSync(process.execPath, [lint], { cwd: raiz, encoding: 'utf8' });
    expect(repo.stdout + repo.stderr).toContain('L21: toda inserción');
    expect(repo.status).toBe(0);
    const controles = readdirSync(carpeta).map((f) => {
      const texto = readFileSync(join(carpeta, f), 'utf8');
      return {
        nombre: f.replace('.txt', ''),
        texto,
        regla: /^\/\/ regla: (\S+)$/m.exec(texto)?.[1],
      };
    });
    expect(controles.map((c) => c.regla).sort()).toEqual([
      'dinamico',
      'ninguna',
      'prisma',
      'prisma',
      'sql',
      'sql',
    ]);
    for (const c of controles)
      for (const paquete of ['db', 'aplicacion']) {
        const r = l21({ [`packages/${paquete}/src/sub/${c.nombre}`]: c.texto });
        const esperado =
          c.regla === 'ninguna' ? { codigo: 0, reglas: [] } : { codigo: 1, reglas: [c.regla] };
        expect(r, `${c.nombre} en ${paquete}`).toEqual(esperado);
      }
    // El cliente generado, las pruebas y las migraciones quedan fuera
    const todos = controles.map((c) => c.texto).join('\n');
    expect(
      l21({
        'packages/db/src/generado/prisma/x.ts': todos,
        'packages/db/src/x.test.ts': todos,
        'packages/db/prisma/migrations/20990101000000_m_x/migration.sql': todos,
      }),
    ).toEqual({ codigo: 0, reglas: [] });
  });
});
