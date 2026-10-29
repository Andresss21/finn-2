// Consultas de cuentas, detalle de cuenta, actividad y detalle de transacción (TA-171; 04 §6.0, §6.5 a §6.7;
// PRU-INT-CTA-102). Sobre la base de prueba de @finn/db (TA-152): dan el encabezado común y los mismos números que
// los selectores del dominio; lo [H] e [I] (instituciones, cambios posteriores, SMS de origen, monto original) llega
// en la misma instantánea, y la actividad pagina y busca por texto.
import { beforeAll, describe, expect, it } from 'vitest';
import { calcular } from '@finn/dominio';
import {
  actividad as selActividad,
  cuentas as selCuentas,
  detalleCuenta as selDetalleCuenta,
  detalleTransaccion as selDetalleTransaccion,
  periodoActivo,
} from '@finn/dominio/selectores';
import { FechaLocal } from '@finn/dominio/valores';
import { cargarHechos, leer, leerCambiosPosteriores, leerInstituciones, Memoria } from '@finn/db';
import { crearBasePrueba } from '../../db/test/ayudantes/base.ts';
import { escribirHechosDePrueba, HOY, RELOJ } from '../../db/test/ayudantes/hechos-prueba.ts';
import { sembrarOrigenYCambios } from '../../db/test/ayudantes/origen-prueba.ts';
import type { ClaimsSesion, SesionServidor } from '../src/autenticacion/autorizar.ts';
import { actividad } from '../src/consultas/actividad.ts';
import type { DepsConsulta, Encabezado } from '../src/consultas/comun.ts';
import { cuentas } from '../src/consultas/cuentas.ts';
import { detalleCuenta } from '../src/consultas/detalle-cuenta.ts';
import { detalleTransaccion } from '../src/consultas/detalle-transaccion.ts';
import { ExcepcionFinn } from '../src/errores/index.ts';

const USUARIO = 'usuario-unico';
const sesionDe = (claims: ClaimsSesion | null): SesionServidor => ({
  obtenerClaims: () => Promise.resolve(claims),
  obtenerUsuario: () => Promise.resolve(claims === null ? null : { id: claims.sub }),
});
/** Lo que lanza una consulta, como `ErrorFinn`. */
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
const TX_SMS = uuid(104); // gasto 'Super', nota 'compra', origen sms, moneda original
const INEXISTENTE = uuid(255);

describe('PRU-INT-CTA', () => {
  const base = crearBasePrueba();

  beforeAll(async () => {
    await escribirHechosDePrueba(base);
    process.env['DATABASE_URL'] = base.url; // el cliente del proceso (04 §2.5)
    await sembrarOrigenYCambios(base, TX_SMS, CONCILIACION);
  });

  it('PRU-INT-CTA-102 [inv. 27, Q-cuentas, Q-detalleCuenta, Q-actividad, Q-detalleTransaccion] cuentas(), detalleCuenta(), actividad() y detalleTransaccion() dan el encabezado común y los números de los selectores, con paginación, búsqueda por texto, acciones habilitadas y origen por SMS', async () => {
    const deps: DepsConsulta = {
      memoria: new Memoria(),
      sesion: sesionDe({ sub: USUARIO, aal: 'aal2' }),
      usuarioPermitido: USUARIO,
      opciones: () => RELOJ,
    };
    // La referencia: la misma base con los selectores del dominio, sin pasar por las consultas
    const { i, instituciones, cambios, revision } = await leer(
      async (tx) => ({
        i: calcular(await cargarHechos(tx), FechaLocal.desdeTexto(HOY)),
        instituciones: await leerInstituciones(tx),
        cambios: await leerCambiosPosteriores(tx),
        revision: tx.estado.revision,
      }),
      RELOJ,
    );
    expect(cambios).toHaveLength(1);
    const encabezado = {
      revision,
      hoy: HOY,
      periodoActivo: periodoActivo(i),
      notificacionesNoLeidas: 0,
      bandejaPorRevisar: 0,
    };
    const delEncabezado = (dto: Encabezado) => ({
      revision: dto.revision,
      hoy: dto.hoy,
      periodoActivo: dto.periodoActivo,
      notificacionesNoLeidas: dto.notificacionesNoLeidas,
      bandejaPorRevisar: dto.bandejaPorRevisar,
    });

    // 1. cuentas(): los números del selector, la institución [M] y el encabezado
    const cta = await cuentas(deps);
    expect(delEncabezado(cta)).toEqual(encabezado);
    expect(cta).toMatchObject({ ...encabezado, ...selCuentas(i, { instituciones }) });
    expect(cta.efectivo.find((e) => e.cuenta.id === EFECTIVO)?.institucion).toBeDefined();
    expect(cta.archivadas).toBeUndefined();
    expect(cta.tarjetas).toHaveLength(1);
    expect((await cuentas(deps, { incluirArchivadas: true })).archivadas).toEqual([]);

    // 2. detalleCuenta(): saldo corrido, conciliaciones con cambios posteriores [H] y acciones habilitadas
    const det = await detalleCuenta(deps, { cuentaId: EFECTIVO });
    expect(delEncabezado(det)).toEqual(encabezado);
    expect(det).toMatchObject({
      ...encabezado,
      ...selDetalleCuenta(i, EFECTIVO as never, { instituciones, cambios }),
    });
    expect(det.cuenta).toMatchObject({ tipo: 'efectivo', ultimos4: '1234' });
    expect(det.movimientos.length).toBeGreaterThan(2);
    expect(det.conciliaciones[0]?.cambiosPosteriores).toHaveLength(1);
    expect(det.acciones).toMatchObject({ puedeArchivar: false, puedeEliminar: false });
    expect(det.acciones.bloqueosArchivo).toContain('cuenta_con_saldo');
    expect(det.acciones.bloqueosEliminar).toContain('cuenta_con_movimientos');
    // paginación: dos páginas de 2 siguen el mismo orden que la lista completa
    const p1 = await detalleCuenta(deps, { cuentaId: EFECTIVO, limite: 2 });
    expect(p1.movimientos.map((m) => m.id)).toEqual(det.movimientos.slice(0, 2).map((m) => m.id));
    expect(p1.siguienteCursor).toBeDefined();
    const p2 = await detalleCuenta(deps, {
      cuentaId: EFECTIVO,
      limite: 2,
      cursor: p1.siguienteCursor,
    });
    expect(p2.movimientos.map((m) => m.id)).toEqual(det.movimientos.slice(2, 4).map((m) => m.id));
    // filtros de tipo y de estado
    const gastos = await detalleCuenta(deps, { cuentaId: EFECTIVO, tipo: 'gasto' });
    expect(gastos.movimientos.length).toBeGreaterThan(0);
    expect(gastos.movimientos.every((m) => m.tipo === 'gasto')).toBe(true);
    // tarjeta, préstamo e inversión traen su bloque
    expect((await detalleCuenta(deps, { cuentaId: VISA })).tarjeta).toBeDefined();
    expect((await detalleCuenta(deps, { cuentaId: PRESTAMO })).prestamo).toBeDefined();
    expect((await detalleCuenta(deps, { cuentaId: FONDO })).inversion).toBeDefined();

    // 3. actividad(): los números del selector, paginación y búsqueda por texto
    const todo = await actividad(deps);
    expect(delEncabezado(todo)).toEqual(encabezado);
    expect(todo).toMatchObject({ ...encabezado, ...selActividad(i) });
    const filas = todo.dias.flatMap((d) => d.transacciones);
    expect(filas.length).toBeGreaterThan(4);
    const paginas: string[] = [];
    let cursor: string | undefined;
    do {
      const pagina = await actividad(deps, {
        limite: 3,
        ...(cursor === undefined ? {} : { cursor }),
      });
      const ids = pagina.dias.flatMap((d) => d.transacciones.map((t) => t.id));
      expect(ids.length).toBeLessThanOrEqual(3);
      paginas.push(...ids);
      cursor = pagina.siguienteCursor;
    } while (cursor !== undefined);
    expect(paginas).toEqual(filas.map((t) => t.id));
    // texto: `comercio` y `nota`, sin distinguir mayúsculas; `%` y `_` son literales
    const porComercio = await actividad(deps, { texto: 'SUPER' });
    const porNota = await actividad(deps, { texto: 'compra' });
    for (const r of [porComercio, porNota])
      expect(r.dias.flatMap((d) => d.transacciones.map((t) => t.id))).toEqual([TX_SMS]);
    expect((await actividad(deps, { texto: '%' })).dias).toEqual([]);
    expect((await actividad(deps, { texto: 'zzz' })).dias).toEqual([]);
    // montos (se comparan con `total`), cuenta, categoría, tipo y origen
    const caros = await actividad(deps, { montoDesde: '30.00' });
    expect(caros.dias.flatMap((d) => d.transacciones).every((t) => t.total >= 3000)).toBe(true);
    expect(caros).toMatchObject(selActividad(i, { montoDesde: 3000 as never }));
    const deVisa = await actividad(deps, { cuentaId: VISA, tipo: 'gasto', origen: 'importada' });
    expect(deVisa.dias.flatMap((d) => d.transacciones)).toHaveLength(1);
    const deComida = await actividad(deps, { categoriaId: COMIDA, estado: 'confirmada' });
    expect(deComida).toMatchObject(
      selActividad(i, { categoriaId: COMIDA as never, estado: 'confirmada' }),
    );
    const acotada = await actividad(deps, { desde: '2027-01-26', hasta: '2027-01-30' });
    expect(acotada.dias.every((d) => d.fecha >= '2027-01-26' && d.fecha <= '2027-01-30')).toBe(
      true,
    );

    // 4. detalleTransaccion(): SMS de origen [I], monto original y cambios posteriores [H]
    const dt = await detalleTransaccion(deps, { transaccionId: TX_SMS });
    expect(delEncabezado(dt)).toEqual(encabezado);
    expect(dt).toMatchObject({
      ...encabezado,
      ...selDetalleTransaccion(i, TX_SMS as never, {
        cambios,
        sms: new Map([
          [
            TX_SMS as never,
            {
              texto: 'Compra Super $12.50',
              recibidoEn: '2027-01-22T15:00:00.000Z' as never,
              movimientoId: dt.origenDetalle?.sms?.movimientoId as never,
            },
          ],
        ]),
      }),
      transaccion: { montoOriginal: dt.transaccion.montoOriginal, monedaOriginal: 'EUR' },
      esperado: { montoOriginal: '10.5' },
    });
    expect(dt.origenDetalle?.sms).toMatchObject({ texto: 'Compra Super $12.50' });
    expect(Number(dt.transaccion.montoOriginal)).toBe(10.5);
    expect(dt.transaccion).toMatchObject({ nota: 'compra', comercio: 'Super' });
    expect(dt.restricciones).toMatchObject({
      puedeEliminar: false,
      motivoNoEliminar: 'transaccion_con_eventos',
    });
    expect(
      (await detalleTransaccion(deps, { transaccionId: uuid(108) })).restricciones.puedeEliminar,
    ).toBe(true);
    const conciliada = await detalleTransaccion(deps, { transaccionId: uuid(109) });
    expect(conciliada.conciliacion?.id).toBe(CONCILIACION);
    expect(conciliada.origenDetalle).toBeUndefined();

    // 5. NO_ENCONTRADO, VALIDACION y sesión (CH-29)
    expect(await lanzado(detalleCuenta(deps, { cuentaId: INEXISTENTE }))).toMatchObject({
      categoria: 'NO_ENCONTRADO',
    });
    expect(await lanzado(detalleTransaccion(deps, { transaccionId: INEXISTENTE }))).toMatchObject({
      categoria: 'NO_ENCONTRADO',
    });
    expect(await lanzado(detalleCuenta(deps, { cuentaId: 'no-es-uuid' }))).toMatchObject({
      categoria: 'VALIDACION',
    });
    const fuera = await lanzado(
      detalleCuenta(deps, { cuentaId: EFECTIVO, periodoInicio: '2020-01-01' }),
    );
    expect(fuera.categoria).toBe('VALIDACION');
    expect(Object.keys(fuera.campos ?? {})).toEqual(['periodoInicio']);
    expect((await lanzado(actividad(deps, { limite: 101 }))).categoria).toBe('VALIDACION');
    expect((await lanzado(actividad(deps, { montoDesde: 'abc' }))).categoria).toBe('VALIDACION');
    const sinSesion = { ...deps, sesion: sesionDe(null) };
    for (const consulta of [
      cuentas(sinSesion),
      detalleCuenta(sinSesion, { cuentaId: EFECTIVO }),
      actividad(sinSesion),
      detalleTransaccion(sinSesion, { transaccionId: TX_SMS }),
    ])
      expect((await lanzado(consulta)).categoria).toBe('NO_AUTORIZADO');
  });
});
