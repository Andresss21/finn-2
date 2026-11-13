// Textos de `/actividad` (FT-24; 05 §2.6, §7.2). Voseo (05 §12.2). Los nombres de tipo y de estado son los del detalle de cuenta.
import { cuentaDetalle } from './cuenta-detalle.ts';

export const actividad = {
  titulo: 'Actividad',
  vacioTitulo: 'Todavía no hay transacciones',
  vacioTexto: 'Cuando registres un gasto, un ingreso o una transferencia, lo vas a ver acá.',
  buscar: 'Buscar',
  buscarMarcador: 'Buscá por comercio o nota',
  borrarBusqueda: 'Borrar búsqueda',
  filtrosActivos: (n: number) => `Filtros, ${n} activos`,
  quitarFiltro: (nombre: string) => `Quitar filtro ${nombre}`,
  partes: (n: number) => `${n} partes`,
  filtros: 'Filtros',
  aplicar: 'Filtrar',
  quitarFiltros: 'Quitar filtros',
  archivada: (nombre: string) => `${nombre} (archivada)`,
  cargarMas: 'Cargar más',
  alInicio: 'Volver a las más recientes',
  cuenta: 'Cuenta',
  categoria: 'Categoría',
  tipo: 'Tipo',
  estado: 'Estado',
  estadoBancario: 'Estado bancario',
  verResultados: 'Ver resultados',
  // [CH-250] El conteo y el total los da el servidor (ACT-04, ACT-08).
  verNResultados: (n: number) => (n === 1 ? 'Ver 1 resultado' : `Ver ${n} resultados`),
  resumen: (n: number, total: string) =>
    `${n} ${n === 1 ? 'transacción' : 'transacciones'} · ${total}`,
  resultadosPara: (n: number, texto: string) =>
    `${n} ${n === 1 ? 'resultado' : 'resultados'} para “${texto}”`,
  cargando: 'Cargando…',
  origen: 'Origen',
  desde: 'Desde',
  hasta: 'Hasta',
  montoDesde: 'Monto desde',
  montoHasta: 'Monto hasta',
  todas: 'Todas',
  todos: 'Todos',
  tipos: cuentaDetalle.filtros.tipos,
  estados: cuentaDetalle.filtros.estados,
  origenes: { sms: 'SMS', manual: 'Manual', importada: 'Importada', programada: 'Programada' },
} as const;
