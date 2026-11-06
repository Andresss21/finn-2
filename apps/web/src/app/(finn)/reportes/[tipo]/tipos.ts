// El `[tipo]` de la URL y el `tipo` de la consulta `reporte()` (05 §2.10, 04 §6.9.2). Cualquier otro es `notFound()`.
export const TIPOS = {
  tendencia: 'tendencia',
  categorias: 'categorias',
  'ingresos-gastos': 'ingresos_gastos',
  remanente: 'remanente',
  'top-comercios': 'top_comercios',
  cumplimiento: 'cumplimiento',
  patrimonio: 'patrimonio',
  ritmo: 'ritmo',
  'gasto-semanal': 'gasto_semanal',
  realidad: 'realidad',
} as const;

export type TipoDeUrl = keyof typeof TIPOS;
export type TipoDeReporte = (typeof TIPOS)[TipoDeUrl];

export const TIPOS_DE_URL = Object.keys(TIPOS) as readonly TipoDeUrl[];
export const esTipoDeUrl = (valor: string): valor is TipoDeUrl => Object.hasOwn(TIPOS, valor);
