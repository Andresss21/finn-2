// Conciliar con la carga firmada contra PostgreSQL como `finn_app` (TA-184; 04 §3.8, §9.1 a §9.7; BE-49, V-26, CH-06).
// OP-45 lee un CSV sintético de BAC débito, clasifica y firma; OP-46 y OP-47 verifican la carga antes de escribir. El
// vencimiento se mide con el reloj inyectado (`ahoraMs`), así "vencida por 1 ms" es exacta. Las claves de prueba son
// bytes repetidos, no secretos (gitleaks). La cuenta es el efectivo 1 de los hechos de prueba; la categoría, Comida.
import { beforeAll, describe, expect, it } from 'vitest';
import type { Hechos, Instante, Uuid } from '@finn/dominio';
import { cargarHechos, leer, Memoria } from '@finn/db';
import { crearBasePrueba } from '../../db/test/ayudantes/base.ts';
import { escribirHechosDePrueba, HOY, RELOJ } from '../../db/test/ayudantes/hechos-prueba.ts';
import type { ClavesConciliacion } from '../src/conciliacion/carga.ts';
import { crearConciliacion } from '../src/operaciones/conciliacion/index.ts';
import { confirmar, previsualizar, type DepsMarco } from '../src/operaciones/marco.ts';
import { OP20 } from '../src/operaciones/transacciones/index.ts';

const uuid = (n: number): Uuid => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}` as Uuid;
const E1 = uuid(1), // efectivo
  E2 = uuid(2), // efectivo
  C1 = uuid(11); // Comida
const INSTANTE = `${HOY}T12:00:00.000Z` as Instante;
const FECHA = '2027-02-04';
const T0 = Date.parse('2027-02-05T15:00:00.000Z');
const DIA_MS = 24 * 60 * 60 * 1000;
const clave = (b: number): string => Buffer.alloc(32, b).toString('base64');
const K1 = clave(1),
  K2 = clave(2);
const ANTES_DE_ROTAR: ClavesConciliacion = { activa: 'k1', claves: { k1: K1 } };
const ROTADAS: ClavesConciliacion = { activa: 'k2', claves: { k2: K2, k1: K1 } };
const RETIRADA: ClavesConciliacion = { activa: 'k2', claves: { k2: K2 } };

// BAC débito sintético (⚠ S6-1): un gasto de $37.19 y un depósito de $25.31 el 4 de febrero
const CSV = new TextEncoder().encode(
  [
    'Detalle de Estado Bancario',
    'Fecha de corte,04/02/2027',
    'Saldo Inicial,"1,000.00"',
    'Saldo Final,"988.12"',
    'Fecha,Descripcion,Referencia,Debito,Credito',
    '04/02/2027,SUPER SELECTOS,R1,37.19,',
    '04/02/2027,DEPOSITO,,,25.31',
    '',
  ].join('\n'),
);

const FIRMA_NO_VALIDA = {
  ok: false,
  error: {
    categoria: 'DOMINIO',
    codigo: 'firma_no_valida',
    mensaje: 'El estado de cuenta cambió o no es válido. Volvé a subirlo.',
  },
};
const FIRMA_VENCIDA = {
  ok: false,
  error: {
    categoria: 'DOMINIO',
    codigo: 'firma_vencida',
    mensaje: 'Pasaron más de 24 horas. Volvé a subir el estado de cuenta.',
  },
};

describe('PRU-SEG-CONC-001', () => {
  const base = crearBasePrueba();
  let ahora = T0;
  const deps = (): DepsMarco => ({
    memoria: new Memoria(),
    opciones: () => RELOJ,
    instante: () => INSTANTE,
  });
  const con = (claves: ClavesConciliacion) => crearConciliacion({ claves, ahoraMs: () => ahora });
  const hechos = (): Promise<Hechos> => leer((t) => cargarHechos(t), RELOJ);
  /** La carga que firma OP-45 en `ahora` con las claves dadas. */
  const firmar = async (claves: ClavesConciliacion, cuentaId: Uuid = E1): Promise<string> => {
    const r = await con(claves).iniciar({ cuentaId, archivo: CSV }, deps());
    if (!r.ok) throw new Error(`OP-45 falló: ${r.error.codigo}`);
    return r.valor.carga;
  };
  const terminar = (carga: string, n: number, cuentaId: Uuid = E1) => ({
    id: uuid(n),
    cuentaId,
    carga,
    coincidencias: [],
  });
  const agregar = (carga: string, n: number, cuentaId: Uuid = E1) => ({
    cuentaId,
    carga,
    movimientoIndice: 1,
    operacion: 'OP-21',
    datos: { id: uuid(n), cuentaId, fecha: FECHA, total: '25.31', comercio: 'DEPOSITO' },
  });

  beforeAll(async () => {
    await escribirHechosDePrueba(base);
    process.env['DATABASE_URL'] = base.url; // el cliente del proceso (04 §2.5)
  });

  it('PRU-SEG-CONC-001 [V-26] firma válida: OP-45 clasifica y firma con la clave activa; OP-46 agrega el movimiento (importada, confirmada) y OP-47 concilia los dos pares; repetir es ya aplicada', async () => {
    ahora = T0;
    const gasto = uuid(1840);
    const r20 = await confirmar(
      OP20,
      {
        id: gasto,
        cuentaId: E1,
        fecha: FECHA,
        total: '37.19',
        lineas: [{ monto: '37.19', destino: { categoriaId: C1 } }],
      },
      deps(),
    );
    expect(r20.ok).toBe(true);
    const c = con(ROTADAS);

    const antes = await hechos();
    const r45 = await c.iniciar({ cuentaId: E1, archivo: CSV }, deps());
    if (!r45.ok) throw new Error(r45.error.codigo);
    expect(r45.valor.carga.startsWith('k2.')).toBe(true);
    expect(r45.valor).toMatchObject({
      formato: 'bac_debito',
      fechaEstado: FECHA,
      saldoFinal: 98_812,
      clasificacion: {
        coincidencias: [{ transaccionId: gasto, movimientoIndice: 0 }],
        soloEnEstado: [1],
      },
    });
    const carga = r45.valor.carga;
    const despues = await hechos(); // OP-45 es de lectura: no escribe nada
    expect(despues.transacciones).toHaveLength(antes.transacciones.length);
    expect(despues.conciliaciones).toHaveLength(antes.conciliaciones.length);

    const alta = agregar(carga, 1841);
    expect(await confirmar(c.OP46, alta, deps())).toMatchObject({
      ok: true,
      valor: { id: uuid(1841) },
      yaAplicada: false,
    });
    expect(await confirmar(c.OP46, alta, deps())).toMatchObject({ ok: true, yaAplicada: true });
    const h1 = await hechos();
    expect(h1.transacciones.find((t) => t.id === uuid(1841))).toMatchObject({
      origen: 'importada',
      estadoBancario: 'confirmada',
      fecha: FECHA,
    });

    const fin = {
      ...terminar(carga, 1842),
      coincidencias: [
        { transaccionId: gasto, movimientoIndice: 0 },
        { transaccionId: uuid(1841), movimientoIndice: 1 },
      ],
    };
    expect(await confirmar(c.OP47, fin, deps())).toMatchObject({
      ok: true,
      valor: { id: uuid(1842) },
      yaAplicada: false,
    });
    expect(await confirmar(c.OP47, fin, deps())).toMatchObject({ ok: true, yaAplicada: true });
    const h2 = await hechos();
    expect(h2.conciliaciones.find((k) => k.id === uuid(1842))).toMatchObject({
      cuentaId: E1,
      fechaEstado: FECHA,
      saldoEstado: 98_812,
      modo: 'estado_cuenta',
    });
    for (const id of [gasto, uuid(1841)])
      expect(h2.transacciones.find((t) => t.id === id)).toMatchObject({
        estadoBancario: 'conciliada',
        conciliacionId: uuid(1842),
      });
  });

  it('PRU-SEG-CONC-001 [V-26] otra cuenta: una carga firmada para el efectivo 1 no sirve para el efectivo 2 (firma_no_valida)', async () => {
    ahora = T0;
    const c = con(ROTADAS);
    const carga = await firmar(ROTADAS, E1);
    expect(await confirmar(c.OP47, terminar(carga, 1850, E2), deps())).toEqual(FIRMA_NO_VALIDA);
    expect(await confirmar(c.OP46, agregar(carga, 1851, E2), deps())).toEqual(FIRMA_NO_VALIDA);
    expect(await previsualizar(c.OP47, terminar(carga, 1850, E2), deps())).toEqual(FIRMA_NO_VALIDA);
    const h = await hechos();
    expect(h.conciliaciones.some((k) => k.id === uuid(1850))).toBe(false);
    expect(h.transacciones.some((t) => t.id === uuid(1851))).toBe(false);
  });

  it('PRU-SEG-CONC-001 [V-26] monto alterado: cambiar un monto del cuerpo, recortar el mac o romper el formato es firma_no_valida', async () => {
    ahora = T0;
    const c = con(ROTADAS);
    const carga = await firmar(ROTADAS);
    const [version = '', cuerpo = '', mac = ''] = carga.split('.');
    const datos = JSON.parse(Buffer.from(cuerpo, 'base64url').toString('utf8')) as {
      movimientos: { monto: number }[];
    };
    const [m0] = datos.movimientos;
    if (m0 === undefined) throw new Error('la carga no tiene movimientos');
    m0.monto = -371; // $3.71 en lugar de $37.19
    const alterado = Buffer.from(JSON.stringify(datos), 'utf8').toString('base64url');
    for (const mala of [
      `${version}.${alterado}.${mac}`,
      `${version}.${cuerpo}.${mac.slice(0, -2)}`, // otra longitud: se rechaza sin comparar
      `${version}.${cuerpo}`,
      '',
    ]) {
      expect(await confirmar(c.OP47, terminar(mala, 1860), deps())).toEqual(
        mala === '' ? expect.objectContaining({ ok: false }) : FIRMA_NO_VALIDA,
      );
    }
    expect(await confirmar(c.OP46, agregar(`${version}.${alterado}.${mac}`, 1861), deps())).toEqual(
      FIRMA_NO_VALIDA,
    );
  });

  it('PRU-SEG-CONC-001 [V-26] vencida por 1 ms: a las 24 h exactas la carga vale; a las 24 h + 1 ms es firma_vencida en OP-46 y OP-47', async () => {
    ahora = T0;
    const c = con(ROTADAS);
    const carga = await firmar(ROTADAS);
    ahora = T0 + DIA_MS;
    expect(await previsualizar(c.OP47, terminar(carga, 1870), deps())).toMatchObject({
      ok: true,
      valor: { rechazos: [] },
    });
    ahora = T0 + DIA_MS + 1;
    expect(await confirmar(c.OP47, terminar(carga, 1870), deps())).toEqual(FIRMA_VENCIDA);
    expect(await confirmar(c.OP46, agregar(carga, 1871), deps())).toEqual(FIRMA_VENCIDA);
    expect(await previsualizar(c.OP46, agregar(carga, 1871), deps())).toEqual(FIRMA_VENCIDA);
    expect((await hechos()).conciliaciones.some((k) => k.id === uuid(1870))).toBe(false);
  });

  it('PRU-SEG-CONC-001 [V-26] clave anterior aceptada: una carga firmada con k1 sigue valiendo después de activar k2', async () => {
    ahora = T0;
    const carga = await firmar(ANTES_DE_ROTAR);
    expect(carga.startsWith('k1.')).toBe(true);
    const c = con(ROTADAS);
    expect(await confirmar(c.OP47, terminar(carga, 1880), deps())).toMatchObject({
      ok: true,
      valor: { id: uuid(1880) },
      yaAplicada: false,
    });
    expect((await hechos()).conciliaciones.find((k) => k.id === uuid(1880))).toMatchObject({
      cuentaId: E1,
      modo: 'estado_cuenta',
    });
  });

  it('PRU-SEG-CONC-001 [V-26] versión retirada rechazada: sin k1 en la lista, o con una versión que no existe, es firma_no_valida', async () => {
    ahora = T0;
    const carga = await firmar(ANTES_DE_ROTAR);
    const c = con(RETIRADA);
    expect(await confirmar(c.OP47, terminar(carga, 1890), deps())).toEqual(FIRMA_NO_VALIDA);
    expect(await confirmar(c.OP46, agregar(carga, 1891), deps())).toEqual(FIRMA_NO_VALIDA);
    const k9 = (await firmar(ROTADAS)).replace(/^k2\./, 'k9.');
    expect(await confirmar(con(ROTADAS).OP47, terminar(k9, 1892), deps())).toEqual(FIRMA_NO_VALIDA);
    const proto = (await firmar(ROTADAS)).replace(/^k2\./, 'constructor.');
    expect(await confirmar(con(ROTADAS).OP47, terminar(proto, 1893), deps())).toEqual(
      FIRMA_NO_VALIDA,
    );
  });
});
