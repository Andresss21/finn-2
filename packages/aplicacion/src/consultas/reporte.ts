// `consultas.reporte({ tipo, ... })` (04 §6.9, BE-40): un tipo por llamada, con el encabezado común. Cada tipo es un
// selector puro del dominio (inv. 27); la consulta solo despacha y lee las reglas de comercio [H] donde el selector
// las pide. Los reportes que son listas van bajo un nombre (`periodos`, `filas`, `comercios`).
// `patrimonio` renombra `hoy` del selector a `posicionHoy` (CH-39): `hoy` es la fecha del Encabezado.
// PENDIENTE DE DOMINIO: 6.9 pide `filtros: { cuentas, grupos, categorias }` (CP-12) y ningún selector lo entrega; no se
// calcula aquí (inv. 27).
import type { Instantanea, Uuid } from '@finn/dominio';
import { datosBase, reportes, ritmo } from '@finn/dominio/selectores';
import { leerReglasComercio, type LectorTx } from '@finn/db';
import { parametrosReporte, type ParametrosReporte } from '../contratos/consultas.ts';
import { consultar, type DepsConsulta, type Encabezado } from './comun.ts';
import { sinIndefinidos } from './sin-indefinidos.ts';

type De<T extends ParametrosReporte['tipo']> = Extract<ParametrosReporte, { tipo: T }>;
interface Ctx {
  readonly i: Instantanea;
  readonly tx: LectorTx;
}
const filtro = (p: {
  readonly ventana?: reportes.Ventana | undefined;
  readonly cuentaIds?: readonly Uuid[] | undefined;
}) => sinIndefinidos({ ventana: p.ventana, cuentaIds: p.cuentaIds });

/** El despacho por tipo: el selector del dominio de cada uno. */
const cuerpos = {
  ritmo: ({ i }: Ctx) => ritmo(i),
  realidad: ({ i }: Ctx) => reportes.realidad(i),
  hormiga: async ({ i, tx }: Ctx, p: De<'hormiga'>) =>
    reportes.hormiga(
      i,
      await leerReglasComercio(tx),
      sinIndefinidos({ periodo: p.periodo, cuentaIds: p.cuentaIds }),
    ),
  suscripciones: async ({ i, tx }: Ctx) => reportes.suscripciones(i, await leerReglasComercio(tx)),
  hallazgos: async ({ i, tx }: Ctx) => reportes.hallazgos(i, await leerReglasComercio(tx)),
  tarjetas: ({ i }: Ctx, p: De<'tarjetas'>) => reportes.tarjetas(i, filtro(p)),
  flujo_efectivo: ({ i }: Ctx, p: De<'flujo_efectivo'>) => reportes.flujoEfectivo(i, filtro(p)),
  patrimonio: ({ i }: Ctx, p: De<'patrimonio'>) => {
    const { hoy, serie } = reportes.patrimonio(i, filtro(p));
    return { posicionHoy: hoy, serie };
  },
  datos_base: ({ i }: Ctx, p: De<'datos_base'>) => datosBase(i, filtro(p)),
  categorias: ({ i }: Ctx, p: De<'categorias'>) =>
    reportes.categorias(i, { ...filtro(p), ...sinIndefinidos({ grupoId: p.grupoId }) }),
  tendencia: ({ i }: Ctx, p: De<'tendencia'>) => ({ periodos: reportes.tendencia(i, filtro(p)) }),
  ingresos_gastos: ({ i }: Ctx, p: De<'ingresos_gastos'>) => ({
    periodos: reportes.ingresosGastos(i, filtro(p)),
  }),
  remanente: ({ i }: Ctx, p: De<'remanente'>) => ({ periodos: reportes.remanente(i, filtro(p)) }),
  cumplimiento: ({ i }: Ctx, p: De<'cumplimiento'>) => ({
    filas: reportes.cumplimiento(i, filtro(p)),
  }),
  top_comercios: async ({ i, tx }: Ctx, p: De<'top_comercios'>) => ({
    comercios: reportes.topComercios(i, await leerReglasComercio(tx), {
      ...filtro(p),
      ...sinIndefinidos({ limite: p.limite }),
    }),
  }),
  gasto_semanal: ({ i }: Ctx, p: De<'gasto_semanal'>) =>
    reportes.gastoSemanal(
      i,
      sinIndefinidos({ periodoInicio: p.periodoInicio, categoriaIds: p.categoriaIds }),
    ),
};

/** El cuerpo de cada tipo: lo que devuelve su selector. */
type Cuerpos = { readonly [T in keyof typeof cuerpos]: Awaited<ReturnType<(typeof cuerpos)[T]>> };

export type ReporteDto = Encabezado & Cuerpos[keyof Cuerpos];
export type ReporteDe<T extends keyof Cuerpos> = Encabezado & Cuerpos[T];

/** Con el tipo conocido en el tipo de TypeScript, el DTO es el de ese tipo. */
export function reporte<P extends { readonly tipo: keyof Cuerpos }>(
  d: DepsConsulta,
  parametros: P,
): Promise<ReporteDe<P['tipo']>>;
export function reporte(d: DepsConsulta, parametros: unknown): Promise<ReporteDto>;
export function reporte(d: DepsConsulta, parametros: unknown): Promise<ReporteDto> {
  return consultar(
    d,
    { nombre: 'reporte', contrato: parametrosReporte, parametros },
    async ({ i, tx, encabezado }, p): Promise<ReporteDto> => {
      const calcular = cuerpos[p.tipo] as (c: Ctx, p: unknown) => unknown;
      return { ...encabezado, ...((await calcular({ i, tx }, p)) as Cuerpos[keyof Cuerpos]) };
    },
  );
}
