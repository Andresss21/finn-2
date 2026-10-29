// Consultas de por cobrar, programadas, reglas y notificaciones (TA-197; 04 §6.12; PRU-INT-COBRO-102). Sobre la base de
// prueba de @finn/db (TA-152): cada DTO es el del selector del dominio más el encabezado común; las tablas [H] y [T]
// (reglas, movimientos, notificaciones) se siembran como administrador.
import { beforeAll, describe, expect, it } from 'vitest';
import { calcular } from '@finn/dominio';
import { porCobrar as selPorCobrar, programadas as selProgramadas } from '@finn/dominio/selectores';
import { FechaLocal } from '@finn/dominio/valores';
import { cargarHechos, leer, leerReferenciasDeProgramadas, Memoria } from '@finn/db';
import { MOVIMIENTOS, sembrarBandejaCompleta } from '../../db/test/ayudantes/ajustes-prueba.ts';
import { crearBasePrueba } from '../../db/test/ayudantes/base.ts';
import { escribirHechosDePrueba, HOY, RELOJ } from '../../db/test/ayudantes/hechos-prueba.ts';
import { sembrarNotificacionesDelCentro } from '../../db/test/ayudantes/notificaciones-prueba.ts';
import { sembrarReglaDeComercio } from '../../db/test/ayudantes/reglas-prueba.ts';
import type { ClaimsSesion, SesionServidor } from '../src/autenticacion/autorizar.ts';
import type { DepsConsulta } from '../src/consultas/comun.ts';
import { notificaciones } from '../src/consultas/notificaciones.ts';
import { porCobrar } from '../src/consultas/por-cobrar.ts';
import { programadas } from '../src/consultas/programadas.ts';
import { reglas } from '../src/consultas/reglas.ts';
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
const COMIDA = '00000000-0000-4000-8000-000000000011';
const TX_SUPER = '00000000-0000-4000-8000-000000000104';

describe('PRU-INT-COBRO', () => {
  const base = crearBasePrueba();

  beforeAll(async () => {
    await escribirHechosDePrueba(base);
    process.env['DATABASE_URL'] = base.url; // el cliente del proceso (04 §2.5)
    await sembrarReglaDeComercio(base, 'netflix', COMIDA); // [H]
    await sembrarBandejaCompleta(base);
    await sembrarNotificacionesDelCentro(base);
  });

  it('PRU-INT-COBRO-102 [inv. 27, Q-porCobrar, Q-programadas, Q-reglas, Q-notificaciones] porCobrar(), programadas() a 30 días, reglas() y notificaciones() con su destino y existeDestino', async () => {
    const deps: DepsConsulta = {
      memoria: new Memoria(),
      sesion: sesionDe({ sub: USUARIO, aal: 'aal2' }),
      usuarioPermitido: USUARIO,
      opciones: () => RELOJ,
    };
    const ref = await leer(
      async (tx) => ({
        i: calcular(await cargarHechos(tx), FechaLocal.desdeTexto(HOY)),
        referencias: await leerReferenciasDeProgramadas(tx),
        revision: tx.estado.revision,
      }),
      RELOJ,
    );
    // 1. porCobrar(): lo del selector; Ana debe 200 (1.500 - 1.000 cobrados - 300 condonados)
    const cobrar = await porCobrar(deps);
    expect(cobrar).toMatchObject({ revision: ref.revision, hoy: HOY, bandejaPorRevisar: 5 });
    expect(cobrar).toMatchObject(selPorCobrar(ref.i));
    expect(cobrar.totalAbierto).toBe(200);
    expect(cobrar.deudores.map((x) => [x.deudor.nombre, x.abierto])).toEqual([['Ana', 200]]);
    expect(cobrar.deudores[0]?.items).toHaveLength(1);
    expect(cobrar.deudores[0]?.items[0]).toMatchObject({
      estado: 'parcial',
      medio: 'debito',
      abierto: 200,
    });
    const conCerrados = await porCobrar(deps, { incluirCerrados: true });
    expect(conCerrados).toMatchObject(selPorCobrar(ref.i, { incluirCerrados: true }));

    // 2. programadas(): 30 días por defecto, desde el "hoy" de la base; el horizonte es un parámetro
    const prog = await programadas(deps);
    expect(prog).toMatchObject({ revision: ref.revision, hoy: HOY });
    expect(prog).toMatchObject(selProgramadas(ref.i, ref.referencias));
    expect(prog.programadas.map((x) => x.comercio)).toEqual(['Netflix', 'Pago Visa']);
    const limite = FechaLocal.sumarDias(FechaLocal.desdeTexto(HOY), 30);
    expect(prog.proximosPagos.every((o) => o.fechaEsperada <= limite)).toBe(true);
    const corto = await programadas(deps, { horizonteDias: 0 });
    expect(corto).toMatchObject(selProgramadas(ref.i, ref.referencias, 0));
    expect((await lanzado(programadas(deps, { horizonteDias: 31 }))).categoria).toBe('VALIDACION');

    // 3. reglas(): la regla [H] con su categoría
    const r = await reglas(deps);
    expect(r.reglas).toEqual([
      {
        id: expect.any(String) as string,
        patron: 'netflix',
        categoria: { id: COMIDA, nombre: 'Comida' },
        categoriaArchivada: false,
      },
    ]);

    // 4. notificaciones(): destino válido, existeDestino y el destino que no valida como ausente
    const pagina = await notificaciones(deps);
    expect(pagina.notificacionesNoLeidas).toBe(51); // 52 sembradas menos la leída
    expect(pagina.notificaciones).toHaveLength(50);
    expect(pagina.notificaciones[0]?.titulo).toBe('n52'); // la más nueva primero
    expect(pagina.siguienteCursor).toBe(pagina.notificaciones[49]?.id);
    const resto = await notificaciones(deps, { cursor: pagina.siguienteCursor });
    expect(resto.notificaciones.map((n) => n.titulo)).toEqual(['n2', 'n1']);
    expect(resto.siguienteCursor).toBeUndefined();
    const porTitulo = (t: string) =>
      [...pagina.notificaciones, ...resto.notificaciones].find((n) => n.titulo === t);
    expect(porTitulo('n1')).toMatchObject({
      destino: { pantalla: 'movimiento', movimientoId: MOVIMIENTOS.pendiente },
      leida: false,
      existeDestino: true,
    });
    expect(porTitulo('n2')).toMatchObject({ existeDestino: false, leida: false });
    expect(porTitulo('n3')).toMatchObject({
      destino: { pantalla: 'transaccion', transaccionId: TX_SUPER },
      leida: true,
      existeDestino: true,
    });
    expect(porTitulo('n4')).toMatchObject({ existeDestino: false });
    expect(porTitulo('n5')).not.toHaveProperty('destino'); // no valida con el contrato
    expect(porTitulo('n6')).not.toHaveProperty('destino'); // sin destino
    expect(porTitulo('n6')).toMatchObject({ existeDestino: true });
    const noLeidas = await notificaciones(deps, { soloNoLeidas: true });
    expect(noLeidas.notificaciones.some((n) => n.leida || n.titulo === 'n3')).toBe(false);
    expect((await lanzado(notificaciones(deps, { cursor: 'no-es-uuid' }))).categoria).toBe(
      'VALIDACION',
    );
  });
});
