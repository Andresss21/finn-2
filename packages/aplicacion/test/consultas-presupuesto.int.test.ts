// Consultas de Inicio, Presupuesto y detalle de LPA (TA-169; 04 §6.0, §6.1, §6.2, §6.4; PRU-INT-PRES-102). Sobre la
// base de prueba de @finn/db (TA-152): las tres consultas dan el encabezado común y los mismos números que los
// selectores del dominio, y una misma categoría tiene los mismos números en las tres (error 11). Las tablas [H] y [T]
// que leen (bandeja, notificaciones) se siembran con el ayudante de @finn/db.
import { beforeAll, describe, expect, it } from 'vitest';
import { calcular } from '@finn/dominio';
import {
  detalleLpa as selDetalleLpa,
  inicio as selInicio,
  periodoActivo,
  presupuesto as selPresupuesto,
} from '@finn/dominio/selectores';
import { FechaLocal } from '@finn/dominio/valores';
import { cargarHechos, leer, Memoria } from '@finn/db';
import { crearBasePrueba } from '../../db/test/ayudantes/base.ts';
import { sembrarBandejaYNotificaciones } from '../../db/test/ayudantes/bandeja-prueba.ts';
import { escribirHechosDePrueba, HOY, RELOJ } from '../../db/test/ayudantes/hechos-prueba.ts';
import type { ClaimsSesion, SesionServidor } from '../src/autenticacion/autorizar.ts';
import { detalleLpa } from '../src/consultas/detalle-lpa.ts';
import { inicio } from '../src/consultas/inicio.ts';
import { presupuesto } from '../src/consultas/presupuesto.ts';
import type { DepsConsulta } from '../src/consultas/comun.ts';
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
// La categoría "Préstamo" de la base de prueba: asignación negativa y una cuota que la sobregira
const PRESTAMO = '00000000-0000-4000-8000-000000000012';

describe('PRU-INT-PRES', () => {
  const base = crearBasePrueba();

  beforeAll(async () => {
    await escribirHechosDePrueba(base);
    process.env['DATABASE_URL'] = base.url; // el cliente del proceso (04 §2.5)
    await sembrarBandejaYNotificaciones(base); // tablas [H] y [T]: la memoria sigue valiendo
  });

  it('PRU-INT-PRES-102 [inv. 27, error 11, Q-inicio, Q-presupuesto, Q-detalleLpa] inicio(), presupuesto() y detalleLpa() dan el encabezado común y los números de los selectores, y la misma categoría tiene los mismos números en las tres', async () => {
    const deps: DepsConsulta = {
      memoria: new Memoria(),
      sesion: sesionDe({ sub: USUARIO, aal: 'aal2' }),
      usuarioPermitido: USUARIO,
      opciones: () => RELOJ,
    };
    // La referencia: la misma base con los selectores del dominio, sin pasar por las consultas
    const { i, revision } = await leer(
      async (tx) => ({
        i: calcular(await cargarHechos(tx), FechaLocal.desdeTexto(HOY)),
        revision: tx.estado.revision,
      }),
      RELOJ,
    );
    const encabezado = {
      revision,
      hoy: HOY,
      periodoActivo: periodoActivo(i),
      notificacionesNoLeidas: 2,
      bandejaPorRevisar: 4, // dos pendientes, un no reconocido y un error
    };

    const [ini, pre, lpa] = await Promise.all([
      inicio(deps),
      presupuesto(deps),
      detalleLpa(deps, { periodos: 3 }),
    ]);

    // 1. Encabezado común (6.0.2)
    for (const dto of [ini, pre, lpa])
      expect({
        revision: dto.revision,
        hoy: dto.hoy,
        periodoActivo: dto.periodoActivo,
        notificacionesNoLeidas: dto.notificacionesNoLeidas,
        bandejaPorRevisar: dto.bandejaPorRevisar,
      }).toEqual(encabezado);

    // 2. Los números son los de los selectores (la consulta solo agrega lo que lee de [H] y [T])
    const { bandeja, cambiosRetroactivos, ...atencion } = ini.atencion;
    const { atencion: atencionSel, ...inicioSel } = selInicio(i, false);
    expect(atencion).toEqual(atencionSel);
    expect({ ...ini, atencion: undefined, recientes: undefined }).toMatchObject({
      ...encabezado,
      ...inicioSel,
    });
    expect(bandeja).toEqual({
      pendientes: 2,
      conCoincidencia: 0,
      posiblesDuplicados: 0,
      noReconocidos: 1,
      errores: 1,
    });
    expect(cambiosRetroactivos).toMatchObject([
      { aviso: 'AV-01', motivo: 'cambio_retroactivo', leida: false },
    ]);
    expect(ini.recientes).toHaveLength(5);
    expect(pre).toMatchObject({ ...encabezado, ...selPresupuesto(i) });
    expect(lpa).toMatchObject({ ...encabezado, ...selDetalleLpa(i, 3) });
    expect(lpa.historial.length).toBeLessThanOrEqual(3);

    // 3. Una misma categoría en las tres: Presupuesto (fila), Inicio (sobregiradas) y detalle de LPA (reducción)
    const fila = pre.grupos.flatMap((g) => g.categorias).find((f) => f.categoria.id === PRESTAMO);
    expect(fila?.sobregiro).toBeTruthy();
    const enInicio = ini.atencion.sobregiradas.find((s) => s.categoria.id === PRESTAMO);
    expect(enInicio).toBeDefined();
    expect(enInicio?.sobregiro).toEqual(fila?.sobregiro);
    expect(enInicio?.categoria).toEqual(fila?.categoria);
    const enLpa = lpa.reduccionProyectadaAlCierre.categorias.find(
      (c) => c.categoria.id === PRESTAMO,
    );
    expect(enLpa).toBeDefined();
    expect(enLpa?.monto).toBe(fila?.sobregiro?.parteDebito);
    expect(pre.lpa).toBe(ini.lpa);
    expect(pre.lpa).toBe(lpa.lpa);
    expect(pre.enCamino).toBe(ini.enCamino);
    expect(lpa.descomposicion.enCamino).toBe(ini.enCamino);

    // 4. Parámetros y sesión (6.0.1, CH-29): se lanzan como ExcepcionFinn
    const invalido = await lanzado(presupuesto(deps, { filtro: 'otra' }));
    expect(invalido.categoria).toBe('VALIDACION');
    expect(Object.keys(invalido.campos ?? {})).toEqual(['filtro']);
    expect(await lanzado(detalleLpa(deps, { periodos: 61 }))).toMatchObject({
      categoria: 'VALIDACION',
    });
    const fueraDeRango = await lanzado(presupuesto(deps, { periodoInicio: '2020-01-01' }));
    expect(fueraDeRango.categoria).toBe('VALIDACION');
    expect(Object.keys(fueraDeRango.campos ?? {})).toEqual(['periodoInicio']);
    const sinSesion = { ...deps, sesion: sesionDe(null) };
    expect(await lanzado(inicio(sinSesion))).toMatchObject({
      categoria: 'NO_AUTORIZADO',
      datos: { aal: 'ninguna' },
    });
    const aal1 = { ...deps, sesion: sesionDe({ sub: USUARIO, aal: 'aal1' }) };
    expect(await lanzado(presupuesto(aal1))).toMatchObject({ datos: { aal: 'aal1' } });
  });
});
