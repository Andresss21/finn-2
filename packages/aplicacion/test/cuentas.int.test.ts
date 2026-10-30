// Operaciones de cuentas OP-01 a OP-06 contra PostgreSQL como `finn_app` (TA-162; 04 §3.1, §4.2, §4.3, §4.6;
// 01 inv. 22 y 24). Cada caso crea sus propias cuentas (ids 900+) y no depende de otro: lee lo que necesita de la base.
import { beforeAll, describe, expect, it } from 'vitest';
import type { Hechos, Instante, Uuid } from '@finn/dominio';
import { cargarHechos, escribir, leer, leerInstituciones, Memoria, sqlstateDe } from '@finn/db';
import { crearBasePrueba } from '../../db/test/ayudantes/base.ts';
import { escribirHechosDePrueba, HOY, RELOJ } from '../../db/test/ayudantes/hechos-prueba.ts';
import {
  confirmar,
  previsualizar,
  type DefinicionOperacion,
  type DepsMarco,
} from '../src/operaciones/marco.ts';
import { OP01, OP02, OP03, OP04, OP05, OP06 } from '../src/operaciones/cuentas/index.ts';

const uuid = (n: number): Uuid => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}` as Uuid;
const E1 = uuid(1); // efectivo con saldo, movimientos y una programada
const T1 = uuid(3); // tarjeta con deuda de $20.00
const INSTANTE = `${HOY}T12:00:00.000Z` as Instante;
const hex64 = expect.stringMatching(/^[0-9a-f]{64}$/) as string;
const texto = expect.any(String) as string;
const contiene = (s: string) => expect.stringContaining(s) as string;

describe('PRU-INT-CTA', () => {
  const base = crearBasePrueba();
  const deps = (): DepsMarco => ({
    memoria: new Memoria(),
    opciones: () => RELOJ,
    instante: () => INSTANTE,
  });
  const hechos = (): Promise<Hechos> => leer((t) => cargarHechos(t), RELOJ);
  const revision = (): Promise<string> => leer((t) => Promise.resolve(t.estado.revision), RELOJ);
  const ejecutar = <E, R, S>(def: DefinicionOperacion<E, R, S>, entrada: unknown) =>
    confirmar(def, entrada, deps());
  const preparar = <E, R, S>(def: DefinicionOperacion<E, R, S>, entrada: unknown) =>
    previsualizar(def, entrada, deps());
  const efectivo = (n: number, extra: Record<string, unknown> = {}) => ({
    id: uuid(n),
    tipo: 'efectivo',
    nombre: `Cuenta ${n}`,
    saldo: '0',
    ...extra,
  });
  const tarjeta = (n: number, extra: Record<string, unknown> = {}) => ({
    id: uuid(n),
    tipo: 'tarjeta',
    nombre: `Tarjeta ${n}`,
    saldo: '0',
    limiteCredito: '1500.00',
    diaCorte: 15,
    diaPago: 5,
    ...extra,
  });

  beforeAll(async () => {
    await escribirHechosDePrueba(base);
    process.env['DATABASE_URL'] = base.url; // el cliente del proceso (04 §2.5)
  });

  it('PRU-INT-CTA-101 OP-01: previsualiza, confirma y relee una cuenta de efectivo con su saldo inicial', async () => {
    const entrada = efectivo(900, { nombre: 'Billetera', saldo: '25.50' });
    const vista = await preparar(OP01, entrada);
    expect(vista).toMatchObject({
      ok: true,
      valor: { rechazos: [], huellaImpacto: hex64 },
    });

    const r = await ejecutar(OP01, entrada);
    expect(r).toMatchObject({ ok: true, valor: { id: uuid(900) }, yaAplicada: false });

    const h = await hechos();
    expect(h.cuentas.find((c) => c.id === uuid(900))).toMatchObject({
      tipo: 'efectivo',
      nombre: 'Billetera',
      archivada: false,
      fechaApertura: HOY,
    });
    const inicial = h.efectos.find((f) => f.cuentaId === uuid(900));
    expect(inicial?.monto).toBe(2550);
    expect(h.transacciones.find((t) => t.id === inicial?.transaccionId)?.tipo).toBe(
      'saldo_inicial',
    );
  });

  it('PRU-INT-CTA-101 [INV-22] OP-01: una tarjeta con deuda crea su subtipo, su categoría de pago y un saldo inicial negativo', async () => {
    const entrada = tarjeta(910, {
      nombre: 'Oro',
      saldo: '100.00',
      tasaAnual: '24.5',
      red: 'visa',
    });
    expect(await ejecutar(OP01, entrada)).toMatchObject({ ok: true, valor: { id: uuid(910) } });
    const h = await hechos();
    expect(h.tarjetas.find((t) => t.cuentaId === uuid(910))).toMatchObject({
      limiteCredito: 150000,
      tasaAnualMillonesimas: 245000,
      diaCorte: 15,
      diaPago: 5,
      red: 'visa',
      color: null,
    });
    expect(h.categorias.find((c) => c.tarjetaId === uuid(910))).toMatchObject({
      nombre: 'Oro',
      clase: 'pago',
      archivada: false,
    });
    expect(h.efectos.find((f) => f.cuentaId === uuid(910))?.monto).toBe(-10000);
  });

  it('PRU-INT-CTA-101 OP-01: un préstamo y una inversión guardan sus atributos con las tasas en millonésimas', async () => {
    const prestamo = {
      id: uuid(920),
      tipo: 'prestamo',
      nombre: 'Carro',
      saldo: '4500.00',
      contraparte: 'Banco',
      montoOriginal: '5000.00',
      tasaNominalAnual: '12.7525',
      tipoTasa: 'fija',
      frecuencia: 'cada_n_dias',
      frecuenciaDias: 14,
      cuotaPactada: '250.00',
      plazoCuotas: 24,
      cuotasPagadasAlCrear: 2,
    };
    const inversion = {
      id: uuid(921),
      tipo: 'inversion',
      nombre: 'Fondo B',
      saldo: '300.00',
      rendimientoAnualEsperado: '5',
    };
    expect(await ejecutar(OP01, prestamo)).toMatchObject({ ok: true });
    expect(await ejecutar(OP01, inversion)).toMatchObject({ ok: true });
    const h = await hechos();
    expect(h.prestamos.find((p) => p.cuentaId === uuid(920))).toMatchObject({
      tasaNominalAnualMillonesimas: 127525,
      frecuenciaDias: 14,
      montoOriginal: 500000,
      cuotaPactada: 25000,
      seguroPrimerMes: null,
      modeloCalculo: null,
    });
    expect(h.inversiones.find((i) => i.cuentaId === uuid(921))).toMatchObject({
      rendimientoAnualEsperadoMillonesimas: 50000,
    });
    // la coherencia del préstamo la valida el contrato (03 §3.6)
    const mala = await ejecutar(OP01, { ...prestamo, id: uuid(922), frecuenciaDias: undefined });
    expect(mala).toMatchObject({
      ok: false,
      error: { categoria: 'VALIDACION', campos: { frecuenciaDias: texto } },
    });
  });

  it('PRU-INT-CTA-101 OP-01: el mismo id con la misma solicitud es ya aplicada y con otra es conflicto_id, sin escribir', async () => {
    const entrada = efectivo(930, { saldo: '10.00' });
    expect(await ejecutar(OP01, entrada)).toMatchObject({ ok: true, yaAplicada: false });
    const antes = await revision();

    expect(await ejecutar(OP01, entrada)).toEqual({
      ok: true,
      valor: { id: uuid(930) },
      yaAplicada: true,
      avisos: [],
    });
    expect(await ejecutar(OP01, { ...entrada, nombre: 'Otra' })).toMatchObject({
      ok: false,
      error: { categoria: 'CONFLICTO', codigo: 'conflicto_id' },
    });
    expect(await ejecutar(OP01, { ...entrada, saldo: '11.00' })).toMatchObject({
      ok: false,
      error: { codigo: 'conflicto_id' },
    });
    expect(await revision()).toBe(antes);
  });

  it('PRU-INT-CTA-101 OP-01: los rechazos del dominio llegan con su código y mensaje y no escriben', async () => {
    const h0 = await hechos();
    const institucionId = h0.cuentas.find((c) => c.id === E1)?.institucionId;
    const antes = await revision();

    const repetidos = await ejecutar(
      OP01,
      efectivo(940, { institucionId, ultimos4: '1234', nombre: 'Débito' }),
    );
    expect(repetidos).toMatchObject({
      ok: false,
      error: {
        categoria: 'DOMINIO',
        codigo: 'ultimos4_repetidos',
        mensaje: contiene('terminada en 1234'),
      },
    });
    // BE-35: el nombre de una tarjeta es el de su categoría de pago, sin distinguir mayúsculas
    const visa = await ejecutar(OP01, tarjeta(941, { nombre: 'VISA' }));
    expect(visa).toMatchObject({ ok: false, error: { codigo: 'nombre_repetido' } });
    const futura = await ejecutar(OP01, efectivo(942, { fechaApertura: '2027-02-06' }));
    expect(futura).toMatchObject({
      ok: false,
      error: { codigo: 'fecha_posterior_a_hoy', mensaje: contiene('05/02/2027') },
    });
    expect(await revision()).toBe(antes);
  });

  it('PRU-INT-CTA-101 OP-02: edita una tarjeta con lo esperado, es idempotente y rechaza un valor desactualizado', async () => {
    await ejecutar(OP01, tarjeta(950, { nombre: 'Clásica' }));
    const cambio = {
      cuentaId: uuid(950),
      nombre: 'Platino',
      limiteCredito: '2000.00',
      esperado: { nombre: 'Clásica', limiteCredito: '1500.00' },
    };
    expect(await preparar(OP02, cambio)).toMatchObject({ ok: true, valor: { rechazos: [] } });
    expect(await ejecutar(OP02, cambio)).toMatchObject({ ok: true, valor: {}, yaAplicada: false });
    const h = await hechos();
    expect(h.cuentas.find((c) => c.id === uuid(950))?.nombre).toBe('Platino');
    expect(h.tarjetas.find((t) => t.cuentaId === uuid(950))?.limiteCredito).toBe(200000);
    // BE-35: la categoría de pago sigue el nombre de la tarjeta
    expect(h.categorias.find((c) => c.tarjetaId === uuid(950))?.nombre).toBe('Platino');

    expect(await ejecutar(OP02, cambio)).toMatchObject({ ok: true, yaAplicada: true });
    const viejo = await ejecutar(OP02, {
      cuentaId: uuid(950),
      nombre: 'Black',
      esperado: { nombre: 'Clásica' },
    });
    expect(viejo).toMatchObject({
      ok: false,
      error: {
        categoria: 'CONFLICTO',
        codigo: 'conflicto_desactualizado',
        datos: { actuales: { nombre: 'Platino' } },
      },
    });
    const sinEsperado = await ejecutar(OP02, {
      cuentaId: uuid(950),
      nombre: 'Black',
      esperado: {},
    });
    expect(sinEsperado).toMatchObject({
      ok: false,
      error: { categoria: 'VALIDACION', campos: { 'esperado.nombre': texto } },
    });
    const ajena = await ejecutar(OP02, {
      cuentaId: uuid(950),
      contraparte: 'X',
      esperado: { contraparte: null },
    });
    expect(ajena).toMatchObject({ ok: false, error: { categoria: 'INTERNO' } });
  });

  it('PRU-INT-CTA-101 OP-03: reordena las cuentas abiertas, es idempotente y rechaza una lista incompleta', async () => {
    await ejecutar(OP01, efectivo(960));
    await ejecutar(OP01, efectivo(961));
    const abiertas = (await hechos()).cuentas
      .filter((c) => !c.archivada)
      .sort((a, b) => a.orden - b.orden || (a.id < b.id ? -1 : 1))
      .map((c) => c.id);
    const nueva = [...abiertas].reverse();

    expect(await ejecutar(OP03, { orden: nueva })).toMatchObject({ ok: true, yaAplicada: false });
    const despues = (await hechos()).cuentas
      .filter((c) => !c.archivada)
      .sort((a, b) => a.orden - b.orden);
    expect(despues.map((c) => c.id)).toEqual(nueva);
    expect(despues.map((c) => c.orden)).toEqual(nueva.map((_, i) => (i + 1) * 10));

    const antes = await revision();
    expect(await ejecutar(OP03, { orden: nueva })).toMatchObject({ ok: true, yaAplicada: true });
    expect(await ejecutar(OP03, { orden: nueva.slice(1) })).toMatchObject({
      ok: false,
      error: {
        categoria: 'CONFLICTO',
        codigo: 'conflicto_desactualizado',
        datos: { actuales: { orden: nueva } },
      },
    });
    expect(await revision()).toBe(antes);
  });

  it('PRU-INT-CTA-101 OP-04 y OP-05: archivan y desarchivan una tarjeta con su categoría de pago, de forma natural', async () => {
    await ejecutar(OP01, tarjeta(970));
    await ejecutar(OP01, efectivo(971));
    const archivada = (h: Hechos, id: Uuid) => h.cuentas.find((c) => c.id === id)?.archivada;
    const pago = (h: Hechos) => h.categorias.find((c) => c.tarjetaId === uuid(970))?.archivada;

    expect(await ejecutar(OP04, { cuentaId: uuid(970) })).toMatchObject({
      ok: true,
      yaAplicada: false,
    });
    let h = await hechos();
    expect([archivada(h, uuid(970)), pago(h)]).toEqual([true, true]);
    expect(await ejecutar(OP04, { cuentaId: uuid(970) })).toMatchObject({
      ok: true,
      yaAplicada: true,
    });
    expect(await preparar(OP04, { cuentaId: uuid(970) })).toMatchObject({
      ok: true,
      valor: { rechazos: [{ codigo: 'cuenta_ya_archivada' }] },
    });

    expect(await ejecutar(OP05, { cuentaId: uuid(970) })).toMatchObject({
      ok: true,
      yaAplicada: false,
    });
    h = await hechos();
    expect([archivada(h, uuid(970)), pago(h)]).toEqual([false, false]);
    expect(await ejecutar(OP05, { cuentaId: uuid(970) })).toMatchObject({
      ok: true,
      yaAplicada: true,
    });

    expect(await ejecutar(OP04, { cuentaId: uuid(971) })).toMatchObject({ ok: true });
    expect(archivada(await hechos(), uuid(971))).toBe(true);
    expect(await ejecutar(OP04, { cuentaId: uuid(999) })).toMatchObject({
      ok: false,
      error: { categoria: 'NO_ENCONTRADO' },
    });
  });

  it('PRU-INT-CTA-101 [INV-24] OP-04: archivar una tarjeta con deuda o una cuenta con saldo se rechaza en la operación y en la base', async () => {
    const antes = await revision();
    const deuda = await ejecutar(OP04, { cuentaId: T1 });
    expect(deuda).toMatchObject({
      ok: false,
      error: {
        categoria: 'DOMINIO',
        codigo: 'tarjeta_con_deuda',
        mensaje: contiene('$20.00'),
      },
    });
    expect(await ejecutar(OP04, { cuentaId: E1 })).toMatchObject({
      ok: false,
      error: { categoria: 'DOMINIO', codigo: 'cuenta_con_saldo' },
    });
    expect(await preparar(OP04, { cuentaId: T1 })).toMatchObject({
      ok: true,
      valor: { rechazos: [{ codigo: 'tarjeta_con_deuda' }] },
    });
    expect(await revision()).toBe(antes);

    // la misma escritura sin pasar por el dominio la rechaza la base: FN005 (inv. 24)
    const enBase = await escribir(
      (tx) =>
        tx.aplicarCambios([
          { tipo: 'actualizar', tabla: 'cuentas', id: T1, campos: { archivada: true } },
        ]),
      RELOJ,
    ).catch((e: unknown) => e);
    expect(sqlstateDe(enBase)).toMatchObject({ sqlstate: 'FN005' });
    expect((await hechos()).cuentas.find((c) => c.id === T1)?.archivada).toBe(false);
  });

  it('PRU-INT-CTA-101 [INV-24] OP-04 y OP-02: los rechazos nombran la cuenta sin huecos y conflicto_desactualizado trae las claves del contrato', async () => {
    const h = await hechos();
    const nombre = (id: Uuid) => h.cuentas.find((c) => c.id === id)?.nombre ?? '?';
    const deuda = await ejecutar(OP04, { cuentaId: T1 });
    expect(deuda).toMatchObject({
      ok: false,
      error: { mensaje: `${nombre(T1)} todavía tiene una deuda de $20.00.` },
    });
    const saldo = await ejecutar(OP04, { cuentaId: E1 });
    expect(saldo).toMatchObject({
      ok: false,
      error: { mensaje: contiene(`Para archivar ${nombre(E1)}, su saldo`) },
    });
    expect(await preparar(OP04, { cuentaId: T1 })).toMatchObject({
      ok: true,
      valor: { rechazos: [{ codigo: 'tarjeta_con_deuda', datos: { cuenta: nombre(T1) } }] },
    });

    await ejecutar(OP01, tarjeta(955, { tasaAnual: '24.5' }));
    const viejo = await ejecutar(OP02, {
      cuentaId: uuid(955),
      tasaAnual: '30',
      esperado: { tasaAnual: '20' },
    });
    if (viejo.ok || viejo.error.datos === undefined) throw new Error('debía ser un conflicto');
    expect(viejo.error).toMatchObject({ codigo: 'conflicto_desactualizado' });
    expect(viejo.error.datos['actuales']).toEqual({ tasaAnual: 245000 });

    // `instituciones` es [H]: el marco lee su nombre en la misma transacción (ultimos4_repetidos)
    const institucionId = h.cuentas.find((c) => c.id === E1)?.institucionId;
    const instituciones = await leer((t) => leerInstituciones(t), RELOJ);
    const institucion = instituciones.find((i) => i.id === institucionId)?.nombre ?? '?';
    expect(institucion.length).toBeGreaterThan(1);
    const repetida = efectivo(956, { institucionId, ultimos4: '1234', nombre: 'Débito 2' });
    expect(await ejecutar(OP01, repetida)).toMatchObject({
      ok: false,
      error: {
        codigo: 'ultimos4_repetidos',
        mensaje: `Ya tenés una cuenta de ${institucion} terminada en 1234.`,
      },
    });
    expect(await preparar(OP01, repetida)).toMatchObject({
      ok: true,
      valor: { rechazos: [{ codigo: 'ultimos4_repetidos', datos: { institucion } }] },
    });
  });

  it('PRU-INT-CTA-101 [AV-15] OP-06: elimina una cuenta solo con la huella de su previsualización y la repetición es ya aplicada', async () => {
    await ejecutar(OP01, efectivo(980, { saldo: '10.00' }));
    await ejecutar(OP01, tarjeta(981));
    const entrada = { cuentaId: uuid(980) };

    const vista = await preparar(OP06, entrada);
    if (!vista.ok) throw new Error(JSON.stringify(vista.error));
    expect(vista.valor.impacto?.deltaLpa).toBe(-1000);
    expect(vista.valor.avisos).toContainEqual(expect.objectContaining({ codigo: 'AV-15' }));

    // siempre se confirma: sin huella no se escribe (4.3)
    expect(await ejecutar(OP06, entrada)).toMatchObject({
      ok: false,
      error: { categoria: 'REQUIERE_CONFIRMACION', codigo: 'requiere_confirmacion' },
    });
    expect((await hechos()).cuentas.some((c) => c.id === uuid(980))).toBe(true);

    const confirmada = {
      ...entrada,
      revisionVista: vista.valor.revisionVista,
      huellaImpacto: vista.valor.huellaImpacto,
    };
    expect(await ejecutar(OP06, confirmada)).toMatchObject({ ok: true, yaAplicada: false });
    const h = await hechos();
    expect(h.cuentas.some((c) => c.id === uuid(980))).toBe(false);
    expect(h.efectos.some((f) => f.cuentaId === uuid(980))).toBe(false);

    // eliminación (4.6.3): la fila ya no existe pero `eliminaciones` la registra
    expect(await ejecutar(OP06, confirmada)).toMatchObject({ ok: true, yaAplicada: true });
    expect(await ejecutar(OP06, { cuentaId: uuid(998) })).toMatchObject({
      ok: false,
      error: { categoria: 'NO_ENCONTRADO' },
    });

    // una tarjeta se lleva su categoría de pago
    const t = await preparar(OP06, { cuentaId: uuid(981) });
    if (!t.ok) throw new Error(JSON.stringify(t.error));
    const conf = { cuentaId: uuid(981), huellaImpacto: t.valor.huellaImpacto };
    expect(await ejecutar(OP06, conf)).toMatchObject({ ok: true });
    const despues = await hechos();
    expect(despues.categorias.some((c) => c.tarjetaId === uuid(981))).toBe(false);
    expect(despues.tarjetas.some((x) => x.cuentaId === uuid(981))).toBe(false);
  });

  it('PRU-INT-CTA-101 OP-06: con una revisionVista vieja y otro impacto vuelve a pedir confirmación; con movimientos se rechaza', async () => {
    await ejecutar(OP01, efectivo(990, { saldo: '5.00' }));
    const entrada = { cuentaId: uuid(990) };
    const vista = await preparar(OP06, entrada);
    if (!vista.ok) throw new Error(JSON.stringify(vista.error));
    await ejecutar(OP01, efectivo(991)); // otra escritura: la revisión de la vista queda vieja

    const vieja = await ejecutar(OP06, {
      ...entrada,
      revisionVista: vista.valor.revisionVista,
      huellaImpacto: 'a'.repeat(64),
    });
    expect(vieja).toMatchObject({
      ok: false,
      error: {
        categoria: 'REQUIERE_CONFIRMACION',
        datos: { revisionVista: vista.valor.revisionVista },
        previsualizacion: { huellaImpacto: vista.valor.huellaImpacto },
      },
    });
    if (vieja.ok) throw new Error('debía pedir confirmación');
    expect(vieja.error.datos?.['revisionActual']).not.toBe(vista.valor.revisionVista);
    expect((await hechos()).cuentas.some((c) => c.id === uuid(990))).toBe(true);

    // con la previsualización nueva que devolvió el error sí se elimina
    const nueva = vieja.error.previsualizacion;
    expect(
      await ejecutar(OP06, {
        ...entrada,
        revisionVista: nueva?.['revisionVista'],
        huellaImpacto: nueva?.huellaImpacto,
      }),
    ).toMatchObject({ ok: true });

    const conMovimientos = await preparar(OP06, { cuentaId: E1 });
    expect(conMovimientos).toMatchObject({
      ok: true,
      valor: { rechazos: [{ codigo: 'cuenta_con_movimientos' }] },
    });
  });
});
