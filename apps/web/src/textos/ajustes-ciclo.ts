// Textos de `/ajustes/ciclo` (FT-72; 05 §2.11, §12; 06 FT-72). Voseo (05 §12.2). AV-12 se arma acá con las fechas que trae el servidor
// (`rigeDesde`, `transicionInicio`, `transicionFin`); el rechazo `ciclo_sin_cambio` de la previsualización lleva el día en sus datos
// (el mensaje de 04 §7.6 es el mismo). Los errores de red y de versión son los de `formularios`.
import { glosario } from './glosario.ts';

export const ajustesCiclo = {
  titulo: 'Ciclo',
  /** [CH-240] E6-13: el flujo corto es una hoja sobre Ajustes. */
  tituloHoja: 'Cambiar el ciclo',
  enlace: 'Ciclo de los períodos',
  vigente: 'Hoy empieza el día',
  futura: 'Vigencia futura',
  sinFutura: 'Ninguna',
  futuraDetalle: (dia: number, desde: string) => `Día ${dia}, desde el ${desde}`,
  nuevoDia: 'Nuevo día de inicio',
  calculando: 'Calculando el impacto…',
  revisar: 'Antes de confirmar',
  rigeDesde: (desde: string) => `Rige desde el ${desde}`,
  transicion: (inicio: string, fin: string, dias: number) =>
    `El período del ${inicio} al ${fin} será de transición, de ${dias} ${dias === 1 ? 'día' : 'días'}; ningún período con asignaciones cambia.`,
  diaDeInicio: 'Día de inicio',
  periodoTransicion: 'Período de transición',
  sinTransicion: 'Ningún período con asignaciones cambia.',
  dineroNoCambia: `${glosario.listoParaAsignar} y los ${glosario.disponible}s no cambian.`,
  /** Deshabilitado mientras no hay un cambio que confirmar; con un día nuevo y su impacto a la vista, `confirmarDia`. */
  confirmar: 'Cambiar el ciclo',
  confirmarDia: (dia: number) => `Cambiar al día ${dia}`,
  hecho: 'Listo',
  rechazos: {
    ciclo_sin_cambio: (dia: string) => `El ciclo ya empieza el día ${dia}.`,
    otro: 'No se pudo cambiar el ciclo. Probá de nuevo.',
  },
  listo: (dia: number, desde: string) => `El ciclo empezará el día ${dia} desde el ${desde}.`,
} as const;
