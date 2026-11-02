// Recepción y procesamiento de SMS (FT-34, 2 de 2: CA-34.8 a CA-34.14; 04 §8.4, §8.6; 01 §4.17; CB-14, M2, PR-2, inv. 13):
// cada SMS llega a su hora local con el procesamiento real de OP-35 contra PostgreSQL como `finn_app`. El estado (cuentas,
// categorías, la programada) lo siembran las operaciones reales con el ejecutor `int` de los escenarios (DP-17); la cuenta
// de otra institución y la regla de comercio, con OP-01 y OP-41 por el marco. La hora de recepción es la de `finn.ahora()` con
// un desfase calculado, sin reloj de pared ni `sleep` (07 §7.1).
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { guardarSms } from '@finn/db';
import { txPrisma } from '../../db/src/transacciones.ts';
import { consultar } from '../../db/test/ayudantes/base.ts';
import type { Escenario, Op } from '../../dominio/escenarios/tipos.ts';
import type { ClaimsSesion, SesionServidor } from '../src/autenticacion/autorizar.ts';
import { cuentas as consultaCuentas } from '../src/consultas/cuentas.ts';
import type { DepsConsulta } from '../src/consultas/comun.ts';
import { inicio } from '../src/consultas/inicio.ts';
import { confirmar, type DefinicionOperacion, type DepsMarco } from '../src/operaciones/marco.ts';
import { OP01 } from '../src/operaciones/cuentas/index.ts';
import { OP41 } from '../src/operaciones/bandeja/index.ts';
import { barrer, procesar } from '../src/sms/procesar.ts';
import { ejecutorInt, type Estado } from './escenarios/int.ts';

const HOY = '2027-02-18';
const MIN = 60_000;
const ESTADO_INICIAL: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'Visa BAC', tipo: 'tarjeta', ultimos4: '4821' }, // la institución del dato es BAC
  { op: 'OP-07', categoria: 'Supermercado' },
  { op: 'OP-07', categoria: 'Streaming' },
  // Una compra de $15.49 del 17 en la tarjeta, ya en la Bandeja: cumpliría el criterio de duplicado de un SMS del 18
  {
    op: 'OP-35',
    etiqueta: 'previo',
    cuenta: 'Visa BAC',
    monto: 15.49,
    comercio: 'Libreria Luz',
    recibido: '2027-02-17T10:00',
    fecha: '2027-02-17',
  },
  // Netflix: su ocurrencia del 17 sigue pendiente
  {
    op: 'OP-42',
    etiqueta: 'netflix',
    cuenta: 'Visa BAC',
    comercio: 'Netflix',
    monto: 15.49,
    categoria: 'Streaming',
    primeraFecha: '2027-02-17',
  },
];
const ESCENARIO: Escenario = {
  id: 'SEM-BAND-34-II',
  titulo: 'Semilla de FT-34 (2 de 2)',
  refs: [],
  hoy: HOY,
  estadoInicial: ESTADO_INICIAL,
  pasos: [],
};

const SESION: SesionServidor = {
  obtenerClaims: () => Promise.resolve({ sub: 'usuario-unico', aal: 'aal2' } as ClaimsSesion),
  obtenerUsuario: () => Promise.resolve({ id: 'usuario-unico' }),
};

/** 'AAAA-MM-DDThh:mm' local (UTC−6, sin horario de verano) a milisegundos UTC. */
function instanteMs(local: string): number {
  const [dia = '', hm = ''] = local.split('T');
  const [h = 0, m = 0] = hm.split(':').map(Number);
  const [a = 0, mes = 1, d = 1] = dia.split('-').map(Number);
  return Date.UTC(a, mes - 1, d, h + 6, m);
}

const compra = (ultimos4: string, monto: string, comercio: string) =>
  `VISA ${ultimos4}: has realizado una compra por USD ${monto} en el comercio ${comercio} 2027/02/18`;

interface Fila {
  readonly id: string;
  readonly estado: string;
  readonly cuenta: string | null;
  readonly fecha: string | null;
  readonly monto: number | null;
  readonly tipo_propuesto: string | null;
  readonly categoria: string | null;
  readonly esperada_programada_id: string | null;
  readonly esperada_fecha: string | null;
  readonly duplicado_movimiento_id: string | null;
}

describe('PRU-INT-BAND (FT-34: recepción y procesamiento, 2 de 2)', () => {
  let s: Estado;

  const sql = async <T>(texto: string): Promise<T[]> =>
    (await consultar(s.base.urlAdmin, `SELECT row_to_json(f)::text FROM (${texto}) f`)).map(
      (t) => JSON.parse(t) as T,
    );
  const movimientoDe = async (smsId: string): Promise<Fila> => {
    const [f] = await sql<Fila>(
      `SELECT m.id, m.estado, c.nombre AS cuenta, m.fecha::text AS fecha, m.monto, m.tipo_propuesto::text,
              k.nombre AS categoria, m.esperada_programada_id, m.esperada_fecha::text AS esperada_fecha,
              m.duplicado_movimiento_id
         FROM finn.movimientos m
         LEFT JOIN finn.cuentas c ON c.id = m.cuenta_id
         LEFT JOIN finn.movimiento_lineas l ON l.movimiento_id = m.id
         LEFT JOIN finn.categorias k ON k.id = l.categoria_id
        WHERE m.sms_id = '${smsId}'`,
    );
    if (f === undefined) throw new Error(`el SMS ${smsId} no tiene movimiento`);
    return f;
  };

  /** Las dependencias de OP-35 y del marco, con el reloj de la base en `local` (hora de El Salvador). */
  async function depsEn(local: string): Promise<DepsMarco> {
    const hoy = local.slice(0, 10);
    const ahora = await s.tx.leer(
      async (t) => {
        const [r] = await txPrisma(t).$queryRaw<
          { ms: bigint }[]
        >`SELECT (extract(epoch FROM clock_timestamp()) * 1000)::bigint AS ms`;
        return Number(r?.ms);
      },
      { reloj: { hoy, desfaseMs: 0 } },
    );
    const desfaseMs = instanteMs(local) - ahora;
    return {
      memoria: s.memoria,
      escribir: s.tx.escribir,
      leer: s.tx.leer,
      escribirTecnico: s.tx.escribirTecnico,
      opciones: () => ({ reloj: { hoy, desfaseMs } }),
    };
  }
  /** El SMS se guarda con la hora de recepción `local` (8.2 paso 4) y, si se pide, se procesa (8.4). */
  async function guarda(texto: string, local: string): Promise<{ id: string; deps: DepsMarco }> {
    const deps = await depsEn(local);
    const sms = await s.tx.escribirSms(
      (tx) => guardarSms(tx, { texto, remitente: 'BAC' }),
      deps.opciones?.(),
    );
    return { id: sms.id, deps };
  }
  async function llega(texto: string, local: string): Promise<string> {
    const { id, deps } = await guarda(texto, local);
    const fallo = await procesar(id, deps);
    if (fallo !== undefined) throw new Error('el procesamiento no debió fallar');
    return id;
  }
  /** Una operación por el marco, con el protocolo real de 04 §4.2. */
  async function operacion<E, R, S>(def: DefinicionOperacion<E, R, S>, entrada: object) {
    const r = await confirmar(
      def as unknown as DefinicionOperacion<never, unknown, unknown>,
      entrada,
      {
        ...(await depsEn(`${HOY}T12:30`)),
      },
    );
    if (!r.ok) throw new Error(`${def.id}: ${r.error.codigo}`);
  }
  const idDe = async (tabla: 'categorias' | 'instituciones', nombre: string): Promise<string> =>
    (await sql<{ id: string }>(`SELECT id FROM finn.${tabla} WHERE nombre = '${nombre}'`))[0]?.id ??
    '';
  const intentos = (smsId: string) =>
    sql<{ resultado: string; formato_id: string | null; coincidentes: string[] | null }>(
      `SELECT resultado::text, formato_id, formatos_coincidentes AS coincidentes
         FROM finn.sms_procesamientos WHERE sms_id = '${smsId}' ORDER BY intento`,
    );
  const depsConsulta = (): DepsConsulta => ({
    memoria: s.memoria,
    sesion: SESION,
    usuarioPermitido: 'usuario-unico',
    leer: s.tx.leer,
    opciones: () => ({ reloj: { hoy: HOY, desfaseMs: 0 } }),
  });

  beforeAll(async () => {
    s = await ejecutorInt.iniciar(ESCENARIO, HOY);
    // Banco Agrícola con los mismos últimos cuatro dígitos que la tarjeta del BAC (CB-14)
    await operacion(OP01, {
      id: randomUUID(),
      nombre: 'Tarjeta Agrícola',
      tipo: 'tarjeta',
      fechaApertura: '2027-01-21',
      institucionId: await idDe('instituciones', 'Banco Agrícola'),
      ultimos4: '4821',
      saldo: '0.00',
      limiteCredito: '1000.00',
      diaCorte: 15,
      diaPago: 5,
    });
    // El formato de Banco Agrícola está inactivo de fábrica (TA-181): se activa para ver su SMS (03 §9.5)
    await consultar(
      s.base.urlAdmin,
      `BEGIN; SELECT finn.tomar_bloqueo();
       UPDATE finn.formatos_bancarios SET activo = true WHERE nombre = 'Banco Agrícola compra'; COMMIT;`,
    );
    // La regla "SELECTOS → Supermercado" (OP-41)
    await operacion(OP41, {
      accion: 'crear',
      id: randomUUID(),
      patron: 'SELECTOS',
      categoriaId: await idDe('categorias', 'Supermercado'),
    });
  }, 120_000);
  afterAll(async () => {
    await s.cliente.$disconnect();
  });

  it('PRU-INT-BAND-110 [CA-34.8, CB-14] un SMS de una tarjeta terminada en 4821 del BAC, con otra cuenta de Banco Agrícola con los mismos últimos 4, se identifica con la del BAC (y el de Banco Agrícola, con la suya)', async () => {
    const bac = await movimientoDe(
      await llega(compra('4821', '9.99', 'TIENDA BAC'), `${HOY}T13:00`),
    );
    expect(bac).toMatchObject({ estado: 'pendiente', cuenta: 'Visa BAC', monto: 999 });
    const agricola = await movimientoDe(
      await llega(
        'Banco Agricola (4821) compra por USD 8.88 en el comercio: TIENDA BA 2027/02/18',
        `${HOY}T13:05`,
      ),
    );
    expect(agricola).toMatchObject({
      estado: 'pendiente',
      cuenta: 'Tarjeta Agrícola',
      monto: 888,
    });
  });

  it('PRU-INT-BAND-111 [CA-34.9, M2] una ocurrencia pendiente de Netflix de $15.49 el día 17 y un SMS de $15.49 el día 18 en la misma tarjeta dejan el movimiento con coincidencia aunque haya otro de $15.49 del 17 que cumpliría el criterio de duplicado', async () => {
    const previo = await sql<{ id: string; estado: string; fecha: string }>(
      `SELECT id, estado::text, fecha::text AS fecha FROM finn.movimientos WHERE monto = 1549`,
    );
    expect(previo).toMatchObject([{ estado: 'pendiente', fecha: '2027-02-17' }]);
    const netflix = (
      await sql<{ id: string }>(`SELECT id FROM finn.programadas WHERE comercio = 'Netflix'`)
    )[0]?.id;

    const m = await movimientoDe(await llega(compra('4821', '15.49', 'NETFLIX'), `${HOY}T14:00`));
    // El emparejamiento se evalúa primero: con coincidencia, y sin apuntar al movimiento del 17 como duplicado
    expect(m).toMatchObject({
      estado: 'con_coincidencia',
      cuenta: 'Visa BAC',
      fecha: '2027-02-18',
      esperada_programada_id: netflix,
      esperada_fecha: '2027-02-17',
      duplicado_movimiento_id: null,
    });
  });

  it('PRU-INT-BAND-112 [CA-34.10] una regla "SELECTOS → Supermercado" y un SMS de "SUPER SELECTOS ESCALON" dejan la línea propuesta en Supermercado', async () => {
    const m = await movimientoDe(
      await llega(compra('4821', '12.00', 'SUPER SELECTOS ESCALON'), `${HOY}T14:10`),
    );
    expect(m).toMatchObject({ estado: 'pendiente', monto: 1200, categoria: 'Supermercado' });
  });

  it('PRU-INT-BAND-113 [CA-34.11] un SMS de más de 640 caracteres queda no reconocido sin evaluar los patrones, aunque su texto corto sí se reconoce', async () => {
    const largo = compra('4821', '5.55', `${'A'.repeat(640)}`);
    expect(largo.length).toBeGreaterThan(640);
    const id = await llega(largo, `${HOY}T14:20`);
    expect(await movimientoDe(id)).toMatchObject({
      estado: 'no_reconocido',
      cuenta: null,
      monto: null,
    });
    // Ningún formato se evaluó: sin formato elegido ni formatos coincidentes
    expect(await intentos(id)).toEqual([
      { resultado: 'no_reconocido', formato_id: null, coincidentes: [] },
    ]);
    // El mismo SMS con un comercio corto sí se reconoce: lo que lo descartó fue el largo
    const corto = await movimientoDe(await llega(compra('4821', '5.55', 'CAFE'), `${HOY}T14:30`));
    expect(corto).toMatchObject({ estado: 'pendiente', monto: 555 });
  });

  it('PRU-INT-BAND-114 [CA-34.12] un SMS sin resultado hace más de 2 minutos lo procesa la siguiente petición; con menos de 2 minutos no; dos peticiones simultáneas no crean dos movimientos', async () => {
    // Guardado y sin procesar (el proceso murió después del paso 4 de 8.2)
    const huerfano = await guarda(compra('4821', '3.33', 'HUERFANO UNO'), `${HOY}T15:00`);
    const peticion = async (local: string) =>
      barrer(
        await depsEn(local),
        () => 0,
        () => Promise.resolve(),
      );

    // 1 minuto después: todavía compite con el `after()` de su propia petición
    expect(await peticion(`${HOY}T15:01`)).toBe(0);
    expect(await intentos(huerfano.id)).toEqual([]);
    // 3 minutos después: la petición lo procesa
    expect(await peticion(`${HOY}T15:03`)).toBe(1);
    expect(await movimientoDe(huerfano.id)).toMatchObject({ estado: 'pendiente', monto: 333 });

    // Dos peticiones al mismo tiempo sobre otro SMS sin resultado: un solo intento y un solo movimiento
    const otro = await guarda(compra('4821', '4.44', 'HUERFANO DOS'), `${HOY}T16:00`);
    await Promise.all([peticion(`${HOY}T16:03`), peticion(`${HOY}T16:03`)]);
    expect(await intentos(otro.id)).toHaveLength(1);
    expect(
      await sql<{ n: number }>(
        `SELECT count(*)::int AS n FROM finn.movimientos WHERE sms_id = '${otro.id}'`,
      ),
    ).toEqual([{ n: 1 }]);
  });

  it('PRU-INT-BAND-115 [CA-34.13, INV-13] cualquier SMS procesado deja igual cada número del motor: saldos, Disponible, Listo para asignar y la revisión; solo cambia la Bandeja', async () => {
    // Todo lo que cuenta la Bandeja (contadores y avisos de AV-23) se aparta: lo demás es el motor y debe quedar igual
    const sinBandeja = (dto: object): unknown => {
      const copia = JSON.parse(JSON.stringify(dto)) as Record<string, unknown> & {
        atencion?: Record<string, unknown>;
      };
      delete copia['bandejaPorRevisar'];
      delete copia['notificacionesNoLeidas'];
      delete copia.atencion?.['bandeja'];
      return copia;
    };
    const numeros = async () => {
      const i = await inicio(depsConsulta());
      return {
        inicio: sinBandeja(i),
        cuentas: sinBandeja(await consultaCuentas(depsConsulta())),
        porRevisar: i.bandejaPorRevisar,
      };
    };
    const antes = await numeros();
    // Una compra, una con regla de comercio y una no reconocida
    await llega(compra('4821', '21.10', 'FARMACIA SAN JOSE'), `${HOY}T17:00`);
    await llega(compra('4821', '22.20', 'SUPER SELECTOS ESCALON'), `${HOY}T17:05`);
    await llega('mensaje que no es de ningún banco', `${HOY}T17:10`);
    const despues = await numeros();
    expect(despues.porRevisar).toBe(antes.porRevisar + 3);
    expect({ ...despues, porRevisar: 0 }).toEqual({ ...antes, porRevisar: 0 });
  });

  it('PRU-INT-BAND-116 [CA-34.14] con SMS sintéticos de depósito, pago a tarjeta y devolución, el tipo propuesto es ingreso, pago de tarjeta y devolución (se rehace con las muestras reales, PRU-MAN-BAND-003)', async () => {
    // Formatos de prueba, como los daría OPT-05 (03 §9.5 solo siembra los de compra)
    await consultar(
      s.base.urlAdmin,
      `BEGIN; SELECT finn.tomar_bloqueo();
       INSERT INTO finn.formatos_bancarios (institucion_id, nombre, tipo_movimiento, patron, banderas, monto_separador_miles, monto_separador_decimal)
         SELECT finn.instituciones.id, f.nombre, f.tipo::finn.tipo_movimiento_bancario, f.patron, 'i', ',', '.'
           FROM finn.instituciones,
                (VALUES
                  ('BAC depósito sintético', 'deposito',
                   'deposito a la cuenta terminada en (?<ultimos4>\\d{4}) por USD\\s*(?<monto>[\\d,]+\\.?\\d*)'),
                  ('BAC pago de tarjeta sintético', 'pago_tarjeta',
                   'pago a su tarjeta (?<ultimos4>\\d{4}) por USD\\s*(?<monto>[\\d,]+\\.?\\d*)'),
                  ('BAC devolución sintética', 'devolucion',
                   'devolucion en su tarjeta (?<ultimos4>\\d{4}) por USD\\s*(?<monto>[\\d,]+\\.?\\d*)\\s+de\\s+(?<comercio>.+)')
                ) AS f(nombre, tipo, patron)
          WHERE lower(finn.instituciones.nombre) = 'bac'; COMMIT;`,
    );
    const esperado: readonly (readonly [string, string, string])[] = [
      [
        'BAC: se acredito un deposito a la cuenta terminada en 4821 por USD 100.00',
        'ingreso',
        '18:00',
      ],
      ['BAC: pago a su tarjeta 4821 por USD 50.00 recibido', 'pago_tarjeta', '18:15'],
      [
        'BAC: devolucion en su tarjeta 4821 por USD 7.00 de FARMACIA SAN JOSE',
        'devolucion',
        '18:30',
      ],
    ];
    for (const [texto, tipo, hora] of esperado) {
      const m = await movimientoDe(await llega(texto, `${HOY}T${hora}`));
      expect(m).toMatchObject({ tipo_propuesto: tipo, cuenta: 'Visa BAC' });
    }
  });
});
