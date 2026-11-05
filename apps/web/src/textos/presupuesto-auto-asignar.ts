// Textos de `/presupuesto/auto-asignar` (FT-13; 05 §2.3, §4.4). Voseo (05 §12.2). Los mensajes de las operaciones
// (`periodo_cerrado`, `conflicto_desactualizado`…) los trae el servidor; acá solo lo propio del flujo.
import { glosario } from './glosario.ts';

export const presupuestoAutoAsignar = {
  titulo: 'Auto-asignar',
  calculando: 'Calculando lo que asignaría…',
  // 06 FT-13, Estados: sin metas con falta no hay nada que confirmar.
  sinFalta: 'Todas tus metas de este período están cubiertas.',
  // Del export (07-flujos-del-presupuesto, CH-180): subtítulo, introducción, fila de cada categoría y título del estado cubierto.
  periodo: (periodo: string) => `Período ${periodo}`,
  intro: (lpa: string) =>
    `Finn asigna lo que falta para cada meta, en orden, hasta donde alcance ${glosario.listoParaAsignar} (${lpa}).`,
  faltaParaLaMeta: 'falta para la meta',
  nadaQueAutoAsignar: 'Nada que auto-asignar',
  revisar: 'Esto asignaría Finn',
  impactoLpa: (delta: string) => `${glosario.listoParaAsignar} cambia ${delta}.`,
  // 06 FT-13, Estados: con Listo para asignar en cero o negativo no se asigna nada.
  nadaQueAsignar: `No hay dinero en ${glosario.listoParaAsignar}: Finn no asignará nada.`,
  sinCubrir: (categoria: string, monto: string) => `${categoria} quedó sin cubrir por ${monto}.`,
  confirmar: 'Asignar',
  cancelar: 'Cancelar',
  volver: 'Volver a Presupuesto',
  listo: 'Asignación hecha',
  entendido: 'Listo',
  volverACalcular: 'Volver a calcular',
  // Lo que la previsualización de OP-17 rechaza llega como código, sin mensaje compuesto (04 §4.3).
  rechazos: {
    periodo_cerrado: 'No se puede cambiar lo asignado en un período cerrado.',
    otro: 'No se puede auto-asignar ahora.',
  },
} as const;
