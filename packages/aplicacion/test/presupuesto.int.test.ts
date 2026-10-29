// Operaciones de presupuesto y metas OP-14, OP-15, OP-17 y OP-18 contra PostgreSQL como `finn_app` (TA-164; 04 §3.3,
// §4.2, §4.3, §4.6; 01 inv. 18, 19 y 20; CH-31). Cada caso crea sus propias categorías (ids 900+) con OP-07 y lee lo
// que necesita de la base; los de OP-18 usan también las metas 50 y 51 y la categoría de pago 13 de los hechos de prueba.
import { beforeAll, describe, expect, it } from 'vitest';
import { calcular } from '@finn/dominio';
import type { Cambio, Hechos, Instante, Uuid } from '@finn/dominio';
import { FechaLocal } from '@finn/dominio/valores';
import { cargarHechos, escribir, leer, Memoria } from '@finn/db';
import { crearBasePrueba } from '../../db/test/ayudantes/base.ts';
import { escribirHechosDePrueba, HOY, RELOJ } from '../../db/test/ayudantes/hechos-prueba.ts';
import {
  confirmar,
  previsualizar,
  type DefinicionOperacion,
  type DepsMarco,
} from '../src/operaciones/marco.ts';
import { OP07 } from '../src/operaciones/categorias/index.ts';
import { OP14, OP15, OP17, OP18 } from '../src/operaciones/presupuesto/index.ts';

const uuid = (n: number): Uuid => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}` as Uuid;
const CP = uuid(13), // Visa: categoría de pago
  G1 = uuid(10); // Gastos
const INSTANTE = `${HOY}T12:00:00.000Z` as Instante;
const c = (n: number) => n as never; // Centavos de la prueba
const contiene = (t: string): string => expect.stringContaining(t) as string;
/** Centavos a texto decimal con dos decimales, sin coma flotante. */
const texto = (centavos: number): string =>
  `${Math.trunc(centavos / 100)}.${String(centavos % 100).padStart(2, '0')}`;

describe('PRU-INT-PRES', () => {
  const base = crearBasePrueba();
  const deps = (): DepsMarco => ({
    memoria: new Memoria(),
    opciones: () => RELOJ,
    instante: () => INSTANTE,
  });
  const hechos = (): Promise<Hechos> => leer((t) => cargarHechos(t), RELOJ);
  const ejecutar = <E, R, S>(def: DefinicionOperacion<E, R, S>, entrada: unknown) =>
    confirmar(def, entrada, deps());
  const preparar = <E, R, S>(def: DefinicionOperacion<E, R, S>, entrada: unknown) =>
    previsualizar(def, entrada, deps());
  const escribirCambios = (cambios: Cambio[]) =>
    escribir((tx) => tx.aplicarCambios(cambios), RELOJ);
  const activo = (h: Hechos) => calcular(h, FechaLocal.desdeTexto(HOY)).presupuesto.activo;
  const inicioA = (h: Hechos) => activo(h).inicio;
  /** El inicio del período siguiente al activo (futuro). */
  const inicioFuturo = (h: Hechos) => FechaLocal.sumarDias(activo(h).fin, 1);
  const lpa = (h: Hechos) => calcular(h, FechaLocal.desdeTexto(HOY)).lpa.total as number;
  const asig = (h: Hechos, categoriaId: Uuid, inicio = inicioA(h)) =>
    h.asignaciones.find((a) => a.categoriaId === categoriaId && a.periodoInicio === inicio)
      ?.monto ?? 0;
  const asignacion = async (id: number, categoriaId: Uuid, monto: number, futuro = false) => {
    const h = await hechos();
    return escribirCambios([
      {
        tipo: 'insertar',
        tabla: 'asignaciones',
        fila: {
          id: uuid(id),
          categoriaId,
          periodoInicio: futuro ? inicioFuturo(h) : inicioA(h),
          monto: c(monto),
          revision: null,
        },
      },
    ]);
  };
  const categoria = (n: number, nombre: string) =>
    ejecutar(OP07, { tipo: 'categoria', id: uuid(n), nombre, grupoId: G1 });
  const archivar = (id: Uuid) =>
    escribirCambios([{ tipo: 'actualizar', tabla: 'categorias', id, campos: { archivada: true } }]);

  beforeAll(async () => {
    await escribirHechosDePrueba(base);
    process.env['DATABASE_URL'] = base.url; // el cliente del proceso (04 §2.5)
  });

  it('PRU-INT-PRES-101 [INV-18] OP-14: asigna y desasigna con valor absoluto, repetirla es ya aplicada y un esperado viejo es conflicto', async () => {
    await categoria(900, 'Ocio');
    const A = inicioA(await hechos());
    const entrada = {
      categoriaId: uuid(900),
      periodoInicio: A,
      montoNuevo: '10.00',
      esperado: { monto: '0' },
    };
    expect(await preparar(OP14, entrada)).toMatchObject({ ok: true, valor: { rechazos: [] } });
    expect(await ejecutar(OP14, entrada)).toMatchObject({ ok: true, yaAplicada: false });
    expect(asig(await hechos(), uuid(900))).toBe(1000);

    expect(await ejecutar(OP14, entrada)).toMatchObject({ ok: true, yaAplicada: true });
    expect(
      await ejecutar(OP14, { ...entrada, montoNuevo: '20.00' }), // lo visto ya no coincide
    ).toMatchObject({
      ok: false,
      error: { categoria: 'CONFLICTO', codigo: 'conflicto_desactualizado' },
    });

    // el valor puede ser negativo (supuesto 6) y 0 elimina la celda (DB-14)
    const aNegativo = { ...entrada, montoNuevo: '-5.00', esperado: { monto: '10.00' } };
    expect(await ejecutar(OP14, aNegativo)).toMatchObject({ ok: true, yaAplicada: false });
    expect(asig(await hechos(), uuid(900))).toBe(-500);
    const aCero = { ...entrada, montoNuevo: '0', esperado: { monto: '-5.00' } };
    expect(await ejecutar(OP14, aCero)).toMatchObject({ ok: true, yaAplicada: false });
    expect((await hechos()).asignaciones.some((a) => a.categoriaId === uuid(900))).toBe(false);
  });

  it('PRU-INT-PRES-101 OP-14: los rechazos del dominio llegan con su código y su mensaje y no escriben', async () => {
    await categoria(901, 'Viajes');
    const h = await hechos();
    const A = inicioA(h);
    const base14 = { categoriaId: uuid(901), montoNuevo: '5.00', esperado: { monto: '0' } };
    expect(
      await ejecutar(OP14, { ...base14, periodoInicio: FechaLocal.sumarDias(A, 1) }),
    ).toMatchObject({
      ok: false,
      error: {
        categoria: 'DOMINIO',
        codigo: 'periodo_no_valido',
        mensaje: 'Ese período no existe.',
      },
    });
    const cerrado = FechaLocal.sumarMeses(A, -1); // el inicio del período anterior (ciclo del 21)
    expect(await ejecutar(OP14, { ...base14, periodoInicio: cerrado })).toMatchObject({
      ok: false,
      error: {
        codigo: 'periodo_cerrado',
        mensaje: 'No se puede cambiar lo asignado en un período cerrado.',
      },
    });
    expect(
      await ejecutar(OP14, { ...base14, categoriaId: uuid(990), periodoInicio: A }),
    ).toMatchObject({ ok: false, error: { categoria: 'NO_ENCONTRADO' } });

    // un futuro exige LPA suficiente: te faltan monto − LPA
    const sobra = lpa(h) + 2500;
    const aFuturo = await ejecutar(OP14, {
      ...base14,
      periodoInicio: inicioFuturo(h),
      montoNuevo: texto(sobra),
    });
    expect(aFuturo).toMatchObject({
      ok: false,
      error: {
        codigo: 'lpa_negativo_en_futuro',
        mensaje: contiene('te faltan $25.00'),
      },
    });
    expect(asig(await hechos(), uuid(901), inicioFuturo(h))).toBe(0);
  });

  it('PRU-INT-PRES-101 [INV-20][CH-31] OP-14: en una archivada no cambia ninguna asignación de un período futuro, ni para restar', async () => {
    // la base no admite asignaciones futuras en una archivada (H10): el dominio rechaza antes, también al restar
    await categoria(902, 'Vieja');
    await archivar(uuid(902));
    const h = await hechos();
    const F = inicioFuturo(h);
    const restar = {
      categoriaId: uuid(902),
      periodoInicio: F,
      montoNuevo: '-5.00',
      esperado: { monto: '0' },
    };
    expect(await ejecutar(OP14, restar)).toMatchObject({
      ok: false,
      error: {
        categoria: 'DOMINIO',
        codigo: 'categoria_archivada',
        mensaje: contiene('Vieja está archivada.'),
      },
    });
    expect(await ejecutar(OP14, { ...restar, montoNuevo: '5.00' })).toMatchObject({
      ok: false,
      error: { codigo: 'categoria_archivada' },
    });
    // sumar en el activo tampoco (δ > 0)
    expect(
      await ejecutar(OP14, { ...restar, periodoInicio: inicioA(h), montoNuevo: '1.00' }),
    ).toMatchObject({ ok: false, error: { codigo: 'categoria_archivada' } });
    expect(asig(await hechos(), uuid(902), F)).toBe(0);
  });

  it('PRU-INT-PRES-101 OP-15: mueve entre dos celdas, repetirla es ya aplicada, un esperado viejo es conflicto y el origen puede quedar sobregirado', async () => {
    await categoria(903, 'Origen');
    await categoria(904, 'Destino');
    await asignacion(905, uuid(903), 5000);
    const A = inicioA(await hechos());
    const entrada = {
      origenId: uuid(903),
      destinoId: uuid(904),
      periodoInicio: A,
      monto: '20.00',
      esperado: { asignacionOrigen: '50.00', asignacionDestino: '0' },
    };
    const antes = lpa(await hechos());
    expect(await preparar(OP15, entrada)).toMatchObject({ ok: true, valor: { rechazos: [] } });
    expect(await ejecutar(OP15, entrada)).toMatchObject({ ok: true, yaAplicada: false });
    let h = await hechos();
    expect([asig(h, uuid(903)), asig(h, uuid(904)), lpa(h)]).toEqual([3000, 2000, antes]);

    expect(await ejecutar(OP15, entrada)).toMatchObject({ ok: true, yaAplicada: true });
    expect(await ejecutar(OP15, { ...entrada, monto: '5.00' })).toMatchObject({
      ok: false,
      error: {
        codigo: 'conflicto_desactualizado',
        datos: { actuales: { asignacionOrigen: 3000, asignacionDestino: 2000 } },
      },
    });

    // mover más que el Disponible deja al origen sobregirado (YNAB): se permite
    const exceso = {
      ...entrada,
      monto: '100.00',
      esperado: { asignacionOrigen: '30.00', asignacionDestino: '20.00' },
    };
    expect(await ejecutar(OP15, exceso)).toMatchObject({ ok: true, yaAplicada: false });
    h = await hechos();
    expect([asig(h, uuid(903)), asig(h, uuid(904))]).toEqual([-7000, 12000]);
  });

  it('PRU-INT-PRES-101 OP-15: los rechazos del dominio llegan con su código y su mensaje', async () => {
    await categoria(906, 'Activa');
    await categoria(907, 'Archivada');
    await archivar(uuid(907));
    const A = inicioA(await hechos());
    const esperado = { asignacionOrigen: '0', asignacionDestino: '0' };
    expect(
      await ejecutar(OP15, {
        origenId: uuid(906),
        destinoId: uuid(906),
        periodoInicio: A,
        monto: '1.00',
        esperado,
      }),
    ).toMatchObject({
      ok: false,
      error: { codigo: 'destino_igual_origen', mensaje: 'Elegí otra categoría.' },
    });
    expect(
      await ejecutar(OP15, {
        origenId: uuid(906),
        destinoId: uuid(907),
        periodoInicio: A,
        monto: '1.00',
        esperado,
      }),
    ).toMatchObject({
      ok: false,
      error: {
        codigo: 'categoria_archivada',
        mensaje: contiene('Archivada está archivada.'),
      },
    });
    // la archivada como origen equivale a OP-11: no puede sacar más que su Disponible
    expect(
      await ejecutar(OP15, {
        origenId: uuid(907),
        destinoId: uuid(906),
        periodoInicio: A,
        monto: '1.00',
        esperado,
      }),
    ).toMatchObject({ ok: false, error: { codigo: 'monto_mayor_que_disponible' } });
  });

  it('PRU-INT-PRES-101 [AV-18] OP-17: asigna lo que falta a la meta sin dejar LPA negativo y una revisión vieja es conflicto', async () => {
    await categoria(910, 'Ahorro');
    const meta = {
      accion: 'crear',
      id: uuid(911),
      categoriaId: uuid(910),
      tipo: 'mensual',
      modo: 'acumular',
      monto: '100.00',
    };
    expect(await ejecutar(OP18, meta)).toMatchObject({ ok: true });
    let h = await hechos();
    const A = inicioA(h);
    const actual = await leer((t) => Promise.resolve(t.estado.revision), RELOJ);

    const entrada = { periodoInicio: A, categorias: [uuid(910)], esperado: { revision: actual } };
    const antes = lpa(h);
    expect(await ejecutar(OP17, entrada)).toMatchObject({ ok: true, yaAplicada: false });
    h = await hechos();
    expect(asig(h, uuid(910))).toBe(Math.min(10000, Math.max(0, antes)));
    expect(lpa(h)).toBeGreaterThanOrEqual(0);

    // la revisión cambió: el resultado ya no es el que vio la interfaz
    expect(await ejecutar(OP17, entrada)).toMatchObject({
      ok: false,
      error: { categoria: 'CONFLICTO', codigo: 'conflicto_desactualizado' },
    });
    expect(
      await ejecutar(OP17, {
        periodoInicio: FechaLocal.sumarDias(A, 1),
        esperado: { revision: actual },
      }),
    ).toMatchObject({ ok: false });
  });

  it('PRU-INT-PRES-101 OP-18: crea una meta, repetir el id es ya aplicada, con otros datos es conflicto_id y los rechazos llegan con su mensaje', async () => {
    await categoria(920, 'Metas');
    await categoria(921, 'Otra');
    await archivar(uuid(921));
    const crear = {
      accion: 'crear',
      id: uuid(922),
      categoriaId: uuid(920),
      tipo: 'semanal',
      modo: 'rellenar_hasta',
      monto: '30.00',
    };
    expect(await preparar(OP18, crear)).toMatchObject({ ok: true, valor: { rechazos: [] } });
    expect(await ejecutar(OP18, crear)).toMatchObject({
      ok: true,
      valor: { id: uuid(922) },
      yaAplicada: false,
    });
    expect((await hechos()).metas.find((m) => m.id === uuid(922))).toMatchObject({
      categoriaId: uuid(920),
      tipo: 'semanal',
      modo: 'rellenar_hasta',
      monto: 3000,
      fechaObjetivo: null,
      fechaCreacion: HOY,
    });
    expect(await ejecutar(OP18, crear)).toMatchObject({ ok: true, yaAplicada: true });
    expect(await ejecutar(OP18, { ...crear, monto: '31.00' })).toMatchObject({
      ok: false,
      error: { categoria: 'CONFLICTO', codigo: 'conflicto_id' },
    });

    expect(await ejecutar(OP18, { ...crear, id: uuid(923) })).toMatchObject({
      ok: false,
      error: { codigo: 'meta_ya_existe', mensaje: 'Metas ya tiene una meta.' },
    });
    expect(await ejecutar(OP18, { ...crear, id: uuid(924), categoriaId: CP })).toMatchObject({
      ok: false,
      error: { codigo: 'meta_en_categoria_de_pago' },
    });
    expect(await ejecutar(OP18, { ...crear, id: uuid(925), categoriaId: uuid(921) })).toMatchObject(
      {
        ok: false,
        error: {
          codigo: 'categoria_archivada',
          mensaje: contiene('Otra está archivada.'),
        },
      },
    );
    await categoria(926, 'Con fecha');
    expect(
      await ejecutar(OP18, {
        accion: 'crear',
        id: uuid(927),
        categoriaId: uuid(926),
        tipo: 'para_fecha',
        monto: '10.00',
        fechaObjetivo: '2027-02-04',
      }),
    ).toMatchObject({
      ok: false,
      error: {
        codigo: 'fecha_objetivo_pasada',
        mensaje: 'La fecha objetivo no puede ser anterior a hoy.',
      },
    });
    // el contrato rechaza la forma que rompería ck_metas_* antes de llegar al dominio
    expect(
      await ejecutar(OP18, {
        accion: 'crear',
        id: uuid(928),
        categoriaId: uuid(926),
        tipo: 'mensual',
        monto: '10.00',
      }),
    ).toMatchObject({ ok: false, error: { categoria: 'VALIDACION' } });
  });

  it('PRU-INT-PRES-101 OP-18: edita con valor absoluto (extender la fecha, ajustar el monto) y elimina con eliminación idempotente', async () => {
    const extender = {
      accion: 'editar',
      metaId: uuid(51),
      fechaObjetivo: '2028-06-30',
      esperado: { fechaObjetivo: '2027-12-31' },
    };
    expect(await preparar(OP18, extender)).toMatchObject({ ok: true, valor: { rechazos: [] } });
    expect(await ejecutar(OP18, extender)).toMatchObject({ ok: true, yaAplicada: false });
    expect((await hechos()).metas.find((m) => m.id === uuid(51))?.fechaObjetivo).toBe('2028-06-30');
    expect(await ejecutar(OP18, extender)).toMatchObject({ ok: true, yaAplicada: true });
    expect(await ejecutar(OP18, { ...extender, fechaObjetivo: '2029-01-01' })).toMatchObject({
      ok: false,
      error: {
        codigo: 'conflicto_desactualizado',
        datos: { actuales: { fechaObjetivo: '2028-06-30' } },
      },
    });

    const ajustar = {
      accion: 'editar',
      metaId: uuid(50),
      monto: '350.00',
      esperado: { monto: '300.00' },
    };
    expect(await ejecutar(OP18, ajustar)).toMatchObject({ ok: true, yaAplicada: false });
    expect((await hechos()).metas.find((m) => m.id === uuid(50))?.monto).toBe(c(35000));
    expect(
      await ejecutar(OP18, {
        accion: 'editar',
        metaId: uuid(999),
        monto: '1.00',
        esperado: { monto: '1.00' },
      }),
    ).toMatchObject({
      ok: false,
      error: { categoria: 'NO_ENCONTRADO' },
    });

    const eliminar = { accion: 'eliminar', metaId: uuid(50) };
    expect(await ejecutar(OP18, eliminar)).toMatchObject({ ok: true, yaAplicada: false });
    expect((await hechos()).metas.some((m) => m.id === uuid(50))).toBe(false);
    expect(await ejecutar(OP18, eliminar)).toMatchObject({ ok: true, yaAplicada: true });
    expect(await ejecutar(OP18, { accion: 'eliminar', metaId: uuid(998) })).toMatchObject({
      ok: false,
      error: { categoria: 'NO_ENCONTRADO' },
    });
  });

  it('PRU-INT-PRES-101 [AV-11] OP-14: dejar LPA negativo en el activo pide confirmar con la huella y una revisionVista vieja vuelve a pedirla', async () => {
    await categoria(930, 'Grande');
    await categoria(931, 'Chica');
    const h0 = await hechos();
    const A = inicioA(h0);
    const entrada = {
      categoriaId: uuid(930),
      periodoInicio: A,
      montoNuevo: texto(Math.max(0, lpa(h0)) + 10000),
      esperado: { monto: '0' },
    };
    const vista = await preparar(OP14, entrada);
    if (!vista.ok) throw new Error(JSON.stringify(vista.error));
    expect(vista.valor.avisos).toContainEqual(expect.objectContaining({ codigo: 'AV-11' }));

    // sin huella no se escribe (4.3)
    expect(await ejecutar(OP14, entrada)).toMatchObject({
      ok: false,
      error: { categoria: 'REQUIERE_CONFIRMACION' },
    });
    expect(asig(await hechos(), uuid(930))).toBe(0);

    // el estado cambió después de la previsualización: la huella vieja ya no vale
    expect(
      await ejecutar(OP14, {
        categoriaId: uuid(931),
        periodoInicio: A,
        montoNuevo: '1.00',
        esperado: { monto: '0' },
      }),
    ).toMatchObject({ ok: true });
    const vieja = {
      ...entrada,
      revisionVista: vista.valor.revisionVista,
      huellaImpacto: vista.valor.huellaImpacto,
    };
    expect(await ejecutar(OP14, vieja)).toMatchObject({
      ok: false,
      error: {
        categoria: 'REQUIERE_CONFIRMACION',
        datos: { revisionVista: vista.valor.revisionVista },
      },
    });
    expect(asig(await hechos(), uuid(930))).toBe(0);

    const nueva = await preparar(OP14, entrada);
    if (!nueva.ok) throw new Error(JSON.stringify(nueva.error));
    const confirmada = {
      ...entrada,
      revisionVista: nueva.valor.revisionVista,
      huellaImpacto: nueva.valor.huellaImpacto,
    };
    expect(await ejecutar(OP14, confirmada)).toMatchObject({ ok: true, yaAplicada: false });
    const h = await hechos();
    expect(asig(h, uuid(930))).toBe(Math.max(0, lpa(h0)) + 10000);
    expect(lpa(h)).toBeLessThan(0);
    expect(await ejecutar(OP14, confirmada)).toMatchObject({ ok: true, yaAplicada: true });
  });
});
