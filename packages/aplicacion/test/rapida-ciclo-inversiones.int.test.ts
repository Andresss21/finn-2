// OP-16 Asignación rápida, OP-19 Cambiar el ciclo, OP-25 Inversión y OP-26 Desembolso de préstamo contra PostgreSQL como
// `finn_app` (TA-192; 04 §3.3, §3.4, §4.2, §4.3, §4.6; 01 §5). Cada caso va de punta a punta (previsualizar, confirmar,
// releer), repite la entrada y prueba un rechazo del dominio con su código y su mensaje. Los ids nuevos son 1100+; las
// cuentas y categorías son las de los hechos de prueba (efectivo 1 y 2, préstamo 4, inversión 5, categoría 11).
import { beforeAll, describe, expect, it } from 'vitest';
import { calcular } from '@finn/dominio';
import type { Hechos, Instante, Uuid } from '@finn/dominio';
import { FechaLocal } from '@finn/dominio/valores';
import { cargarHechos, leer, Memoria } from '@finn/db';
import { crearBasePrueba } from '../../db/test/ayudantes/base.ts';
import { escribirHechosDePrueba, HOY, RELOJ } from '../../db/test/ayudantes/hechos-prueba.ts';
import {
  confirmar,
  previsualizar,
  type DefinicionOperacion,
  type DepsMarco,
} from '../src/operaciones/marco.ts';
import { OP19 } from '../src/operaciones/ajustes/index.ts';
import { OP07 } from '../src/operaciones/categorias/index.ts';
import { OP14, OP16, OP18 } from '../src/operaciones/presupuesto/index.ts';
import { OP25, OP26 } from '../src/operaciones/transacciones/index.ts';

const uuid = (n: number): Uuid => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}` as Uuid;
const E1 = uuid(1), // efectivo
  P1 = uuid(4), // préstamo
  I1 = uuid(5), // inversión
  C1 = uuid(11), // Comida
  G1 = uuid(10); // grupo Gastos
const INSTANTE = `${HOY}T12:00:00.000Z` as Instante;
const FECHA = '2027-02-04';
const contiene = (t: string): string => expect.stringContaining(t) as string;
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
  const preparar = async <E, R, S>(def: DefinicionOperacion<E, R, S>, entrada: unknown) => {
    const r = await previsualizar(def, entrada, deps());
    if (!r.ok) throw new Error(JSON.stringify(r.error));
    return r.valor;
  };
  /** La entrada con la revisión y la huella que devuelve la previsualización de ahora. */
  const confirmada = async <E, R, S>(def: DefinicionOperacion<E, R, S>, entrada: object) => {
    const v = await preparar(def, entrada);
    return { ...entrada, revisionVista: v.revisionVista, huellaImpacto: v.huellaImpacto };
  };
  const activo = (h: Hechos) => calcular(h, FechaLocal.desdeTexto(HOY)).presupuesto.activo;
  const lpa = (h: Hechos) => calcular(h, FechaLocal.desdeTexto(HOY)).lpa.total as number;
  const asig = (h: Hechos, categoriaId: Uuid, inicio: FechaLocal) =>
    h.asignaciones.find((a) => a.categoriaId === categoriaId && a.periodoInicio === inicio)
      ?.monto ?? 0;
  const categoria = (n: number, nombre: string) =>
    ejecutar(OP07, { tipo: 'categoria', id: uuid(n), nombre, grupoId: G1 });
  const meta = (id: number, categoriaId: Uuid, monto: string) =>
    ejecutar(OP18, {
      accion: 'crear',
      id: uuid(id),
      categoriaId,
      tipo: 'mensual',
      modo: 'rellenar_hasta',
      monto,
    });
  const releer = async (id: Uuid) => {
    const h = await hechos();
    return {
      tx: h.transacciones.find((t) => t.id === id),
      efectos: h.efectos.filter((f) => f.transaccionId === id),
      lineas: h.lineas.filter((l) => l.transaccionId === id),
      h,
    };
  };
  const monto = (efectos: readonly { cuentaId: Uuid; monto: number }[], cuenta: Uuid) =>
    efectos.find((f) => f.cuentaId === cuenta)?.monto;
  const rechazo = (codigo: string, mensaje: string) => ({
    ok: false,
    error: { categoria: 'DOMINIO', codigo, mensaje },
  });

  beforeAll(async () => {
    await escribirHechosDePrueba(base);
    process.env['DATABASE_URL'] = base.url; // el cliente del proceso (04 §2.5)
  });

  it('PRU-INT-PRES-103 [AV-12] OP-19: siempre pide confirmar con la fecha desde la que aplica, una huella vieja vuelve a pedirla y repetirla es ya aplicada', async () => {
    const h0 = await hechos();
    const vigente = h0.vigencias_ciclo.find((v) => v.rigeDesde === null);
    const dia = vigente?.diaInicio ?? 0;
    expect(await ejecutar(OP19, { diaInicio: dia })).toMatchObject(
      rechazo('ciclo_sin_cambio', `El ciclo ya empieza el día ${dia}.`),
    );

    const entrada = { diaInicio: 10 };
    const vista = await preparar(OP19, entrada);
    expect(vista.avisos).toContainEqual(
      expect.objectContaining({
        codigo: 'AV-12',
        datos: {
          diaInicio: 10,
          rigeDesde: '2027-02-21',
          transicionInicio: contiene('2027'),
          transicionFin: contiene('2027'),
        },
      }),
    );
    expect(await ejecutar(OP19, entrada)).toMatchObject({
      ok: false,
      error: { categoria: 'REQUIERE_CONFIRMACION' },
    });
    expect(await ejecutar(OP19, { diaInicio: 32 })).toMatchObject({
      ok: false,
      error: { categoria: 'VALIDACION' },
    });

    // el estado cambió después de la previsualización: la huella vieja ya no vale
    const vieja = {
      ...entrada,
      revisionVista: vista.revisionVista,
      huellaImpacto: vista.huellaImpacto,
    };
    await categoria(1099, 'Futura');
    expect(
      await ejecutar(OP14, {
        categoriaId: uuid(1099),
        periodoInicio: FechaLocal.sumarDias(activo(h0).fin, 1),
        montoNuevo: '1.00',
        esperado: { monto: '0' },
      }),
    ).toMatchObject({ ok: true });
    expect(await ejecutar(OP19, vieja)).toMatchObject({
      ok: false,
      error: { categoria: 'REQUIERE_CONFIRMACION' },
    });
    expect((await hechos()).vigencias_ciclo.some((v) => v.diaInicio === 10)).toBe(false);

    const nueva = await confirmada(OP19, entrada);
    expect(await ejecutar(OP19, nueva)).toMatchObject({ ok: true, yaAplicada: false });
    const h = await hechos();
    expect(h.vigencias_ciclo.find((v) => v.diaInicio === 10)).toMatchObject({
      rigeDesde: '2027-03-21',
    });
    // la vigencia futura de la prueba (día 15) se reemplazó
    expect(h.vigencias_ciclo.some((v) => v.diaInicio === 15)).toBe(false);
    expect(await ejecutar(OP19, nueva)).toMatchObject({ ok: true, yaAplicada: true });
  });

  it('PRU-INT-PRES-103 [AV-11] OP-16: aplica la variante, repetirla es ya aplicada, un esperado viejo es conflicto y dejar LPA negativo pide confirmar con la huella', async () => {
    const A = activo(await hechos()).inicio;
    // falta_meta: Asig + Falta de una meta que rellena hasta 80,00
    await categoria(1100, 'Rápida');
    await meta(1101, uuid(1100), '80.00');
    const falta = {
      categoriaId: uuid(1100),
      periodoInicio: A,
      variante: 'falta_meta',
      esperado: { monto: '0' },
    };
    expect(await preparar(OP16, falta)).toMatchObject({ rechazos: [] });
    expect(await ejecutar(OP16, falta)).toMatchObject({ ok: true, yaAplicada: false });
    expect(asig(await hechos(), uuid(1100), A)).toBe(8000);
    expect(await ejecutar(OP16, falta)).toMatchObject({ ok: true, yaAplicada: true });

    // igual_periodo_anterior: en el período futuro, lo asignado en el activo
    await categoria(1102, 'Igual');
    await ejecutar(OP14, {
      categoriaId: uuid(1102),
      periodoInicio: A,
      montoNuevo: '30.00',
      esperado: { monto: '0' },
    });
    const F = FechaLocal.sumarDias(activo(await hechos()).fin, 1);
    const igual = {
      categoriaId: uuid(1102),
      periodoInicio: F,
      variante: 'igual_periodo_anterior',
      esperado: { monto: '5.00' },
    };
    expect(await ejecutar(OP16, igual)).toMatchObject({
      ok: false,
      error: { categoria: 'CONFLICTO', codigo: 'conflicto_desactualizado' },
    });
    expect(await ejecutar(OP16, { ...igual, esperado: { monto: '0' } })).toMatchObject({
      ok: true,
      yaAplicada: false,
    });
    expect(asig(await hechos(), uuid(1102), F)).toBe(3000);

    // una variante que no se ofrece (sin historial de gasto) es VALIDACION y no escribe
    expect(
      await ejecutar(OP16, {
        ...igual,
        periodoInicio: A,
        variante: 'promedio_gasto',
        esperado: { monto: '30.00' },
      }),
    ).toMatchObject({ ok: false, error: { categoria: 'VALIDACION' } });

    // AV-11: una meta mayor que LPA deja LPA negativo; sin huella no se escribe y una huella vieja vuelve a pedirla
    await categoria(1104, 'Grande');
    const h0 = await hechos();
    await meta(1105, uuid(1104), texto(Math.max(0, lpa(h0)) + 10000));
    const grande = {
      categoriaId: uuid(1104),
      periodoInicio: A,
      variante: 'falta_meta',
      esperado: { monto: '0' },
    };
    expect((await preparar(OP16, grande)).avisos).toContainEqual(
      expect.objectContaining({ codigo: 'AV-11' }),
    );
    expect(await ejecutar(OP16, grande)).toMatchObject({
      ok: false,
      error: { categoria: 'REQUIERE_CONFIRMACION' },
    });
    const vieja = await confirmada(OP16, grande);
    await ejecutar(OP14, {
      categoriaId: uuid(1102),
      periodoInicio: A,
      montoNuevo: '31.00',
      esperado: { monto: '30.00' },
    });
    expect(await ejecutar(OP16, vieja)).toMatchObject({
      ok: false,
      error: { categoria: 'REQUIERE_CONFIRMACION' },
    });
    expect(asig(await hechos(), uuid(1104), A)).toBe(0);
    expect(await ejecutar(OP16, await confirmada(OP16, grande))).toMatchObject({
      ok: true,
      yaAplicada: false,
    });
    expect(lpa(await hechos())).toBeLessThan(0);
  });

  it('PRU-INT-PRES-103 OP-16: un período que no existe y una categoría inexistente llegan con su código y no escriben', async () => {
    const A = activo(await hechos()).inicio;
    const entrada = {
      categoriaId: uuid(1100),
      periodoInicio: FechaLocal.sumarDias(A, 1),
      variante: 'igual_periodo_anterior',
      esperado: { monto: '0' },
    };
    expect(await ejecutar(OP16, entrada)).toMatchObject(
      rechazo('periodo_no_valido', 'Ese período no existe.'),
    );
    expect(
      await ejecutar(OP16, { ...entrada, categoriaId: uuid(990), periodoInicio: A }),
    ).toMatchObject({
      ok: false,
      error: { categoria: 'NO_ENCONTRADO' },
    });
  });

  it('PRU-INT-PRES-103 [CB-28] OP-25: aporta, retira y ajusta una inversión; repetir es ya aplicada, otro contenido con el mismo id es conflicto_id y los rechazos llegan con su mensaje', async () => {
    const aporte = {
      id: uuid(1110),
      modalidad: 'aporte',
      inversionId: I1,
      cuentaId: E1,
      categoriaId: C1,
      fecha: FECHA,
      total: '100.00',
    };
    expect(await preparar(OP25, aporte)).toMatchObject({ rechazos: [] });
    expect(await ejecutar(OP25, aporte)).toMatchObject({
      ok: true,
      yaAplicada: false,
      valor: { id: uuid(1110) },
    });
    const a = await releer(uuid(1110));
    expect(a.tx).toMatchObject({ tipo: 'aporte_inversion', total: 10000 });
    expect([monto(a.efectos, E1), monto(a.efectos, I1)]).toEqual([-10000, 10000]);
    expect(a.lineas).toMatchObject([{ monto: 10000, categoriaId: C1 }]);
    expect(await ejecutar(OP25, aporte)).toMatchObject({ ok: true, yaAplicada: true });
    expect(await ejecutar(OP25, { ...aporte, total: '101.00' })).toMatchObject({
      ok: false,
      error: { categoria: 'CONFLICTO', codigo: 'conflicto_id' },
    });
    expect(await ejecutar(OP25, { ...aporte, id: uuid(1111), total: '0' })).toMatchObject({
      ok: false,
      error: { categoria: 'VALIDACION' },
    });

    const retiro = {
      id: uuid(1112),
      modalidad: 'retiro',
      inversionId: I1,
      cuentaId: E1,
      fecha: FECHA,
      total: '30.00',
    };
    expect(await ejecutar(OP25, retiro)).toMatchObject({ ok: true, yaAplicada: false });
    const r = await releer(uuid(1112));
    expect(r.tx).toMatchObject({ tipo: 'retiro_inversion', total: 3000 });
    expect([monto(r.efectos, I1), monto(r.efectos, E1)]).toEqual([-3000, 3000]);
    expect(r.lineas).toEqual([]);
    expect(await ejecutar(OP25, retiro)).toMatchObject({ ok: true, yaAplicada: true });
    expect(await ejecutar(OP25, { ...retiro, id: uuid(1113), total: '99999.00' })).toMatchObject(
      rechazo('retiro_mayor_que_valor', contiene('La inversión vale $')),
    );

    // el ajuste lleva el signo en el efecto y la transacción guarda |total|
    const ajuste = {
      id: uuid(1114),
      modalidad: 'ajuste',
      inversionId: I1,
      fecha: FECHA,
      total: '-5.00',
    };
    expect(await ejecutar(OP25, ajuste)).toMatchObject({ ok: true, yaAplicada: false });
    const j = await releer(uuid(1114));
    expect(j.tx).toMatchObject({ tipo: 'ajuste_inversion', total: 500 });
    expect(j.efectos).toMatchObject([{ cuentaId: I1, monto: -500 }]);
    expect(await ejecutar(OP25, ajuste)).toMatchObject({ ok: true, yaAplicada: true });
    expect(await ejecutar(OP25, { ...ajuste, total: '5.00' })).toMatchObject({
      ok: false,
      error: { categoria: 'CONFLICTO', codigo: 'conflicto_id' },
    });
    expect(await ejecutar(OP25, { ...ajuste, id: uuid(1115), total: '-99999.00' })).toMatchObject(
      rechazo('valor_inversion_negativo', 'El valor de la inversión no puede quedar negativo.'),
    );
    expect(await ejecutar(OP25, { ...ajuste, id: uuid(1116), total: '0' })).toMatchObject({
      ok: false,
      error: { categoria: 'VALIDACION' },
    });
  });

  it('PRU-INT-PRES-103 OP-26: registra el desembolso de un préstamo; repetirlo es ya aplicada, otro contenido es conflicto_id y una cuenta de otro tipo se rechaza', async () => {
    const entrada = {
      id: uuid(1120),
      prestamoId: P1,
      cuentaId: E1,
      fecha: FECHA,
      total: '250.00',
    };
    expect(await preparar(OP26, entrada)).toMatchObject({ rechazos: [] });
    expect(await ejecutar(OP26, entrada)).toMatchObject({
      ok: true,
      yaAplicada: false,
      valor: { id: uuid(1120) },
    });
    const d = await releer(uuid(1120));
    expect(d.tx).toMatchObject({ tipo: 'desembolso_prestamo', total: 25000 });
    expect([monto(d.efectos, P1), monto(d.efectos, E1)]).toEqual([25000, 25000]);
    expect(await ejecutar(OP26, entrada)).toMatchObject({ ok: true, yaAplicada: true });
    expect(await ejecutar(OP26, { ...entrada, total: '251.00' })).toMatchObject({
      ok: false,
      error: { categoria: 'CONFLICTO', codigo: 'conflicto_id' },
    });
    expect(await ejecutar(OP26, { ...entrada, id: uuid(1121), prestamoId: E1 })).toMatchObject(
      rechazo('cuenta_tipo_no_valido', contiene('de tipo efectivo')),
    );
  });
});
