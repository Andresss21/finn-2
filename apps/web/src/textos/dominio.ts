// Textos de los componentes de dominio de presupuesto (05 §10.8; 06-identidad-visual §3, 2.5 a 2.16).
import { glosario } from './glosario.ts';

export const dominio = {
  asignado: glosario.asignado,
  gastado: glosario.gastado,
  disponible: glosario.disponible,
  /** 06 §5.6 (CA-E6-20): la fila de pago de tarjeta dice «Reservado», no «Disponible para pagar». */
  reservado: 'Reservado',
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
  /** [CH-250] La marca de una fila con lo que sigue por cobrar (E6-17: sin «te debe»). */
  enCamino: (monto: string) => `${glosario.enCamino} ${monto}`,
  billete: {
    rotulo: glosario.listoParaAsignar,
    todoAsignado: 'Todo asignado',
    asignasteDeMas: 'Asignaste más de lo que tenés',
    enCamino: glosario.enCamino,
  },
  periodo: {
    navegacion: 'Período',
    anterior: 'Período anterior',
    siguiente: 'Período siguiente',
    irAlActual: 'Ir al período actual',
    activo: 'Actual',
    cerrado: 'Cerrado',
    futuro: 'Futuro',
    transicion: (dias: number) => `Período de transición, ${dias} ${dias === 1 ? 'día' : 'días'}`,
    transcurridos: (n: number) => `${n} ${n === 1 ? 'día transcurrido' : 'días transcurridos'}`,
    quedan: (n: number) => `${n === 1 ? 'queda' : 'quedan'} ${n}`,
  },
} as const;
