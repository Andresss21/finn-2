// [CH-251] Lo que las pantallas de Reportes, Reglas y el índice de Ajustes ya no arman (04 §6.9, §6.11, §6.12.2), contra
// PostgreSQL sobre la base de prueba de @finn/db: la cifra de los reportes (E5-5) y el texto de los hallazgos (E5-22) salen
// de reporte(), «Coincide con» de reglas() y los resúmenes del índice de ajustes().
import { beforeAll, describe, expect, it } from 'vitest';
import { calcular } from '@finn/dominio';
import { coincidenciasDeReglas, reportes, ritmo } from '@finn/dominio/selectores';
import { FechaLocal } from '@finn/dominio/valores';
import { cargarHechos, leer, leerReglasComercio, Memoria } from '@finn/db';
import {
  sembrarAjustesTecnicos,
  sembrarBandejaCompleta,
  sembrarErroresRecientes,
} from '../../db/test/ayudantes/ajustes-prueba.ts';
import { crearBasePrueba } from '../../db/test/ayudantes/base.ts';
import { escribirHechosDePrueba, HOY, RELOJ } from '../../db/test/ayudantes/hechos-prueba.ts';
import { sembrarReglaDeComercio } from '../../db/test/ayudantes/reglas-prueba.ts';
import type { ClaimsSesion, SesionServidor } from '../src/autenticacion/autorizar.ts';
import { ajustes } from '../src/consultas/ajustes.ts';
import type { DepsConsulta } from '../src/consultas/comun.ts';
import { reglas } from '../src/consultas/reglas.ts';
import { reporte } from '../src/consultas/reporte.ts';
import { textoDeHallazgo } from '../src/consultas/textos-hallazgos.ts';

const USUARIO = 'usuario-unico';
const COMIDA = '00000000-0000-4000-8000-000000000011';
const sesion: SesionServidor = {
  obtenerClaims: () => Promise.resolve({ sub: USUARIO, aal: 'aal2' } as ClaimsSesion),
  obtenerUsuario: () => Promise.resolve({ id: USUARIO }),
};
const deps = (): DepsConsulta => ({
  memoria: new Memoria(),
  sesion,
  usuarioPermitido: USUARIO,
  opciones: () => RELOJ,
});

const base = crearBasePrueba();
beforeAll(async () => {
  await escribirHechosDePrueba(base);
  process.env['DATABASE_URL'] = base.url; // el cliente del proceso (04 §2.5)
  await sembrarReglaDeComercio(base, 'netflix', COMIDA); // solo una programada se llama así
  await sembrarReglaDeComercio(base, 'SUP', COMIDA); // la transacción 4, «Super»
});
const instantanea = () =>
  leer(
    async (tx) => ({
      i: calcular(await cargarHechos(tx), FechaLocal.desdeTexto(HOY)),
      reglas: await leerReglasComercio(tx),
    }),
    RELOJ,
  );

describe('PRU-INT-REP', () => {
  it('PRU-INT-REP-790 [Q-reporte, FT-60, FT-67, inv. 27] (CH-251) reporte() trae la cifra de Tendencia, Ingresos y gastos, Cumplimiento, Realidad y Flujo de efectivo del selector y cada hallazgo con el texto del catálogo', async () => {
    const { i, reglas: rs } = await instantanea();
    const seis = { ventana: 'ultimos_6' } as const;
    const ultimo = JSON.parse(JSON.stringify(reportes.ultimoPeriodo(i, 'ultimos_6'))) as object;
    expect(await reporte(deps(), { tipo: 'tendencia', ...seis })).toMatchObject({
      ultimoPeriodo: ultimo,
    });
    expect(await reporte(deps(), { tipo: 'ingresos_gastos', ...seis })).toMatchObject({
      ultimoPeriodo: ultimo,
    });
    expect((await reporte(deps(), { tipo: 'tendencia' })).ultimoPeriodo).toEqual(
      JSON.parse(JSON.stringify(reportes.ultimoPeriodo(i))),
    );
    expect((await reporte(deps(), { tipo: 'cumplimiento' })).resumen).toEqual(
      JSON.parse(JSON.stringify(reportes.resumenCumplimiento(i))),
    );
    expect((await reporte(deps(), { tipo: 'realidad' })).alejadas).toBe(
      reportes.realidad(i).alejadas,
    );
    expect((await reporte(deps(), { tipo: 'flujo_efectivo', ...seis })).variacion).toBe(
      reportes.flujoEfectivo(i, seis).variacion,
    );

    const sel = {
      ritmo: ritmo(i).hallazgos,
      realidad: reportes.realidad(i).hallazgos,
      hormiga: reportes.hormiga(i, rs).hallazgos,
      suscripciones: reportes.suscripciones(i, rs).hallazgos,
      tarjetas: reportes.tarjetas(i).hallazgos,
      hallazgos: reportes.hallazgos(i, rs).hallazgos,
      flujo_efectivo: reportes.flujoEfectivo(i).hallazgos,
    };
    for (const [tipo, esperados] of Object.entries(sel)) {
      const r = (await reporte(deps(), { tipo })) as unknown as {
        hallazgos: { texto: string }[];
      };
      expect(r.hallazgos.map((h) => h.texto)).toEqual(esperados.map(textoDeHallazgo));
    }
  });
});

describe('PRU-INT-BAND', () => {
  it('PRU-INT-BAND-790 [Q-reglas, FT-39, CA-39.1] (CH-251) reglas() trae «Coincide con» del selector: «Super» para SUP y nada para netflix, que solo es una programada', async () => {
    const { i, reglas: rs } = await instantanea();
    const dto = await reglas(deps());
    const esperado = coincidenciasDeReglas(i, rs);
    expect(Object.fromEntries(dto.reglas.map((r) => [r.patron, r.coincideCon]))).toEqual({
      netflix: [],
      SUP: ['Super'],
    });
    for (const r of dto.reglas) expect(r.coincideCon).toEqual(esperado.get(r.id as never));
  });
});

describe('PRU-INT-AJUS', () => {
  it('PRU-INT-AJUS-790 [Q-ajustes, FT-72, FT-76] (CH-251) el resumen del índice cuenta los formatos activos, las instituciones y los errores de los últimos 7 días, sin los avisos ni los errores más viejos', async () => {
    const vacio = await ajustes(deps());
    expect(vacio.resumen).toEqual({
      formatosActivos: 0,
      instituciones: vacio.instituciones.length,
      erroresSieteDias: 0,
    });
    await sembrarBandejaCompleta(base); // un formato activo y uno inactivo
    await sembrarAjustesTecnicos(base); // un error, un aviso y un evento informativo
    await sembrarErroresRecientes(base); // un error de hace 1 día, uno de hace 8 y un aviso de hace 1
    // El error sembrado por `sembrarAjustesTecnicos` (2027-02-03) y el de hace 1 día; no el de hace 8 ni los avisos.
    const dto = await ajustes(deps());
    expect(dto.resumen).toEqual({
      formatosActivos: 1,
      instituciones: dto.instituciones.length,
      erroresSieteDias: 2,
    });
  });
});
