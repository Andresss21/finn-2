// Consultas de detalle de categoría, metas y estructura (TA-170; 04 §6.0, §6.3, §6.10, §6.12.4; PRU-INT-CATEG-102).
// Sobre la base de prueba de @finn/db (TA-152): las tres dan el encabezado común y los mismos números que los
// selectores del dominio, y un id inexistente es NO_ENCONTRADO. Las reglas de comercio [H] se siembran aparte.
import { beforeAll, describe, expect, it } from 'vitest';
import { calcular } from '@finn/dominio';
import {
  detalleCategoria as selDetalle,
  detallePagoTarjeta as selDetallePago,
  estructura as selEstructura,
  metas as selMetas,
  periodoActivo,
} from '@finn/dominio/selectores';
import { FechaLocal } from '@finn/dominio/valores';
import { cargarHechos, leer, leerReglasComercio, Memoria } from '@finn/db';
import { crearBasePrueba } from '../../db/test/ayudantes/base.ts';
import { sembrarReglaDeComercio } from '../../db/test/ayudantes/reglas-prueba.ts';
import { escribirHechosDePrueba, HOY, RELOJ } from '../../db/test/ayudantes/hechos-prueba.ts';
import type { ClaimsSesion, SesionServidor } from '../src/autenticacion/autorizar.ts';
import type { DepsConsulta } from '../src/consultas/comun.ts';
import { detalleCategoria } from '../src/consultas/detalle-categoria.ts';
import { estructura } from '../src/consultas/estructura.ts';
import { metas } from '../src/consultas/metas.ts';
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
const COMIDA = '00000000-0000-4000-8000-000000000011';
const PRESTAMO = '00000000-0000-4000-8000-000000000012';
const VISA = '00000000-0000-4000-8000-000000000013';
const INEXISTENTE = '00000000-0000-4000-8000-0000000000ff';

describe('PRU-INT-CATEG', () => {
  const base = crearBasePrueba();

  beforeAll(async () => {
    await escribirHechosDePrueba(base);
    process.env['DATABASE_URL'] = base.url; // el cliente del proceso (04 §2.5)
    // Una regla de comercio [H] sobre Comida: no cambia `finn.revision`
    await sembrarReglaDeComercio(base, 'super', COMIDA);
  });

  it('PRU-INT-CATEG-102 [inv. 27, Q-detalleCategoria, Q-metas, Q-estructura] detalleCategoria(), metas() y estructura() dan el encabezado común y los números de los selectores, y un id inexistente es NO_ENCONTRADO', async () => {
    const deps: DepsConsulta = {
      memoria: new Memoria(),
      sesion: sesionDe({ sub: USUARIO, aal: 'aal2' }),
      usuarioPermitido: USUARIO,
      opciones: () => RELOJ,
    };
    // La referencia: la misma base con los selectores del dominio, sin pasar por las consultas
    const { i, reglas, revision } = await leer(
      async (tx) => ({
        i: calcular(await cargarHechos(tx), FechaLocal.desdeTexto(HOY)),
        reglas: await leerReglasComercio(tx),
        revision: tx.estado.revision,
      }),
      RELOJ,
    );
    expect(reglas).toHaveLength(1);
    const encabezado = {
      revision,
      hoy: HOY,
      periodoActivo: periodoActivo(i),
      notificacionesNoLeidas: 0,
      bandejaPorRevisar: 0,
    };

    const [det, pago, met, est] = await Promise.all([
      detalleCategoria(deps, { categoriaId: COMIDA }),
      detalleCategoria(deps, { categoriaId: VISA }),
      metas(deps),
      estructura(deps),
    ]);

    // 1. Encabezado común (6.0.2) y números de los selectores
    for (const dto of [det, pago, met, est])
      expect({
        revision: dto.revision,
        hoy: dto.hoy,
        periodoActivo: dto.periodoActivo,
        notificacionesNoLeidas: dto.notificacionesNoLeidas,
        bandejaPorRevisar: dto.bandejaPorRevisar,
      }).toEqual(encabezado);
    expect(det).toMatchObject({ ...encabezado, ...selDetalle(i, COMIDA as never, { reglas }) });
    expect(det).toMatchObject({ clase: 'normal', reglas: [{ patron: 'super' }] });
    expect(det.clase === 'normal' && det.acciones.puedeEliminar).toBe(false);
    expect(pago).toMatchObject({ ...encabezado, ...selDetallePago(i, VISA as never) });
    expect(pago.clase).toBe('pago');
    expect(met).toMatchObject({ ...encabezado, ...selMetas(i) });
    expect(met.metas.length).toBeGreaterThan(0);
    expect(est.grupos).toEqual(selEstructura(i, reglas));
    const comida = est.grupos.flatMap((g) => g.categorias).find((f) => f.categoria.id === COMIDA);
    expect(comida).toMatchObject({ tieneMeta: true, puedeEliminar: false, puedeArchivar: true });

    // 2. Una misma categoría en las tres: la meta de Préstamo y su detalle dan el mismo estado
    const metaPrestamo = met.metas.find((m) => m.categoria.id === PRESTAMO);
    const detPrestamo = await detalleCategoria(deps, { categoriaId: PRESTAMO });
    expect(metaPrestamo).toBeDefined();
    expect(detPrestamo.clase === 'normal' && detPrestamo.meta?.estado).toBe(metaPrestamo?.estado);

    // 3. Un id inexistente es NO_ENCONTRADO (6.0.1); un parámetro inválido, VALIDACION
    expect(await lanzado(detalleCategoria(deps, { categoriaId: INEXISTENTE }))).toMatchObject({
      categoria: 'NO_ENCONTRADO',
      codigo: 'no_encontrado',
    });
    expect(await lanzado(detalleCategoria(deps, { categoriaId: 'no-es-uuid' }))).toMatchObject({
      categoria: 'VALIDACION',
    });
    const fuera = await lanzado(
      detalleCategoria(deps, { categoriaId: COMIDA, periodoInicio: '2020-01-01' }),
    );
    expect(fuera.categoria).toBe('VALIDACION');
    expect(Object.keys(fuera.campos ?? {})).toEqual(['periodoInicio']);

    // 4. Sesión (CH-29): sin sesión, ninguna consulta lee
    const sinSesion = { ...deps, sesion: sesionDe(null) };
    for (const consulta of [
      detalleCategoria(sinSesion, { categoriaId: COMIDA }),
      metas(sinSesion),
      estructura(sinSesion),
    ])
      expect((await lanzado(consulta)).categoria).toBe('NO_AUTORIZADO');
  });
});
