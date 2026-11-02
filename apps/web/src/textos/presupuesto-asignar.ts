// Textos de `/presupuesto/asignar/[categoriaId]` (FT-10; 05 §2.3, §4.4, §4.7). Voseo (05 §12.2). Los mensajes de rechazo
// (`periodo_cerrado`, `lpa_negativo_en_futuro`, `categoria_archivada`…) los trae el servidor; acá solo lo propio del flujo.
import { dominio } from './dominio.ts';
import { glosario } from './glosario.ts';

export const presupuestoAsignar = {
  titulo: 'Asignar dinero',
  tituloDe: dominio.asignar,
  asignado: glosario.asignado,
  disponible: glosario.disponible,
  metaPide: 'La meta pide',
  metaFalta: dominio.faltaParaLaMeta,
  nuevoAsignado: 'Nuevo valor de Asignado',
  archivada: 'Esta categoría está archivada: solo podés quitarle dinero.',
  guardar: 'Guardar',
  guardando: 'Guardando…',
  revisar: 'Revisá el impacto',
  impactoLpa: (delta: string) => `${glosario.listoParaAsignar} cambia ${delta}.`,
  confirmar: 'Confirmar',
  volverAEditar: 'Volver a editar',
  obligatorio: 'Ingresá un monto.',
  avisos: {
    'AV-11': (lpa: string) => `Esta asignación dejará ${glosario.listoParaAsignar} en ${lpa}.`,
  },
  valorActual: (monto: string) => `El valor actual de ${glosario.asignado} es ${monto}.`,
  usarValorActual: 'Usar el valor actual',
  listo: 'Asignación guardada',
} as const;
