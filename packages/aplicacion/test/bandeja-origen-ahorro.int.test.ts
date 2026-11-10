// BE-41 con el subtipo de efectivo (TA-494; 04 BE-41 [CH-224]) contra PostgreSQL como `finn_app`: el origen
// propuesto de un pago de tarjeta salta los pagos hechos desde una cuenta de ahorro, en la bandeja y en
// `formulario('pagar_tarjeta')`. Cuentas, pagos y movimientos propios (ids 5000 en adelante) sobre `hechos-prueba`.
import { beforeAll, describe, expect, it } from 'vitest';
import type { Instante, Uuid } from '@finn/dominio';
import { Memoria } from '@finn/db';
import { bandeja } from '../src/consultas/bandeja.ts';
import type { DepsConsulta } from '../src/consultas/comun.ts';
import { formulario } from '../src/consultas/formulario/index.ts';
import { consultar, crearBasePrueba } from '../../db/test/ayudantes/base.ts';
import { escribirHechosDePrueba, HOY, RELOJ } from '../../db/test/ayudantes/hechos-prueba.ts';
import { confirmar, previsualizar, type DepsMarco } from '../src/operaciones/marco.ts';
import { OP01 } from '../src/operaciones/cuentas/index.ts';
import { OP23 } from '../src/operaciones/transacciones/index.ts';

const uuid = (n: number): Uuid => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}` as Uuid;
const CORRIENTE = uuid(5001),
  AHORRO = uuid(5002),
  VISA = uuid(5010), // pagada desde la corriente y después desde el ahorro
  MASTER = uuid(5011); // pagada solo desde el ahorro
const SMS_VISA = uuid(5110),
  SMS_MASTER = uuid(5111);

describe('PRU-INT-BAND', () => {
  const base = crearBasePrueba();
  const marco = (minuto: number): DepsMarco => ({
    memoria: new Memoria(),
    opciones: () => RELOJ,
    instante: () => `${HOY}T12:${String(minuto).padStart(2, '0')}:00.000Z` as Instante,
  });
  const consulta: DepsConsulta = {
    memoria: new Memoria(),
    sesion: {
      obtenerClaims: () => Promise.resolve({ sub: 'u', aal: 'aal2' }),
      obtenerUsuario: () => Promise.resolve({ id: 'u' }),
    },
    usuarioPermitido: 'u',
    opciones: () => RELOJ,
  };
  /** OP-23 con la huella de su previsualización (AV-10 pide confirmar un pago sin reserva). */
  const pagar = async (n: number, origenId: Uuid, tarjetaId: Uuid, minuto: number) => {
    const entrada = { id: uuid(n), origenId, tarjetaId, fecha: HOY, total: '50.00' };
    const vista = await previsualizar(OP23, entrada, marco(minuto));
    if (!vista.ok) throw new Error(`OP-23 ${n}: ${JSON.stringify(vista.error)}`);
    const { revisionVista, huellaImpacto } = vista.valor;
    const r = await confirmar(OP23, { ...entrada, revisionVista, huellaImpacto }, marco(minuto));
    expect(r).toMatchObject({ ok: true });
  };
  /** Un movimiento pendiente de pago de la tarjeta, como los deja el SMS (sin origen). */
  const movimiento = (sms: Uuid, tarjeta: Uuid, n: number) =>
    `INSERT INTO finn.sms_recibidos (id, texto, remitente, recibido_en)
       VALUES ('${sms}', 'pago ${n}', 'banco', timestamptz '${HOY}T13:0${n}:00Z');
     INSERT INTO finn.movimientos (id, sms_id, estado, cuenta_id, fecha, monto, comercio, tipo_propuesto)
       VALUES ('${uuid(5200 + n)}', '${sms}', 'pendiente', '${tarjeta}', date '${HOY}', 2500, NULL, 'pago_tarjeta');
     INSERT INTO finn.movimiento_lineas (movimiento_id, orden, monto) VALUES ('${uuid(5200 + n)}', 1, 2500);`;

  beforeAll(async () => {
    await escribirHechosDePrueba(base);
    process.env['DATABASE_URL'] = base.url; // el cliente del proceso (04 §2.5)
    const efectivo = { tipo: 'efectivo', saldo: '1000.00' };
    const tarjeta = { tipo: 'tarjeta', saldo: '300.00', limiteCredito: '1500.00', diaCorte: 15 };
    for (const entrada of [
      { ...efectivo, id: CORRIENTE, nombre: 'Corriente', subtipoEfectivo: 'corriente' },
      { ...efectivo, id: AHORRO, nombre: 'Ahorro', subtipoEfectivo: 'ahorro' },
      { ...tarjeta, id: VISA, nombre: 'Visa 5010', diaPago: 5 },
      { ...tarjeta, id: MASTER, nombre: 'Master 5011', diaPago: 5 },
    ])
      expect(await confirmar(OP01, entrada, marco(0))).toMatchObject({ ok: true });
    await pagar(5020, CORRIENTE, VISA, 1);
    await pagar(5021, AHORRO, VISA, 2); // el último pago a la Visa, desde el ahorro
    await pagar(5022, AHORRO, MASTER, 3);
    await consultar(
      base.urlAdmin,
      `BEGIN; SELECT finn.tomar_bloqueo();
       ${movimiento(SMS_VISA, VISA, 1)}
       ${movimiento(SMS_MASTER, MASTER, 2)}
       COMMIT;`,
    );
  });

  it('PRU-INT-BAND-200 CH-224 BE-41: con el último pago desde una cuenta de ahorro, la propuesta es el pago anterior desde una corriente; si solo hay pagos desde el ahorro, no hay propuesta y la aprobación pide el origen', async () => {
    const lista = await bandeja(consulta);
    const visa = lista.movimientos.find((m) => m.id === uuid(5201));
    const master = lista.movimientos.find((m) => m.id === uuid(5202));
    expect(visa?.origenPropuesto).toMatchObject({ id: CORRIENTE, nombre: 'Corriente' });
    expect(visa?.aprobacion.posible).toBe(true);
    expect(master).toBeDefined();
    expect(master).not.toHaveProperty('origenPropuesto');
    expect(master?.aprobacion).toMatchObject({
      posible: false,
      faltantes: expect.arrayContaining(['origen']) as unknown,
    });

    // La misma regla en el formulario de pagar tarjeta (04 §6.14.4)
    const tarjetas = (await formulario(consulta, { operacion: 'pagar_tarjeta' })).contexto as {
      tarjetas: { tarjeta: { id: Uuid }; origenPropuesto?: { id: Uuid } }[];
    };
    const de = (id: Uuid) => tarjetas.tarjetas.find((t) => t.tarjeta.id === id);
    expect(de(VISA)?.origenPropuesto).toMatchObject({ id: CORRIENTE });
    expect(de(MASTER)).toBeDefined();
    expect(de(MASTER)).not.toHaveProperty('origenPropuesto');
  });
});
