// `consultas.ajustes()` (04 §6.11): el ciclo sale de los hechos del motor ([M] `vigencias_ciclo`); el resto, de [H],
// [I] y [T] en la misma instantánea de `leer()`: webhook (nunca el hash), formatos con sus usos, suscripciones push
// (sin claves), respaldo y diagnóstico. Los avisos de atraso (36 h, 35 días) los fija el repositorio (03 §7.5).
import type { FechaLocal } from '@finn/dominio/valores';
import { leerAjustesTecnicos } from '@finn/db';
import { sinParametros } from '../contratos/consultas.ts';
import { consultar, type DepsConsulta, type Encabezado } from './comun.ts';

/** Rutas de descarga de las exportaciones (OPT-08, 04 §3). */
const EXPORTACIONES = { json: '/api/exportar/json', csv: '/api/exportar/csv' } as const;

interface Ref {
  readonly id: string;
  readonly nombre: string;
}

export interface AjustesDto extends Encabezado {
  readonly ciclo: {
    readonly diaInicioVigente: number;
    readonly vigenciaFutura?: { readonly diaInicio: number; readonly rigeDesde: FechaLocal };
  };
  readonly webhook: { readonly configurado: boolean; readonly rotadoEn?: string };
  readonly formatos: readonly {
    readonly id: string;
    readonly institucion: Ref;
    readonly nombre: string;
    readonly tipoMovimiento: string;
    readonly activo: boolean;
    readonly usos: number;
    readonly ultimoUso?: string;
  }[];
  readonly instituciones: readonly Ref[];
  readonly suscripcionesPush: readonly {
    readonly endpointCorto: string;
    readonly agente?: string;
    readonly renovadaEn: string;
  }[];
  readonly respaldo: {
    readonly ultimoRespaldoEn?: string;
    readonly ultimaRestauracionEn?: string;
    readonly respaldoAtrasado: boolean;
    readonly restauracionAtrasada: boolean;
  };
  readonly diagnostico: readonly {
    readonly ocurridoEn: string;
    readonly nivel: 'aviso' | 'error';
    readonly origen: string;
    readonly mensaje: string;
    readonly idError?: string;
  }[];
  readonly exportaciones: { readonly json: string; readonly csv: string };
}

export function ajustes(d: DepsConsulta): Promise<AjustesDto> {
  return consultar(
    d,
    { nombre: 'ajustes', contrato: sinParametros, parametros: undefined },
    async ({ tx, i, encabezado }) => {
      const t = await leerAjustesTecnicos(tx);
      // La vigencia inicial no tiene "rige desde"; la vigente es la última que ya rige y la futura, la primera que no
      const vigencias = [...i.hechos.vigencias_ciclo].sort((a, b) =>
        (a.rigeDesde ?? '') < (b.rigeDesde ?? '') ? -1 : 1,
      );
      const vigente = vigencias.filter((v) => v.rigeDesde === null || v.rigeDesde <= i.hoy).at(-1);
      const futura = vigencias.find((v) => v.rigeDesde !== null && v.rigeDesde > i.hoy);
      const institucion = (id: string): Ref =>
        t.instituciones.find((x) => x.id === id) ?? { id, nombre: '' };
      return {
        ...encabezado,
        ciclo: {
          diaInicioVigente: vigente?.diaInicio ?? 1,
          ...(futura?.rigeDesde == null
            ? {}
            : { vigenciaFutura: { diaInicio: futura.diaInicio, rigeDesde: futura.rigeDesde } }),
        },
        webhook:
          t.webhook === null
            ? { configurado: false }
            : { configurado: true, rotadoEn: t.webhook.rotadoEn },
        formatos: t.formatos.map((f) => ({
          id: f.id,
          institucion: institucion(f.institucionId),
          nombre: f.nombre,
          tipoMovimiento: f.tipoMovimiento,
          activo: f.activo,
          usos: f.usos,
          ...(f.ultimoUso === null ? {} : { ultimoUso: f.ultimoUso }),
        })),
        instituciones: t.instituciones,
        suscripcionesPush: t.suscripciones.map((s) => ({
          endpointCorto: s.endpointCorto,
          ...(s.agente === null ? {} : { agente: s.agente }),
          renovadaEn: s.renovadaEn,
        })),
        respaldo: {
          ...(t.respaldo.ultimoRespaldoEn === null
            ? {}
            : { ultimoRespaldoEn: t.respaldo.ultimoRespaldoEn }),
          ...(t.respaldo.ultimaRestauracionEn === null
            ? {}
            : { ultimaRestauracionEn: t.respaldo.ultimaRestauracionEn }),
          respaldoAtrasado: t.respaldo.respaldoAtrasado,
          restauracionAtrasada: t.respaldo.restauracionAtrasada,
        },
        diagnostico: t.diagnostico.map((e) => ({
          ocurridoEn: e.ocurridoEn,
          nivel: e.nivel,
          origen: e.origen,
          mensaje: e.mensaje,
          ...(e.idError === null ? {} : { idError: e.idError }),
        })),
        exportaciones: EXPORTACIONES,
      };
    },
  );
}
