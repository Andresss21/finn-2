// Consulta `formulario` (TA-173; 04 §6.14, BE-42; PRU-INT-TX-103): catálogos comunes y los contextos de registrar,
// pagar_tarjeta, cuota_prestamo, editar_transaccion y cuenta. Sobre la base de prueba de @finn/db (TA-152): la
// consulta da el encabezado común y los mismos números que `formulario()` del dominio, con lo [H] e [I] en la misma
// instantánea.
import { beforeAll, describe, expect, it } from 'vitest';
import { calcular } from '@finn/dominio';
import { formulario as selFormulario, periodoActivo } from '@finn/dominio/selectores';
import { FechaLocal } from '@finn/dominio/valores';
import { cargarHechos, leer, leerCambiosPosteriores, leerInstituciones, Memoria } from '@finn/db';
import { crearBasePrueba } from '../../db/test/ayudantes/base.ts';
import { escribirHechosDePrueba, HOY, RELOJ } from '../../db/test/ayudantes/hechos-prueba.ts';
import { sembrarOrigenYCambios } from '../../db/test/ayudantes/origen-prueba.ts';
import type { ClaimsSesion, SesionServidor } from '../src/autenticacion/autorizar.ts';
import type { DepsConsulta } from '../src/consultas/comun.ts';
import { formulario } from '../src/consultas/formulario/index.ts';
import { ExcepcionFinn } from '../src/errores/index.ts';

const USUARIO = 'usuario-unico';
const sesionDe = (claims: ClaimsSesion | null): SesionServidor => ({
  obtenerClaims: () => Promise.resolve(claims),
  obtenerUsuario: () => Promise.resolve(claims === null ? null : { id: claims.sub }),
});
const lanzado = async (consulta: Promise<unknown>) => {
  const e: unknown = await consulta.then(
    () => null,
    (x: unknown) => x,
  );
  expect(e).toBeInstanceOf(ExcepcionFinn);
  return (e as ExcepcionFinn).error;
};
const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const EFECTIVO = uuid(1);
const VISA = uuid(3);
const PRESTAMO = uuid(4);
const FONDO = uuid(5);
const COMIDA = uuid(11);
const CONCILIACION = uuid(15);
const TX_SMS = uuid(104); // gasto 'Super' con SMS, moneda original y una devolución
const TX_PAGO = uuid(109); // pago de tarjeta
const INEXISTENTE = uuid(255);

describe('PRU-INT-TX', () => {
  const base = crearBasePrueba();

  beforeAll(async () => {
    await escribirHechosDePrueba(base);
    process.env['DATABASE_URL'] = base.url; // el cliente del proceso (04 §2.5)
    await sembrarOrigenYCambios(base, TX_SMS, CONCILIACION);
  });

  it('PRU-INT-TX-103 [inv. 27, Q-formulario] formulario() da el encabezado común, los catálogos de 6.14.2 y el contexto de registrar, pagar_tarjeta, cuota_prestamo, editar_transaccion y cuenta, con NO_ENCONTRADO, VALIDACION y sesión', async () => {
    const deps: DepsConsulta = {
      memoria: new Memoria(),
      sesion: sesionDe({ sub: USUARIO, aal: 'aal2' }),
      usuarioPermitido: USUARIO,
      opciones: () => RELOJ,
    };
    // La referencia: la misma base con el selector del dominio, sin pasar por la consulta
    const { i, instituciones, cambios, revision } = await leer(
      async (tx) => ({
        i: calcular(await cargarHechos(tx), FechaLocal.desdeTexto(HOY)),
        instituciones: await leerInstituciones(tx),
        cambios: await leerCambiosPosteriores(tx),
        revision: tx.estado.revision,
      }),
      RELOJ,
    );
    const encabezado = {
      revision,
      hoy: HOY,
      periodoActivo: periodoActivo(i),
      notificacionesNoLeidas: 0,
      bandejaPorRevisar: 0,
    };

    // 1. registrar: gasto (cuentas, categorías, deudores y comercios), sin categoriasPago ni lpa
    const gasto = await formulario(deps, { operacion: 'registrar', tipo: 'gasto' });
    expect(gasto).toMatchObject(encabezado);
    expect(gasto.catalogos).toEqual(
      selFormulario(i, { operacion: 'registrar', tipo: 'gasto' }).catalogos,
    );
    expect(Object.keys(gasto.catalogos).sort()).toEqual(
      ['categorias', 'comercios', 'cuentas', 'deudores'].sort(),
    );
    expect(gasto.catalogos.cuentas?.efectivo.map((c) => c.cuenta.id)).toEqual([EFECTIVO, uuid(2)]);
    expect(gasto.catalogos.cuentas?.tarjetas.map((c) => c.cuenta.id)).toEqual([VISA]);
    expect(gasto.catalogos.cuentas?.prestamos[0]).toMatchObject({ tieneModelo: true });
    expect(gasto.catalogos.categorias?.grupos[0]?.categorias.map((c) => c.categoria.id)).toEqual([
      COMIDA,
      uuid(12),
    ]);
    expect(gasto.catalogos.deudores?.[0]).toMatchObject({ deudor: { nombre: 'Ana' } });
    expect(gasto.catalogos.comercios?.map((c) => c.comercio)).toContain('Super');
    expect((gasto.contexto as { cuentaPropuesta?: { id: string } }).cuentaPropuesta?.id).toBe(VISA);
    // con cuentaId, esa cuenta; las demás tablas de 6.14.2: ingreso solo cuentas, aporte también categorías
    const conCuenta = await formulario(deps, {
      operacion: 'registrar',
      tipo: 'gasto',
      cuentaId: EFECTIVO,
    });
    expect((conCuenta.contexto as { cuentaPropuesta?: { id: string } }).cuentaPropuesta?.id).toBe(
      EFECTIVO,
    );
    const ingreso = await formulario(deps, { operacion: 'registrar', tipo: 'ingreso' });
    expect(Object.keys(ingreso.catalogos)).toEqual(['cuentas']);
    expect(ingreso.contexto).toEqual({});
    const aporte = await formulario(deps, { operacion: 'registrar', tipo: 'aporte_inversion' });
    expect(Object.keys(aporte.catalogos).sort()).toEqual(['categorias', 'cuentas']);
    const devSinCompra = await formulario(deps, {
      operacion: 'registrar',
      tipo: 'devolucion_sin_compra',
    });
    expect(Object.keys(devSinCompra.catalogos).sort()).toEqual([
      'categorias',
      'comercios',
      'cuentas',
    ]);

    // 2. pagar_tarjeta: por tarjeta, con desglose y la categoría de pago
    const pago = await formulario(deps, { operacion: 'pagar_tarjeta' });
    expect(pago).toMatchObject(encabezado);
    expect(Object.keys(pago.catalogos).sort()).toEqual(['categoriasPago', 'cuentas']);
    expect(pago.catalogos.categoriasPago).toHaveLength(1);
    expect(pago.catalogos.categoriasPago?.[0]).toMatchObject({ tarjeta: { id: VISA } });
    const refPago = selFormulario(i, { operacion: 'pagar_tarjeta', tarjetaId: VISA as never });
    const unPago = await formulario(deps, { operacion: 'pagar_tarjeta', tarjetaId: VISA });
    expect(unPago.contexto).toEqual(refPago.contexto);
    const [tarjeta] = (pago.contexto as { tarjetas: Record<string, unknown>[] }).tarjetas;
    expect(tarjeta).toMatchObject({ tarjeta: { id: VISA }, deuda: 3000 - 1000 });
    expect(tarjeta?.['desgloseAlPagar']).toBeDefined();

    // 3. cuota_prestamo: desglose propuesto de la cuota (con modelo) y la categoría de la última cuota
    const cuota = await formulario(deps, {
      operacion: 'cuota_prestamo',
      prestamoId: PRESTAMO,
      modalidad: 'cuota',
    });
    expect(cuota).toMatchObject(encabezado);
    expect(Object.keys(cuota.catalogos).sort()).toEqual(['categorias', 'cuentas']);
    expect(cuota.contexto).toEqual(
      selFormulario(i, {
        operacion: 'cuota_prestamo',
        prestamoId: PRESTAMO as never,
        modalidad: 'cuota',
      }).contexto,
    );
    expect(cuota.contexto).toMatchObject({
      prestamo: { id: PRESTAMO },
      cuotaPactada: 5000,
      tieneModelo: true,
      categoriaPropuesta: { id: uuid(12) },
    });
    const abono = await formulario(deps, {
      operacion: 'cuota_prestamo',
      prestamoId: PRESTAMO,
      modalidad: 'abono',
      fecha: '2027-02-05',
    });
    expect(abono.contexto).not.toHaveProperty('desglosePropuesto');
    expect(abono.contexto).toMatchObject({ categoriaPropuesta: { id: uuid(12) } });

    // 4. editar_transaccion: el detalle completo con SMS, monto original y capacidad de devolución
    const edicion = await formulario(deps, {
      operacion: 'editar_transaccion',
      transaccionId: TX_SMS,
    });
    expect(edicion).toMatchObject(encabezado);
    expect(Object.keys(edicion.catalogos).sort()).toEqual([
      'categorias',
      'comercios',
      'cuentas',
      'deudores',
    ]);
    const ref = selFormulario(
      i,
      { operacion: 'editar_transaccion', transaccionId: TX_SMS as never },
      {
        cambios,
        sms: new Map([
          [
            TX_SMS as never,
            {
              texto: 'Compra Super $12.50',
              recibidoEn: '2027-01-22T15:00:00.000Z' as never,
              movimientoId: edicion.contexto.origenDetalle?.sms?.movimientoId as never,
            },
          ],
        ]),
      },
    );
    expect(edicion.contexto).toMatchObject({
      ...ref.contexto,
      transaccion: { montoOriginal: edicion.contexto.transaccion.montoOriginal },
      esperado: { montoOriginal: '10.5' },
    });
    expect(Number(edicion.contexto.transaccion.montoOriginal)).toBe(10.5);
    expect(edicion.contexto.origenDetalle?.sms).toMatchObject({ texto: 'Compra Super $12.50' });
    expect(edicion.contexto.cuentasArchivadas).toEqual([]);
    expect(edicion.contexto.capacidadDevolucion).toHaveLength(1);
    // un pago de tarjeta suma la categoría de pago a los catálogos
    const edicionPago = await formulario(deps, {
      operacion: 'editar_transaccion',
      transaccionId: TX_PAGO,
    });
    expect(edicionPago.catalogos.categoriasPago).toHaveLength(1);
    expect(edicionPago.contexto.capacidadDevolucion).toBeUndefined();

    // 5. cuenta: crear (instituciones [M]) y editar (campos con `esperado`)
    const crear = await formulario(deps, { operacion: 'cuenta', tipo: 'efectivo' });
    expect(crear).toMatchObject(encabezado);
    expect(crear.catalogos).toEqual({});
    expect(crear.contexto).toMatchObject({
      instituciones: instituciones.map((x) => ({ id: x.id, nombre: x.nombre })),
      nombresTarjetaUsados: [{ nombre: 'Visa', archivada: false }],
      modelosPrestamo: ['banco_agricola'],
    });
    expect(crear.contexto).not.toHaveProperty('cuenta');
    const editar = await formulario(deps, { operacion: 'cuenta', cuentaId: EFECTIVO });
    expect(editar.contexto).toMatchObject({
      cuenta: { cuenta: { id: EFECTIVO }, tipo: 'efectivo', nombre: 'Efectivo', ultimos4: '1234' },
      fechaAperturaMaxima: '2027-01-22',
    });
    expect((editar.contexto as { cuenta?: { esperado: unknown } }).cuenta?.esperado).toMatchObject({
      nombre: 'Efectivo',
    });
    const inversion = await formulario(deps, { operacion: 'cuenta', cuentaId: FONDO });
    expect(inversion.contexto).toMatchObject({
      cuenta: { tipo: 'inversion', rendimientoAnualEsperadoMillonesimas: 50000 },
    });

    // 6. NO_ENCONTRADO, VALIDACION y sesión (CH-29)
    for (const parametros of [
      { operacion: 'registrar', tipo: 'gasto', cuentaId: INEXISTENTE },
      { operacion: 'pagar_tarjeta', tarjetaId: EFECTIVO },
      { operacion: 'cuota_prestamo', prestamoId: EFECTIVO, modalidad: 'cuota' },
      { operacion: 'editar_transaccion', transaccionId: INEXISTENTE },
      { operacion: 'cuenta', cuentaId: INEXISTENTE },
    ])
      expect(await lanzado(formulario(deps, parametros))).toMatchObject({
        categoria: 'NO_ENCONTRADO',
      });
    for (const parametros of [
      undefined,
      { operacion: 'inventada' },
      { operacion: 'registrar', tipo: 'otro' },
      { operacion: 'cuota_prestamo', prestamoId: PRESTAMO, modalidad: 'mitad' },
      {
        operacion: 'cuota_prestamo',
        prestamoId: PRESTAMO,
        modalidad: 'cuota',
        fecha: '2027-13-01',
      },
      { operacion: 'editar_transaccion', transaccionId: 'no-es-uuid' },
    ])
      expect((await lanzado(formulario(deps, parametros))).categoria).toBe('VALIDACION');
    const sinSesion = { ...deps, sesion: sesionDe(null) };
    expect((await lanzado(formulario(sinSesion, { operacion: 'pagar_tarjeta' }))).categoria).toBe(
      'NO_AUTORIZADO',
    );
  });
});
