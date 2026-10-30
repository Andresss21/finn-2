// Conciliar con la carga firmada contra PostgreSQL como `finn_app` (TA-184; 04 §3.8, §9.1 a §9.7; BE-49, V-26, CH-06).
// OP-45 lee un CSV sintético de BAC débito, clasifica y firma; OP-46 y OP-47 verifican la carga antes de escribir. El
// vencimiento se mide con el reloj inyectado (`ahoraMs`), así "vencida por 1 ms" es exacta. Las claves de prueba son
// bytes repetidos, no secretos (gitleaks). La cuenta es el efectivo 1 de los hechos de prueba; la categoría, Comida.
import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { Hechos, Instante, Uuid } from '@finn/dominio';
import { cargarHechos, eventoPorIdError, leer, Memoria } from '@finn/db';
import { crearBasePrueba } from '../../db/test/ayudantes/base.ts';
import { escribirHechosDePrueba, HOY, RELOJ } from '../../db/test/ayudantes/hechos-prueba.ts';
import type { ClavesConciliacion } from '../src/conciliacion/carga.ts';
import { crearConciliacion } from '../src/operaciones/conciliacion/index.ts';
import { confirmar, previsualizar, type DepsMarco } from '../src/operaciones/marco.ts';
import { OP01 } from '../src/operaciones/cuentas/index.ts';
import { OP20, OP24 } from '../src/operaciones/transacciones/index.ts';
import { mensajeDeRechazo } from '../src/errores/index.ts';

// Un fallo inesperado del lector con datos del archivo en su mensaje: ningún CSV lo provoca; sin él, el lector real
const lector = vi.hoisted(() => ({ fallo: null as Error | null }));
vi.mock('@finn/conciliacion', async (original) => {
  const real = await original<typeof import('@finn/conciliacion')>();
  return {
    ...real,
    leerEstado: (b: Uint8Array) => {
      if (lector.fallo !== null) throw lector.fallo;
      return real.leerEstado(b);
    },
  };
});

const uuid = (n: number): Uuid => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}` as Uuid;
const E1 = uuid(1), // efectivo
  E2 = uuid(2), // efectivo
  T1 = uuid(3), // tarjeta, con su categoría de pago
  C1 = uuid(11), // Comida
  C2 = uuid(12), // la categoría del préstamo
  COBRABLE = uuid(303); // el por cobrar de Ana: $15.00 − $10.00 cobrados − $3.00 condonados = $2.00 abiertos
const OTRA_FECHA = '2027-02-01'; // la que pondría el formulario: manda la del movimiento
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

const texto = (lineas: readonly string[]) => new TextEncoder().encode(lineas.join('\n') + '\n');
const ENCABEZADO_DEBITO = [
  'Detalle de Estado Bancario',
  'Fecha de corte,04/02/2027',
  'Saldo Inicial,"1,000.00"',
  'Saldo Final,"988.12"',
  'Fecha,Descripcion,Referencia,Debito,Credito',
];
// Un solo movimiento, con su propio monto: dos pruebas con el mismo monto se emparejarían entre sí (BE-48)
const cargo = (monto: string) => texto([...ENCABEZADO_DEBITO, `04/02/2027,CARGO,,${monto},`]);
const abono = (monto: string) => texto([...ENCABEZADO_DEBITO, `04/02/2027,ABONO,,,${monto}`]);
/** BAC tarjeta sintético (⚠ S6-1): el monto del archivo es positivo en un cargo y negativo en un pago. */
const enTarjeta = (monto: string) =>
  texto([
    'Pro000000000000duct,VISA ****1234',
    'Fecha de corte,04/02/2027',
    'Saldo final,"1,234.50"',
    'Date,Description,Reference,Amount',
    `04/02/2027,MOVIMIENTO,,${monto}`,
  ]);

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

  /** Agrega el único movimiento de `archivo`: previsualiza, confirma con la huella y repite; devuelve lo que quedó. */
  const agregarUnico = async (
    cuentaId: Uuid,
    archivo: Uint8Array,
    operacion: string,
    datos: Readonly<Record<string, unknown>>,
  ) => {
    ahora = T0;
    const c = con(ROTADAS);
    const r45 = await c.iniciar({ cuentaId, archivo }, deps());
    if (!r45.ok) throw new Error(`OP-45 falló: ${r45.error.codigo}`);
    const alta = {
      cuentaId,
      carga: r45.valor.carga,
      movimientoIndice: 0,
      operacion,
      datos: { fecha: OTRA_FECHA, ...datos },
    };
    const vista = await previsualizar(c.OP46, alta, deps());
    if (!vista.ok) throw new Error(`previsualizar falló: ${vista.error.codigo}`);
    expect(vista.valor.rechazos).toEqual([]);
    const { revisionVista, huellaImpacto } = vista.valor;
    const conHuella = { ...alta, revisionVista, huellaImpacto };
    expect(await confirmar(c.OP46, conHuella, deps())).toMatchObject({
      ok: true,
      valor: { id: datos['id'] },
      yaAplicada: false,
    });
    // `comoManual`: la repetición se compara con la huella del alta, aunque su origen sea `importada`
    expect(await confirmar(c.OP46, conHuella, deps())).toMatchObject({
      ok: true,
      valor: { id: datos['id'] },
      yaAplicada: true,
    });
    const h = await hechos();
    const t = h.transacciones.find((x) => x.id === datos['id']);
    expect(t).toMatchObject({ origen: 'importada', estadoBancario: 'confirmada', fecha: FECHA });
    return {
      alta,
      c,
      tipo: t?.tipo,
      linea: t?.lineaCobradaId,
      efectos: h.efectos
        .filter((f) => f.transaccionId === datos['id'])
        .map((f) => [f.cuentaId, f.monto] as const),
      propuesta: vista.valor.propuesta,
    };
  };

  it('PRU-SEG-CONC-001 [CB-18, INV-14] OP-46 con OP-20: gasto con la fecha y el monto del movimiento; otras líneas son conflicto_id; repetir vencida es ya aplicada', async () => {
    const r = await agregarUnico(E1, cargo('12.01'), 'OP-20', {
      id: uuid(1900),
      cuentaId: E1,
      total: '12.01',
      lineas: [{ monto: '12.01', destino: { categoriaId: C1 } }],
    });
    expect(r).toMatchObject({ tipo: 'gasto', efectos: [[E1, -1201]] });
    const otras = { ...r.alta.datos, lineas: [{ monto: '12.01', destino: { categoriaId: C2 } }] };
    expect(await confirmar(r.c.OP46, { ...r.alta, datos: otras }, deps())).toMatchObject({
      ok: false,
      error: { categoria: 'CONFLICTO', codigo: 'conflicto_id' },
    });
    ahora = T0 + 2 * DIA_MS;
    expect(await confirmar(r.c.OP46, r.alta, deps())).toMatchObject({ ok: true, yaAplicada: true });
  });

  it('PRU-SEG-CONC-001 [CB-18, INV-14] OP-46 con OP-22: transferencia que sale de la cuenta del estado', async () => {
    const r = await agregarUnico(E1, cargo('12.02'), 'OP-22', {
      id: uuid(1901),
      origenId: E1,
      destinoId: E2,
      total: '12.02',
    });
    expect(r.efectos).toEqual(
      expect.arrayContaining([
        [E1, -1202],
        [E2, 1202],
      ]),
    );
  });

  it('PRU-SEG-CONC-001 [CB-18, INV-14] OP-46 con OP-23: pago de tarjeta desde el estado del efectivo y desde el de la tarjeta', async () => {
    const desdeEfectivo = await agregarUnico(E1, cargo('12.03'), 'OP-23', {
      id: uuid(1902),
      origenId: E1,
      tarjetaId: T1,
      total: '12.03',
    });
    expect(desdeEfectivo.tipo).toBe('pago_tarjeta');
    expect(desdeEfectivo.efectos).toEqual(
      expect.arrayContaining([
        [E1, -1203],
        [T1, 1203],
      ]),
    );
    const desdeTarjeta = await agregarUnico(T1, enTarjeta('-12.04'), 'OP-23', {
      id: uuid(1903),
      origenId: E2,
      tarjetaId: T1,
      total: '12.04',
    });
    expect(desdeTarjeta.efectos).toEqual(
      expect.arrayContaining([
        [E2, -1204],
        [T1, 1204],
      ]),
    );
  });

  it('PRU-SEG-CONC-001 [CB-18, INV-14] OP-46 con OP-24: la cuota devuelve en propuesta el desglose del modelo, igual que OP-24; el abono no propone', async () => {
    // Banco Agrícola mensual (el de los hechos de prueba no es mensual y no propone): cuota 1 el 31 de enero, a 4 días
    const P2 = uuid(1898);
    const prestamo = {
      id: P2,
      tipo: 'prestamo',
      nombre: 'Con modelo',
      saldo: '10000.00',
      fechaApertura: '2026-12-31',
      contraparte: 'Banco',
      montoOriginal: '10000.00',
      tasaNominalAnual: '12',
      tipoTasa: 'fija',
      seguroPrimerMes: '10.00',
      frecuencia: 'mensual',
      cuotaPactada: '500.00',
      plazoCuotas: 24,
      modeloCalculo: 'banco_agricola',
      cuotasPagadasAlCrear: 0,
    };
    // La apertura cae en un período cerrado (AV-01): se confirma con la huella de la previsualización
    const vistaPrestamo = await previsualizar(OP01, prestamo, deps());
    if (!vistaPrestamo.ok) throw new Error(vistaPrestamo.error.codigo);
    const { huellaImpacto } = vistaPrestamo.valor;
    expect(await confirmar(OP01, { ...prestamo, huellaImpacto }, deps())).toMatchObject({
      ok: true,
    });
    const base24 = { origenId: E1, prestamoId: P2, categoriaId: C2 };
    const cuota = {
      ...base24,
      id: uuid(1904),
      modalidad: 'cuota',
      total: '50.11',
      capital: '40.11',
      interes: '8.00',
      seguro: '2.00',
    };
    const directa = await previsualizar(OP24, { ...cuota, id: uuid(1999), fecha: FECHA }, deps());
    if (!directa.ok) throw new Error(directa.error.codigo);
    expect(directa.valor.propuesta).toMatchObject({
      desglosePropuesto: { numeroCuota: 1 },
      cuotaEmparejada: { numero: 1, fecha: '2027-01-31' },
    });
    const r = await agregarUnico(E1, cargo('50.11'), 'OP-24', cuota);
    expect(r.tipo).toBe('cuota_prestamo');
    expect(r.efectos).toEqual(
      expect.arrayContaining([
        [E1, -5011],
        [P2, -4011],
      ]),
    );
    expect(r.propuesta).toEqual(directa.valor.propuesta);

    const abonado = await agregarUnico(E1, cargo('12.05'), 'OP-24', {
      ...base24,
      id: uuid(1905),
      modalidad: 'abono',
      total: '12.05',
    });
    expect(abonado.tipo).toBe('abono_capital');
    expect(abonado.propuesta).toBeUndefined();
  });

  it('PRU-SEG-CONC-001 [CB-18, INV-14] OP-46 con OP-27: avance que entra al efectivo y entrada en la tarjeta', async () => {
    const avance = await agregarUnico(E1, abono('12.06'), 'OP-27', {
      id: uuid(1906),
      modalidad: 'avance',
      tarjetaId: T1,
      cuentaId: E1,
      total: '12.06',
    });
    expect(avance.tipo).toBe('avance_efectivo');
    expect(avance.efectos).toEqual(
      expect.arrayContaining([
        [T1, -1206],
        [E1, 1206],
      ]),
    );
    const entrada = await agregarUnico(T1, enTarjeta('-12.07'), 'OP-27', {
      id: uuid(1907),
      modalidad: 'entrada',
      tarjetaId: T1,
      total: '12.07',
    });
    expect(entrada).toMatchObject({ tipo: 'entrada_tarjeta', efectos: [[T1, 1207]] });
  });

  it('PRU-SEG-CONC-001 [CB-18, INV-14] OP-46 con OP-31: cobro de un por cobrar; repetir con otra línea es conflicto_id', async () => {
    const r = await agregarUnico(E1, abono('2.00'), 'OP-31', {
      id: uuid(1908),
      lineaId: COBRABLE,
      cuentaId: E1,
      total: '2.00',
    });
    expect(r).toMatchObject({ tipo: 'cobro', linea: COBRABLE, efectos: [[E1, 200]] });
    const otra = { ...r.alta.datos, lineaId: uuid(301) };
    expect(await confirmar(r.c.OP46, { ...r.alta, datos: otra }, deps())).toMatchObject({
      ok: false,
      error: { codigo: 'conflicto_id' },
    });
  });

  it('PRU-SEG-CONC-001 [CB-18, INV-14] OP-46 rechaza el movimiento fuera de la carga, y el alta que no deja en la cuenta el monto del movimiento', async () => {
    ahora = T0;
    const c = con(ROTADAS);
    const carga = await firmar(ROTADAS);
    const fuera = { ...agregar(carga, 1910), movimientoIndice: 99 };
    const VALIDACION = {
      ok: false,
      error: {
        categoria: 'VALIDACION',
        campos: { movimientoIndice: 'Ese movimiento no está en el estado de cuenta.' },
      },
    };
    expect(await confirmar(c.OP46, fuera, deps())).toMatchObject(VALIDACION);
    expect(await previsualizar(c.OP46, fuera, deps())).toMatchObject(VALIDACION);
    const otroMonto = agregar(carga, 1911);
    const datos = { ...otroMonto.datos, total: '25.32' };
    expect(await confirmar(c.OP46, { ...otroMonto, datos }, deps())).toMatchObject({
      ok: false,
      error: { codigo: 'coincidencia_no_valida' },
    });
    const h = await hechos();
    expect(h.transacciones.some((t) => t.id === uuid(1910) || t.id === uuid(1911))).toBe(false);
  });

  it('PRU-SEG-CONC-001 [V-25] errores de OP-45: PDF, formato no reconocido, tipo de cuenta, cuenta inexistente y más de 2 MiB', async () => {
    const c = con(ROTADAS);
    const iniciar = (archivo: Uint8Array, cuentaId: Uuid = E1) =>
      c.iniciar({ cuentaId, archivo }, deps());
    expect(await iniciar(texto(['%PDF-1.7']))).toEqual({
      ok: false,
      error: {
        categoria: 'DOMINIO',
        codigo: 'archivo_pdf',
        mensaje: 'Finn lee el estado de cuenta en CSV, no en PDF.',
      },
    });
    expect(await iniciar(texto(['a,b', '1,2']))).toEqual({
      ok: false,
      error: {
        categoria: 'DOMINIO',
        codigo: 'formato_no_reconocido',
        mensaje:
          'No reconocimos el formato. Descargá el estado de cuenta en CSV desde el portal del banco.',
      },
    });
    expect(await iniciar(CSV, T1)).toEqual({
      ok: false,
      error: {
        categoria: 'DOMINIO',
        codigo: 'cuenta_tipo_no_valido',
        mensaje: 'Esta operación no se puede hacer con una cuenta de tipo tarjeta.',
        datos: { tipo: 'tarjeta' },
      },
    });
    expect(await iniciar(CSV, uuid(9999))).toEqual({
      ok: false,
      error: { categoria: 'NO_ENCONTRADO', codigo: 'no_encontrado', mensaje: 'Esto ya no existe.' },
    });
    expect(await iniciar(new Uint8Array(2 * 1024 * 1024 + 1))).toMatchObject({
      ok: false,
      error: { categoria: 'VALIDACION', campos: { archivo: 'El archivo no puede pasar de 2 MB.' } },
    });
  });

  it('PRU-SEG-CONC-001 [V-25] fila inválida, formato excluido y formato no disponible muestran su texto, no su código', async () => {
    const c = con(ROTADAS);
    const mala = texto([...ENCABEZADO_DEBITO, '99/99/2027,CARGO,,1.00,']);
    expect(await c.iniciar({ cuentaId: E1, archivo: mala }, deps())).toMatchObject({
      ok: false,
      error: {
        categoria: 'DOMINIO',
        codigo: 'fila_invalida',
        mensaje:
          'No pudimos leer la fila 6 del archivo. Descargá de nuevo el estado de cuenta en CSV desde el portal del banco.',
      },
    });
    const excluido = texto(['Historial de movimientos', 'x,y']);
    expect(await c.iniciar({ cuentaId: T1, archivo: excluido }, deps())).toMatchObject({
      ok: false,
      error: {
        codigo: 'formato_excluido',
        mensaje: 'Finn no lee los estados de cuenta de este banco.',
      },
    });
    // Ningún archivo llega hoy a este código: todos los formatos no excluidos tienen adaptador
    expect(mensajeDeRechazo({ codigo: 'formato_no_disponible' })).toBe(
      'Todavía no podemos leer este formato de estado de cuenta.',
    );
  });

  it('PRU-SEG-CONC-001 [V-25] un error inesperado de OP-45 es INTERNO con su evento en eventos_sistema, sin datos del archivo', async () => {
    const c = con(ROTADAS);
    const interno = (idError: string) => ({
      ok: false,
      error: {
        categoria: 'INTERNO',
        codigo: 'interno',
        mensaje: `Algo salió mal y no se guardó nada. Referencia: ${idError}.`,
        idError,
      },
    });
    const iniciar = (idError: string, extra: Partial<DepsMarco> = {}, conc = c) =>
      conc.iniciar({ cuentaId: E1, archivo: CSV }, { ...deps(), nuevoIdError: () => idError, ...extra });
    const eventoDe = (idError: string) => leer((t) => eventoPorIdError(t, idError), RELOJ);
    const DEL_EVENTO = {
      nivel: 'error',
      mensaje: 'INTERNO interno OP-45',
      datos: { operacion: 'OP-45', categoria: 'INTERNO', codigo: 'interno' },
    };

    // Del lector, con el contenido del archivo en el mensaje
    lector.fallo = new TypeError('no se pudo leer SUPER SELECTOS');
    const r1 = await iniciar('E-LECTOR');
    lector.fallo = null;
    expect(r1).toEqual(interno('E-LECTOR'));
    const e1 = await eventoDe('E-LECTOR');
    expect(e1).toMatchObject(DEL_EVENTO);
    expect(JSON.stringify([e1?.mensaje, e1?.datos])).not.toContain('SELECTOS');

    // De la base, dentro de la lectura
    const cargar = () => Promise.reject(new Error('la carga falló'));
    expect(await iniciar('E-CARGA', { cargar })).toEqual(interno('E-CARGA'));
    expect(await eventoDe('E-CARGA')).toMatchObject(DEL_EVENTO);

    // De la firma: la clave activa no está en la lista
    const sinActiva = con({ activa: 'k3', claves: { k1: K1 } });
    expect(await iniciar('E-FIRMA', {}, sinActiva)).toEqual(interno('E-FIRMA'));
    expect(await eventoDe('E-FIRMA')).toMatchObject(DEL_EVENTO);
  });
});
