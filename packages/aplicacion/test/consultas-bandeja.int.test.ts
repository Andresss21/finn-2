// Consultas de la bandeja, la sugerencia y Ajustes (TA-172; 04 §6.0, §6.8, §6.11, §6.14.3; PRU-INT-BAND-101). Sobre la
// base de prueba de @finn/db (TA-152): `bandeja()` con los estados de 01 §7.1 y `error`, `sugerencia()` y `ajustes()`
// con el estado del token, del respaldo y del ciclo. Las tablas [H], [I] y [T] se siembran con el ayudante de @finn/db.
import { beforeAll, describe, expect, it } from 'vitest';
import { calcular } from '@finn/dominio';
import {
  bandeja as selBandeja,
  periodoActivo,
  sugerencia as selSugerencia,
} from '@finn/dominio/selectores';
import { FechaLocal } from '@finn/dominio/valores';
import { cargarHechos, leer, leerDatosDeBandeja, leerReglasComercio, Memoria } from '@finn/db';
import {
  fijarRespaldo,
  FORMATO_ACTIVO,
  MOVIMIENTOS,
  sembrarAjustesTecnicos,
  sembrarBandejaCompleta,
} from '../../db/test/ayudantes/ajustes-prueba.ts';
import { crearBasePrueba } from '../../db/test/ayudantes/base.ts';
import { escribirHechosDePrueba, HOY, RELOJ } from '../../db/test/ayudantes/hechos-prueba.ts';
import { sembrarReglaDeComercio } from '../../db/test/ayudantes/reglas-prueba.ts';
import type { ClaimsSesion, SesionServidor } from '../src/autenticacion/autorizar.ts';
import { ajustes } from '../src/consultas/ajustes.ts';
import { bandeja } from '../src/consultas/bandeja.ts';
import type { DepsConsulta, Encabezado } from '../src/consultas/comun.ts';
import { sugerencia } from '../src/consultas/sugerencia.ts';
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
const PRESTAMO = '00000000-0000-4000-8000-000000000012';
const TX_SUPER = '00000000-0000-4000-8000-000000000104';

describe('PRU-INT-BAND', () => {
  const base = crearBasePrueba();

  beforeAll(async () => {
    await escribirHechosDePrueba(base);
    process.env['DATABASE_URL'] = base.url; // el cliente del proceso (04 §2.5)
    await sembrarReglaDeComercio(base, 'netflix', PRESTAMO); // [H]: no cambia `finn.revision`
    await sembrarBandejaCompleta(base);
  });

  it('PRU-INT-BAND-101 [inv. 27, Q-bandeja, Q-sugerencia, Q-ajustes] bandeja() con los estados de 01 §7.1 y error, sugerencia() y ajustes() con el estado del token, del respaldo y del ciclo', async () => {
    const deps: DepsConsulta = {
      memoria: new Memoria(),
      sesion: sesionDe({ sub: USUARIO, aal: 'aal2' }),
      usuarioPermitido: USUARIO,
      opciones: () => RELOJ,
    };
    // La referencia: la misma base con los selectores del dominio, sin pasar por las consultas
    const ref = await leer(
      async (tx) => ({
        i: calcular(await cargarHechos(tx), FechaLocal.desdeTexto(HOY)),
        datos: await leerDatosDeBandeja(tx),
        reglas: await leerReglasComercio(tx),
        revision: tx.estado.revision,
      }),
      RELOJ,
    );
    const encabezado = {
      revision: ref.revision,
      hoy: HOY,
      periodoActivo: periodoActivo(ref.i),
      notificacionesNoLeidas: 0,
      bandejaPorRevisar: 5, // pendiente, con_coincidencia, posible_duplicado, no_reconocido y error
    };
    const encabezadoDe = (dto: Encabezado) => ({
      revision: dto.revision,
      hoy: dto.hoy,
      periodoActivo: dto.periodoActivo,
      notificacionesNoLeidas: dto.notificacionesNoLeidas,
      bandejaPorRevisar: dto.bandejaPorRevisar,
    });

    // 1. bandeja(): los cinco estados activos, los descartados fuera, y lo mismo que el selector
    const activos = await bandeja(deps);
    expect(encabezadoDe(activos)).toEqual(encabezado);
    expect(activos.contadores).toEqual({
      pendientes: 1,
      conCoincidencia: 1,
      posiblesDuplicados: 1,
      noReconocidos: 1,
      errores: 1,
    });
    expect(activos).toMatchObject(selBandeja(ref.i, ref.datos, {}));
    expect(activos.movimientos.map((x) => x.id)).toEqual([
      MOVIMIENTOS.pendiente,
      MOVIMIENTOS.conCoincidencia,
      MOVIMIENTOS.posibleDuplicado,
      MOVIMIENTOS.noReconocido,
      MOVIMIENTOS.error,
    ]);
    const porId = (id: string) => activos.movimientos.find((x) => x.id === id);
    expect(activos.elegiblesAprobarTodos).toEqual([MOVIMIENTOS.pendiente]);
    // El último intento de procesamiento, con los nombres de los formatos [H]
    expect(porId(MOVIMIENTOS.pendiente)).toMatchObject({
      estado: 'pendiente',
      cuenta: { nombre: 'Efectivo' },
      monto: 1250,
      lineas: [{ monto: 1250, destino: { nombre: 'Comida', tipo: 'categoria' } }],
      procesamiento: {
        intento: 2,
        resultado: 'pendiente',
        formato: 'Compra',
        formatosCoincidentes: ['Compra'],
      },
      categoriaSugerida: { nombre: 'Comida', porRegla: false },
      aprobacion: { posible: true, elegibleAprobarTodos: true, arrastrable: true },
    });
    expect(porId(MOVIMIENTOS.conCoincidencia)).toMatchObject({
      estado: 'con_coincidencia',
      coincidencia: {
        programada: { nombre: 'Netflix' },
        fechaEsperada: '2027-02-25',
        montoEsperado: 1500,
      },
      categoriaSugerida: { nombre: 'Préstamo', porRegla: true },
      aprobacion: { elegibleAprobarTodos: false, motivoNoElegible: 'movimiento_estado_no_valido' },
    });
    expect(porId(MOVIMIENTOS.posibleDuplicado)).toMatchObject({
      estado: 'posible_duplicado',
      duplicado: { tipo: 'transaccion', id: TX_SUPER, monto: 1250, comercio: 'Super' },
    });
    expect(porId(MOVIMIENTOS.noReconocido)).toMatchObject({
      estado: 'no_reconocido',
      cuenta: null,
      procesamiento: { resultado: 'no_reconocido', formatosCoincidentes: ['Compra', 'Depósito'] },
      aprobacion: { posible: false },
    });
    expect(porId(MOVIMIENTOS.error)).toMatchObject({
      estado: 'error',
      procesamiento: { resultado: 'error', errorDetalle: 'formato no reconocido' },
      aprobacion: { posible: false },
    });

    // 2. La vista de descartados: descartado y autodescartado, del SMS más reciente al más antiguo
    const descartados = await bandeja(deps, { vista: 'descartados' });
    expect(descartados.movimientos.map((x) => [x.id, x.estado])).toEqual([
      [MOVIMIENTOS.autodescartado, 'autodescartado'],
      [MOVIMIENTOS.descartado, 'descartado'],
    ]);
    expect('siguienteCursor' in descartados).toBe(false);
    expect(descartados.contadores).toEqual(activos.contadores);
    expect((await lanzado(bandeja(deps, { vista: 'otra' }))).categoria).toBe('VALIDACION');

    // 3. sugerencia(): regla, historial y sin sugerencia, con el mismo criterio que el selector
    const regla = await sugerencia(deps, { comercio: 'Netflix mensual' });
    expect(encabezadoDe(regla)).toEqual(encabezado);
    expect(regla.sugerencia).toMatchObject({ categoria: { nombre: 'Préstamo' }, origen: 'regla' });
    expect(regla.sugerencia).toEqual(selSugerencia(ref.i, ref.reglas, 'Netflix mensual'));
    expect((await sugerencia(deps, { comercio: ' Super ' })).sugerencia).toMatchObject({
      categoria: { nombre: 'Comida' },
      origen: 'historial',
    });
    expect((await sugerencia(deps, { comercio: 'Comercio nunca visto' })).sugerencia).toBeNull();
    expect((await lanzado(sugerencia(deps, { comercio: '   ' }))).categoria).toBe('VALIDACION');
    expect((await lanzado(sugerencia(deps, {}))).categoria).toBe('VALIDACION');

    // 4. ajustes() sin token, sin respaldo y con el ciclo: la vigente inicial y la futura de la prueba
    const inicial = ref.i.hechos.vigencias_ciclo.find((v) => v.rigeDesde === null);
    const sin = await ajustes(deps);
    expect(encabezadoDe(sin)).toEqual(encabezado);
    expect(sin.ciclo).toEqual({
      diaInicioVigente: inicial?.diaInicio,
      vigenciaFutura: { diaInicio: 15, rigeDesde: '2027-04-21' },
    });
    expect(sin.webhook).toEqual({ configurado: false });
    expect(sin.suscripcionesPush).toEqual([]);
    expect(sin.diagnostico).toEqual([]);
    expect(sin.respaldo).toEqual({ respaldoAtrasado: true, restauracionAtrasada: true });
    expect(sin.exportaciones).toEqual({ json: '/api/exportar/json', csv: '/api/exportar/csv' });
    expect(sin.instituciones.map((x) => x.nombre)).toContain('Institución de prueba');
    // Los formatos de la bandeja: un uso del activo (su último intento), ninguno del inactivo
    const compra = sin.formatos.find((f) => f.id === FORMATO_ACTIVO);
    expect(compra).toMatchObject({
      nombre: 'Compra',
      tipoMovimiento: 'compra',
      activo: true,
      institucion: { nombre: 'Institución de prueba' },
      usos: 1,
    });
    expect(sin.formatos.find((f) => f.nombre === 'Depósito')).toMatchObject({
      activo: false,
      usos: 0,
    });
    expect(sin.formatos.find((f) => f.nombre === 'Depósito')).not.toHaveProperty('ultimoUso');

    // 5. Con token, suscripción push, eventos y respaldo (40 h) y restauración (3 días)
    await sembrarAjustesTecnicos(base);
    await fijarRespaldo(base, '40 hours', '3 days');
    const con = await ajustes(deps);
    expect(con.webhook).toEqual({ configurado: true, rotadoEn: '2027-02-01T12:00:00.000Z' });
    expect(con.suscripcionesPush).toEqual([
      {
        endpointCorto: 'push.ejemplo.test…12345678',
        agente: 'Pixel',
        renovadaEn: '2027-02-03T08:00:00.000Z',
      },
    ]);
    // El diagnóstico: solo avisos y errores, del más nuevo al más viejo
    expect(con.diagnostico).toEqual([
      {
        ocurridoEn: '2027-02-03T00:00:00.000Z',
        nivel: 'error',
        origen: 'app',
        mensaje: 'INTERNO interno inicio',
        idError: 'E-ABC123',
      },
      {
        ocurridoEn: '2027-02-02T00:00:00.000Z',
        nivel: 'aviso',
        origen: 'tarea_diaria',
        mensaje: 'respaldo atrasado',
      },
    ]);
    expect(con.formatos.find((f) => f.id === FORMATO_ACTIVO)?.usos).toBe(2);
    expect(con.formatos.find((f) => f.id === FORMATO_ACTIVO)).toHaveProperty('ultimoUso');
    expect(con.respaldo).toMatchObject({ respaldoAtrasado: true, restauracionAtrasada: false });
    expect(con.respaldo.ultimoRespaldoEn).toBeDefined();
    expect(con.respaldo.ultimaRestauracionEn).toBeDefined();
    // Ni el hash del token ni las claves de la suscripción salen jamás (04 §6.11)
    expect(JSON.stringify(con)).not.toMatch(/abab|clave-secreta/);

    // 6. Respaldo reciente (2 h) y restauración vieja (36 días)
    await fijarRespaldo(base, '2 hours', '36 days');
    expect((await ajustes(deps)).respaldo).toMatchObject({
      respaldoAtrasado: false,
      restauracionAtrasada: true,
    });

    // 7. Sesión (CH-29): sin sesión, ninguna consulta lee
    const sinSesion = { ...deps, sesion: sesionDe(null) };
    for (const consulta of [
      bandeja(sinSesion),
      sugerencia(sinSesion, { comercio: 'Super' }),
      ajustes(sinSesion),
    ])
      expect((await lanzado(consulta)).categoria).toBe('NO_AUTORIZADO');
  });
});
