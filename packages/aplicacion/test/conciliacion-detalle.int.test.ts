// OP-45 devuelve el detalle de cada transacción de la clasificación contra PostgreSQL como `finn_app` (CH-201; 04 §3.8,
// §6.12.6, §9.5): la fecha, el comercio, el efecto en la cuenta y el estado bancario salen de los hechos que OP-45 ya
// carga en `leer()`. La cuenta es el efectivo 1 de los hechos de prueba; la categoría, Comida. Las claves de prueba son
// bytes repetidos, no secretos (gitleaks).
import { beforeAll, describe, expect, it } from 'vitest';
import type { Hechos, Instante, Uuid } from '@finn/dominio';
import { cargarHechos, leer, Memoria } from '@finn/db';
import { crearBasePrueba } from '../../db/test/ayudantes/base.ts';
import { escribirHechosDePrueba, HOY, RELOJ } from '../../db/test/ayudantes/hechos-prueba.ts';
import { crearConciliacion } from '../src/operaciones/conciliacion/index.ts';
import { confirmar, type DepsMarco } from '../src/operaciones/marco.ts';
import { OP20 } from '../src/operaciones/transacciones/index.ts';

const uuid = (n: number): Uuid => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}` as Uuid;
const E1 = uuid(1),
  C1 = uuid(11);
/** Las transacciones de los hechos de prueba son `uuid(100 + n)`. */
const tx = (n: number): Uuid => uuid(100 + n);
const INSTANTE = `${HOY}T12:00:00.000Z` as Instante;
const T0 = Date.parse('2027-02-05T15:00:00.000Z');

// BAC débito sintético (⚠ S6-1): LA PAMPA $37.19 el 4 de febrero y un abono de $2.50 el 3, la devolución de prueba
const CSV = new TextEncoder().encode(
  [
    'Detalle de Estado Bancario',
    'Fecha de corte,04/02/2027',
    'Saldo Inicial,"1,000.00"',
    'Saldo Final,"988.12"',
    'Fecha,Descripcion,Referencia,Debito,Credito',
    '04/02/2027,LA PAMPA,R1,37.19,',
    '03/02/2027,DEVOLUCION,,,2.50',
    '',
  ].join('\n'),
);

describe('PRU-INT-CONC', () => {
  const base = crearBasePrueba();
  const deps = (): DepsMarco => ({
    memoria: new Memoria(),
    opciones: () => RELOJ,
    instante: () => INSTANTE,
  });
  const conciliacion = crearConciliacion({
    claves: { activa: 'k1', claves: { k1: Buffer.alloc(32, 1).toString('base64') } },
    ahoraMs: () => T0,
  });
  const hechos = (): Promise<Hechos> => leer((t) => cargarHechos(t), RELOJ);

  beforeAll(async () => {
    await escribirHechosDePrueba(base);
    process.env['DATABASE_URL'] = base.url; // el cliente del proceso (04 §2.5)
  });

  it('PRU-INT-CONC-101 OP-45 BE-48 CH-201: devuelve, de cada coincidencia y de cada transacción solo en Finn, la fecha, el comercio, el efecto en la cuenta y el estado bancario guardados', async () => {
    const pampa = uuid(2010);
    const r20 = await confirmar(
      OP20,
      {
        ...{ id: pampa, cuentaId: E1, fecha: '2027-02-04', total: '37.19', comercio: 'LA PAMPA' },
        lineas: [{ monto: '37.19', destino: { categoriaId: C1 } }],
      },
      deps(),
    );
    expect(r20.ok).toBe(true);
    const antes = await hechos();

    const r = await conciliacion.iniciar({ cuentaId: E1, archivo: CSV }, deps());
    if (!r.ok) throw new Error(`OP-45 falló: ${r.error.codigo}`);
    // Ventana: [3 feb − 3 días, 4 feb]. Fuera: el pago de tarjeta conciliado del 30 de enero (tx 9)
    expect(r.valor.clasificacion).toEqual({
      coincidencias: [
        {
          ...{ transaccionId: pampa, movimientoIndice: 0, fecha: '2027-02-04' },
          ...{ comercio: 'LA PAMPA', monto: -3719, estadoBancario: 'pendiente' },
        },
        {
          ...{ transaccionId: tx(7), movimientoIndice: 1, fecha: '2027-02-03' },
          ...{ comercio: null, monto: 250, estadoBancario: 'pendiente' },
        },
      ],
      soloEnEstado: [],
      // En el orden de la clave de orden: el cobro del 1 de febrero y la cuota del 2
      soloEnFinn: [
        {
          ...{ transaccionId: tx(6), fecha: '2027-02-01', comercio: null },
          ...{ monto: 1000, estadoBancario: 'pendiente' },
        },
        {
          ...{ transaccionId: tx(10), fecha: '2027-02-02', comercio: null },
          ...{ monto: -5000, estadoBancario: 'pendiente' },
        },
      ],
      // $1,000.00 + $10.00 + $2.50 − $12.50 − $20.00 − $10.00 − $50.00 − $37.19 al 4 de febrero
      saldoFinn: 88_281,
      diferencia: 10_531, // $988.12 − $882.81
    });
    // Cada dato es el de la fila guardada y su efecto en E1
    const { coincidencias, soloEnFinn } = r.valor.clasificacion;
    for (const x of [...coincidencias, ...soloEnFinn]) {
      const t = antes.transacciones.find((y) => y.id === x.transaccionId);
      const e = antes.efectos.find((y) => y.transaccionId === x.transaccionId && y.cuentaId === E1);
      expect(x).toMatchObject({
        ...{ fecha: t?.fecha, comercio: t?.comercio, estadoBancario: t?.estadoBancario },
        monto: e?.monto,
      });
    }
    // OP-45 sigue siendo de lectura
    expect((await hechos()).transacciones).toHaveLength(antes.transacciones.length);
  });
});
