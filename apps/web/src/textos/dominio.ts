// Textos de los componentes de dominio de presupuesto (05 §10.8; 06-identidad-visual §3, 2.5 a 2.16).
import { glosario } from './glosario.ts';

export const dominio = {
  asignado: glosario.asignado,
  gastado: glosario.gastado,
  disponible: glosario.disponible,
  disponibleParaPagar: 'Disponible para pagar',
  teFaltaReservar: glosario.teFaltaReservar,
  reservadoDeMas: glosario.reservadoDeMas,
  pagoExcedente: 'Pago excedente',
  alDia: 'Al día',
  periodoCerrado: glosario.periodoCerrado,
  sobregiroDebito: glosario.sobregiroConDebitoOEfectivo,
  deudaSinReservar: glosario.deudaSinReservar,
  metaCubierta: 'Meta cubierta',
  faltaParaLaMeta: 'Falta para la meta',
  metaCumplida: 'Meta cumplida',
  metaCompletada: 'Meta completada',
  metaVencida: 'Meta vencida',
  asignar: (categoria: string) => `Asignar a ${categoria}`,
  marcas: {
    porCobrar: glosario.porCobrar,
    conDevoluciones: 'Con devoluciones',
    conciliada: glosario.conciliada,
    programada: 'Programada',
    periodoCerrado: glosario.periodoCerrado,
  },
  estadoBancario: {
    pendiente: glosario.pendiente,
    confirmada: glosario.confirmada,
    conciliada: glosario.conciliada,
  },
  sinComercio: 'Sin comercio',
} as const;
