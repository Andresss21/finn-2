// Contextos de formulario y tipos de reporte de la ola 2 (TA-198; 04 §6.9, §6.14.4; PRU-INT-REP-102). Sobre la base de
// prueba de @finn/db (TA-152): cada contexto y cada reporte es el del selector del dominio sobre la misma base, con el
// encabezado común. FORM-formato queda fuera: no hay OP de formatos hasta TA-195. `patrimonio` entrega `posicionHoy` (CH-39).
import { beforeAll, describe, expect, it } from 'vitest';
import { calcular } from '@finn/dominio';
import { datosBase, formulario as selFormulario, reportes, ritmo } from '@finn/dominio/selectores';
import { FechaLocal } from '@finn/dominio/valores';
import {
  cargarHechos,
  leer,
  leerReferenciasDeProgramadas,
  leerReglasComercio,
  Memoria,
} from '@finn/db';
import { crearBasePrueba } from '../../db/test/ayudantes/base.ts';
import { escribirHechosDePrueba, HOY, RELOJ } from '../../db/test/ayudantes/hechos-prueba.ts';
import { sembrarReglaDeComercio } from '../../db/test/ayudantes/reglas-prueba.ts';
import type { ClaimsSesion, SesionServidor } from '../src/autenticacion/autorizar.ts';
import type { DepsConsulta } from '../src/consultas/comun.ts';
import { formulario } from '../src/consultas/formulario/index.ts';
import { reporte } from '../src/consultas/reporte.ts';
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
const INEXISTENTE = '00000000-0000-4000-8000-0000000000ff';
const COMIDA = '00000000-0000-4000-8000-000000000011';

describe('PRU-INT-REP', () => {
  const base = crearBasePrueba();

  beforeAll(async () => {
    await escribirHechosDePrueba(base);
    process.env['DATABASE_URL'] = base.url; // el cliente del proceso (04 §2.5)
    await sembrarReglaDeComercio(base, 'netflix', COMIDA); // [H]
  });

  it('PRU-INT-REP-102 [Q-reporte, Q-formulario, FORM-cobrar, FORM-condonar, FORM-devolver, FORM-fusionar, FORM-programada, inv. 27] los cinco contextos de formulario de la ola 2 y cada tipo de reporte() igual al selector, con errores', async () => {
    const deps: DepsConsulta = {
      memoria: new Memoria(),
      sesion: sesionDe({ sub: USUARIO, aal: 'aal2' }),
      usuarioPermitido: USUARIO,
      opciones: () => RELOJ,
    };
    const ref = await leer(
      async (tx) => ({
        i: calcular(await cargarHechos(tx), FechaLocal.desdeTexto(HOY)),
        reglas: await leerReglasComercio(tx),
        referencias: await leerReferenciasDeProgramadas(tx),
        revision: tx.estado.revision,
      }),
      RELOJ,
    );
    const { i, reglas, referencias } = ref;
    const encabezado = { revision: ref.revision, hoy: HOY };

    // 1. cobrar y condonar: una línea por cobrar abierta
    const todas = await formulario(deps, { operacion: 'cobrar' });
    expect(todas).toMatchObject(encabezado);
    expect(todas.contexto).toEqual(selFormulario(i, { operacion: 'cobrar' }).contexto);
    expect(todas.contexto.lineas.length).toBeGreaterThan(0);
    const linea = todas.contexto.lineas[0];
    if (linea === undefined) throw new Error('sin líneas por cobrar sembradas');
    const unaLinea = await formulario(deps, { operacion: 'cobrar', lineaId: linea.lineaId });
    expect(unaLinea.contexto).toEqual(
      selFormulario(i, { operacion: 'cobrar', lineaId: linea.lineaId }).contexto,
    );
    const deDeudor = await formulario(deps, { operacion: 'cobrar', deudorId: linea.deudor.id });
    expect(deDeudor.contexto.lineas.length).toBeGreaterThan(0);
    const condonar = await formulario(deps, { operacion: 'condonar', lineaId: linea.lineaId });
    expect(condonar).toMatchObject(encabezado);
    expect(condonar.contexto).toEqual(
      selFormulario(i, { operacion: 'condonar', lineaId: linea.lineaId }).contexto,
    );
    expect(condonar.contexto.linea.lineaId).toBe(linea.lineaId);

    // 2. devolver: las candidatas y, con la compra, sus líneas
    const candidatas = await formulario(deps, { operacion: 'devolver' });
    expect(candidatas.contexto).toEqual(selFormulario(i, { operacion: 'devolver' }).contexto);
    const compra = (candidatas.contexto as { candidatas: { transaccionId: string }[] })
      .candidatas[0];
    if (compra === undefined) throw new Error('sin compras devolvibles sembradas');
    const devolver = await formulario(deps, {
      operacion: 'devolver',
      transaccionOriginalId: compra.transaccionId,
    });
    expect(devolver.contexto).toEqual(
      selFormulario(i, {
        operacion: 'devolver',
        transaccionOriginalId: compra.transaccionId as never,
      }).contexto,
    );
    expect(devolver.contexto).toHaveProperty('lineas');

    // 3. fusionar: con las reglas [H]
    const fusionar = await formulario(deps, { operacion: 'fusionar', categoriaId: COMIDA });
    expect(fusionar.contexto).toEqual(
      selFormulario(i, { operacion: 'fusionar', categoriaId: COMIDA as never }, { reglas })
        .contexto,
    );
    expect(fusionar.contexto.resumen.reglas).toBe(1);

    // 4. programada: el alta y la existente con su calendario
    const alta = await formulario(deps, { operacion: 'programada' });
    expect(alta.contexto).toEqual(
      selFormulario(i, { operacion: 'programada' }, { referencias }).contexto,
    );
    const programada = i.hechos.programadas[0];
    if (programada === undefined) throw new Error('sin programadas sembradas');
    const unaProgramada = await formulario(deps, {
      operacion: 'programada',
      programadaId: programada.id,
    });
    expect(unaProgramada.contexto).toEqual(
      selFormulario(i, { operacion: 'programada', programadaId: programada.id }, { referencias })
        .contexto,
    );
    expect(unaProgramada.contexto).toHaveProperty('programada');

    // 5. NO_ENCONTRADO y VALIDACION
    for (const p of [
      { operacion: 'cobrar', lineaId: INEXISTENTE },
      { operacion: 'cobrar', deudorId: INEXISTENTE },
      { operacion: 'condonar', lineaId: INEXISTENTE },
      { operacion: 'devolver', transaccionOriginalId: INEXISTENTE },
      { operacion: 'fusionar', categoriaId: INEXISTENTE },
      { operacion: 'programada', programadaId: INEXISTENTE },
      { operacion: 'programada', programadaId: programada.id, fechaEsperada: '1999-01-01' },
    ] as const)
      expect((await lanzado(formulario(deps, p))).categoria).toBe('NO_ENCONTRADO');
    expect((await lanzado(formulario(deps, { operacion: 'condonar' }))).categoria).toBe(
      'VALIDACION',
    );

    // 6. reporte(): cada tipo igual a su selector, con el encabezado común
    const igual = async (tipo: string, esperado: unknown, extra: object = {}) => {
      const r = await reporte(deps, { tipo, ...extra });
      expect(r).toMatchObject(encabezado);
      expect(r).toMatchObject(JSON.parse(JSON.stringify(esperado)) as object);
    };
    await igual('ritmo', ritmo(i));
    await igual('realidad', reportes.realidad(i));
    await igual('hormiga', reportes.hormiga(i, reglas));
    await igual('suscripciones', reportes.suscripciones(i, reglas));
    await igual('hallazgos', reportes.hallazgos(i, reglas));
    await igual('tarjetas', reportes.tarjetas(i));
    await igual('flujo_efectivo', reportes.flujoEfectivo(i));
    await igual('datos_base', datosBase(i));
    const pat = reportes.patrimonio(i);
    await igual('patrimonio', { posicionHoy: pat.hoy, serie: pat.serie });
    expect(pat.serie.length).toBeGreaterThan(0);
    expect(await reporte(deps, { tipo: 'patrimonio' })).not.toHaveProperty('patrimonio');
    await igual('categorias', reportes.categorias(i));
    await igual('gasto_semanal', reportes.gastoSemanal(i));
    await igual('tendencia', { periodos: reportes.tendencia(i) });
    await igual('ingresos_gastos', { periodos: reportes.ingresosGastos(i) });
    await igual('remanente', { periodos: reportes.remanente(i) });
    await igual('cumplimiento', { filas: reportes.cumplimiento(i) });
    await igual('top_comercios', { comercios: reportes.topComercios(i, reglas) });
    // con ventana y límite
    await igual(
      'top_comercios',
      { comercios: reportes.topComercios(i, reglas, { ventana: 'ultimos_3', limite: 1 }) },
      { ventana: 'ultimos_3', limite: 1 },
    );
    await igual(
      'tendencia',
      { periodos: reportes.tendencia(i, { ventana: 'ultimos_6' }) },
      { ventana: 'ultimos_6' },
    );

    // 7. parámetros inválidos y sin sesión
    expect((await lanzado(reporte(deps, { tipo: 'tarjetas', ventana: 'ayer' }))).categoria).toBe(
      'VALIDACION',
    );
    expect((await lanzado(reporte(deps, { tipo: 'top_comercios', limite: 0 }))).categoria).toBe(
      'VALIDACION',
    );
    const sinSesion: DepsConsulta = { ...deps, sesion: sesionDe(null) };
    expect((await lanzado(reporte(sinSesion, { tipo: 'hallazgos' }))).categoria).toBe(
      'NO_AUTORIZADO',
    );
  });
});
