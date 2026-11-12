// Textos de `/presupuesto/categorias/[categoriaId]/fusionar` (FT-20; 05 §2.3, §4.4, §7). Voseo (05 §12.2). Los rechazos
// (`fusion_misma_categoria`, `fusion_categoria_de_pago`, `fusion_destino_archivado`) los trae el servidor con su mensaje; acá
// solo lo propio del flujo.
import { glosario } from './glosario.ts';

export const categoriasFusionar = {
  titulo: 'Fusionar categorías',
  intro: (origen: string) =>
    `Todo el historial de ${origen} pasa a la categoría que elijas, como si siempre hubieran sido una sola.`,
  destino: 'Fusionar con',
  sinDestinos: 'No hay otra categoría activa con la que fusionar. Creá o desarchivá una y volvé.',
  resumenTitulo: 'Lo que se mueve',
  periodos: (n: number) => (n === 1 ? '1 período con asignación' : `${n} períodos con asignación`),
  transacciones: (n: number) => (n === 1 ? '1 transacción' : `${n} transacciones`),
  condonaciones: (n: number) => (n === 1 ? '1 condonación' : `${n} condonaciones`),
  programadas: (n: number) => (n === 1 ? '1 programada' : `${n} programadas`),
  reglas: (n: number) => (n === 1 ? '1 regla de comercio' : `${n} reglas de comercio`),
  metaDescartada: (origen: string) => `Se descarta la meta de ${origen}.`,
  fusionar: 'Fusionar',
  fusionando: 'Fusionando…',
  // E4-1: la tarjeta de impacto va en la misma pantalla, debajo del destino.
  rotuloImpacto: 'Antes de confirmar',
  calculando: 'Calculando el impacto…',
  impactoCambio: 'El impacto cambió. Revisalo antes de confirmar.',
  revisar: 'Revisá el impacto',
  deltaLpa: (delta: string) => `${glosario.listoParaAsignar}: ${delta}`,
  deltaDisponible: (categoria: string, delta: string) =>
    `${glosario.disponible} de ${categoria}: ${delta}`,
  deltaPeriodo: (periodo: string, categoria: string, delta: string) =>
    `${glosario.asignado} de ${categoria} desde ${periodo}: ${delta}`,
  sinCambios: 'La fusión no cambia ningún número del período actual.',
  periodoCerrado: 'La fusión modifica períodos cerrados.',
  confirmar: 'Confirmar',
  volverAEditar: 'Volver a editar',
  listo: 'Categorías fusionadas',
  rechazos: {
    otro: 'No se puede fusionar con lo elegido. Volvé a editar y revisá la categoría.',
  },
} as const;
