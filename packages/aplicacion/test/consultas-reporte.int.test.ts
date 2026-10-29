// Contextos de formulario de presupuesto y bandeja, y `reporte()` (TA-174; 04 §6.9, §6.14; PRU-INT-REP-101). Sobre la
// base de prueba de @finn/db (TA-152): `formulario()` con asignar, archivar_categoria, movimiento y meta, y
// `reporte('ritmo')`, cada uno igual al selector del dominio sobre la misma base, con el encabezado común.
import { beforeAll, describe, expect, it } from 'vitest';
import { calcular } from '@finn/dominio';
import {
  formulario as selFormulario,
  periodoActivo,
  ritmo as selRitmo,
} from '@finn/dominio/selectores';
import { FechaLocal } from '@finn/dominio/valores';
import { cargarHechos, leer, leerDatosDeBandeja, leerReglasComercio, Memoria } from '@finn/db';
import {
  MOVIMIENTO_DEVOLUCION,
  MOVIMIENTOS,
  sembrarBandejaCompleta,
  sembrarMovimientoDeDevolucion,
} from '../../db/test/ayudantes/ajustes-prueba.ts';
import { crearBasePrueba } from '../../db/test/ayudantes/base.ts';
import { escribirHechosDePrueba, HOY, RELOJ } from '../../db/test/ayudantes/hechos-prueba.ts';
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
const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const COMIDA = uuid(11);
const DEVOLUCION = MOVIMIENTO_DEVOLUCION; // movimiento que propone una devolución
const INEXISTENTE = uuid(255);

describe('PRU-INT-REP', () => {
  const base = crearBasePrueba();

  beforeAll(async () => {
    await escribirHechosDePrueba(base);
    process.env['DATABASE_URL'] = base.url; // el cliente del proceso (04 §2.5)
    await sembrarBandejaCompleta(base);
    await sembrarMovimientoDeDevolucion(base);
  });

  it('PRU-INT-REP-101 [Q-reporte, Q-formulario, inv. 27] formulario() con asignar, archivar_categoria, movimiento (con las candidatas de devolución) y meta, y reporte(ritmo) con un tipo desconocido rechazado; FORM-asignar, FORM-archivar_categoria, FORM-movimiento y FORM-meta', async () => {
    const deps: DepsConsulta = {
      memoria: new Memoria(),
      sesion: sesionDe({ sub: USUARIO, aal: 'aal2' }),
      usuarioPermitido: USUARIO,
      opciones: () => RELOJ,
    };
    // La referencia: la misma base con los selectores del dominio, sin pasar por la consulta
    const { i, bandeja, reglas, revision } = await leer(
      async (tx) => ({
        i: calcular(await cargarHechos(tx), FechaLocal.desdeTexto(HOY)),
        bandeja: await leerDatosDeBandeja(tx),
        reglas: await leerReglasComercio(tx),
        revision: tx.estado.revision,
      }),
      RELOJ,
    );
    const encabezado = {
      revision,
      hoy: HOY,
      periodoActivo: periodoActivo(i),
      notificacionesNoLeidas: 0,
      bandejaPorRevisar: 6, // los cinco de la bandeja completa y el de la devolución
    };

    // 1. asignar: catálogos con `asignado` y el contexto del período pedido (o el activo)
    const asignar = await formulario(deps, { operacion: 'asignar', categoriaId: COMIDA });
    expect(asignar).toMatchObject(encabezado);
    const refAsignar = selFormulario(i, { operacion: 'asignar', categoriaId: COMIDA as never });
    expect(asignar.catalogos).toEqual(refAsignar.catalogos);
    expect(asignar.contexto).toEqual(refAsignar.contexto);
    expect(Object.keys(asignar.catalogos).sort()).toEqual(['categorias', 'categoriasPago', 'lpa']);
    expect(asignar.contexto).toMatchObject({ categoria: { id: COMIDA } });
    const siguiente = FechaLocal.sumarDias(i.presupuesto.activo.fin, 1);
    const futuro = await formulario(deps, {
      operacion: 'asignar',
      categoriaId: COMIDA,
      periodoInicio: siguiente,
    });
    expect(futuro.contexto).toEqual(
      selFormulario(i, {
        operacion: 'asignar',
        categoriaId: COMIDA as never,
        periodoInicio: siguiente,
      }).contexto,
    );
    expect(futuro.contexto.periodo).toBe(siguiente);

    // 2. archivar_categoria: lo que pide OP-09
    const archivar = await formulario(deps, {
      operacion: 'archivar_categoria',
      categoriaId: COMIDA,
    });
    expect(archivar).toMatchObject(encabezado);
    const refArchivar = selFormulario(i, {
      operacion: 'archivar_categoria',
      categoriaId: COMIDA as never,
    });
    expect(archivar.catalogos).toEqual(refArchivar.catalogos);
    expect(archivar.contexto).toEqual(refArchivar.contexto);
    expect(Object.keys(archivar.catalogos).sort()).toEqual(['categorias', 'lpa']);

    // 3. movimiento: el de la bandeja y, si propone devolución, las candidatas (CH-30)
    const gasto = await formulario(deps, {
      operacion: 'movimiento',
      movimientoId: MOVIMIENTOS.pendiente,
    });
    expect(gasto).toMatchObject(encabezado);
    expect(gasto.contexto).toEqual(
      selFormulario(
        i,
        { operacion: 'movimiento', movimientoId: MOVIMIENTOS.pendiente as never },
        { bandeja, reglas },
      ).contexto,
    );
    expect(gasto.contexto.movimiento).toMatchObject({ id: MOVIMIENTOS.pendiente });
    expect(gasto.contexto).not.toHaveProperty('candidatas');
    expect(Object.keys(gasto.catalogos).sort()).toEqual([
      'categorias',
      'comercios',
      'cuentas',
      'deudores',
    ]);
    const devolucion = await formulario(deps, {
      operacion: 'movimiento',
      movimientoId: DEVOLUCION,
    });
    const refDevolucion = selFormulario(
      i,
      { operacion: 'movimiento', movimientoId: DEVOLUCION as never },
      { bandeja, reglas },
    );
    expect(devolucion.contexto).toEqual(refDevolucion.contexto);
    const candidatas = (devolucion.contexto as { candidatas?: { transaccionId: string }[] })
      .candidatas;
    expect(candidatas).toBeDefined();
    expect(candidatas?.length).toBeLessThanOrEqual(20);

    // 4. meta: la de una categoría, la pedida por id y las categorías sin meta
    const metas = await formulario(deps, { operacion: 'meta' });
    expect(metas).toMatchObject(encabezado);
    expect(metas.contexto).toEqual(selFormulario(i, { operacion: 'meta' }).contexto);
    expect(Object.keys(metas.catalogos)).toEqual(['categorias']);
    const deCategoria = await formulario(deps, { operacion: 'meta', categoriaId: COMIDA });
    expect(deCategoria.contexto).toEqual(
      selFormulario(i, { operacion: 'meta', categoriaId: COMIDA as never }).contexto,
    );
    expect(deCategoria.contexto.categoriasSinMeta).toBeDefined();

    // 5. NO_ENCONTRADO y VALIDACION
    for (const p of [
      { operacion: 'asignar', categoriaId: INEXISTENTE },
      { operacion: 'archivar_categoria', categoriaId: INEXISTENTE },
      { operacion: 'movimiento', movimientoId: INEXISTENTE },
      { operacion: 'meta', categoriaId: INEXISTENTE },
      { operacion: 'meta', metaId: INEXISTENTE },
    ] as const)
      expect((await lanzado(formulario(deps, p))).categoria).toBe('NO_ENCONTRADO');
    expect(
      (await lanzado(formulario(deps, { operacion: 'asignar', categoriaId: 'no-uuid' }))).categoria,
    ).toBe('VALIDACION');
    expect(
      (
        await lanzado(
          formulario(deps, { operacion: 'asignar', categoriaId: COMIDA, periodoInicio: 'ayer' }),
        )
      ).categoria,
    ).toBe('VALIDACION');

    // 6. reporte('ritmo'): el encabezado común y lo mismo que el selector
    const ritmo = await reporte(deps, { tipo: 'ritmo' });
    expect(ritmo).toMatchObject(encabezado);
    expect(ritmo).toMatchObject(selRitmo(i));
    expect(ritmo.periodo).toEqual(periodoActivo(i));
    expect(ritmo.categorias.length).toBeGreaterThan(0);

    // 7. un tipo desconocido o ausente es VALIDACION; sin sesión, no se lee nada
    const desconocido = await lanzado(reporte(deps, { tipo: 'cashflow' }));
    expect(desconocido.categoria).toBe('VALIDACION');
    expect((await lanzado(reporte(deps, {}))).categoria).toBe('VALIDACION');
    const sinSesion: DepsConsulta = { ...deps, sesion: sesionDe(null) };
    expect((await lanzado(reporte(sinSesion, { tipo: 'ritmo' }))).categoria).toBe('NO_AUTORIZADO');
    expect((await lanzado(formulario(sinSesion, { operacion: 'meta' }))).categoria).toBe(
      'NO_AUTORIZADO',
    );
  });
});
