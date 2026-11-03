// Textos de `/presupuesto/auto-asignar` (FT-13; 05 §2.3, §4.4). Voseo (05 §12.2). Los mensajes de las operaciones
// (`periodo_cerrado`, `conflicto_desactualizado`…) los trae el servidor; acá solo lo propio del flujo.
import { glosario } from './glosario.ts';

export const presupuestoAutoAsignar = {
  titulo: 'Auto-asignar',
  calculando: 'Calculando lo que asignaría…',
  // 06 FT-13, Estados: sin metas con falta no hay nada que confirmar.
  sinFalta: 'Todas tus metas de este período están cubiertas.',
  revisar: 'Esto asignaría Finn',
  asignaria: (categoria: string, monto: string) => `${categoria}: ${monto}`,
  impactoLpa: (delta: string) => `${glosario.listoParaAsignar} cambia ${delta}.`,
  // 06 FT-13, Estados: con Listo para asignar en cero o negativo no se asigna nada.
  nadaQueAsignar: `No hay dinero en ${glosario.listoParaAsignar}: Finn no asignará nada.`,
  sinCubrir: (categoria: string, monto: string) => `${categoria} quedó sin cubrir por ${monto}.`,
  confirmar: 'Confirmar',
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
