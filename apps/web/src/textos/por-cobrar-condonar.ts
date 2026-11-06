// Textos de `/por-cobrar/condonar/[lineaId]` (FT-47; 05 §12). Voseo. Sin textos nuevos de errores (06 FT-47): los rechazos del
// servidor (`condonacion_mayor_que_abierto`, `categoria_archivada`, `evento_anterior_a_original`…) llegan compuestos en `mensaje`.
import { glosario } from './glosario.ts';

export const porCobrarCondonar = {
  titulo: (deudor: string) => `Condonar a ${deudor}`,
  abierto: (monto: string) => `Abierto ${monto}`,
  monto: 'Monto',
  hastaAbierto: (monto: string) => `Hasta ${monto} abiertos.`,
  fecha: 'Fecha',
  categoria: 'Pasa como gasto tuyo en',
  marcador: 'Elegí una categoría',
  disponibleDe: (monto: string) => `${glosario.disponible} ${monto}`,
  /** La categoría de la compra está archivada: no se propone y se pide una activa (06 FT-47, Estados). */
  sinPropuesta: 'La categoría de esta compra está archivada: elegí una categoría activa.',
  obligatorio: 'Completá este campo.',
  elegirCategoria: 'Elegí una categoría.',
  condonar: 'Condonar',
  condonarMonto: (monto: string) => `Condonar ${monto}`,
  condonando: 'Condonando…',
  revisar: 'Revisá el impacto',
  confirmar: 'Confirmar',
  volverAEditar: 'Volver a editar',
  tituloListo: 'Condonación registrada',
  guardado: (monto: string, deudor: string) => `Condonaste ${monto} a ${deudor}.`,
  listo: 'Listo',
  avisos: {
    'AV-01': 'La fecha es de un período cerrado: cambia el período activo.',
    'AV-02': glosario.sobregiroConDebitoOEfectivo,
    'AV-03': glosario.deudaSinReservar,
  } as Readonly<Record<string, string>>,
} as const;
