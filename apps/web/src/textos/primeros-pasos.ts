// Textos de los Primeros pasos de Inicio (FT-04; 06 §3.15, CF-18; 05 §12).
export const primerosPasos = {
  titulo: 'Primeros pasos',
  pasos: {
    cuenta: 'Crear una cuenta',
    categorias: 'Crear las categorías',
    sms: 'Conectar los SMS',
  },
  // Los subtítulos de cada paso y el avance del encabezado son de la entrega 2 del diseño (bloque 15, CF-18).
  detalles: {
    cuenta: 'Cuenta corriente, tarjeta o efectivo',
    categorias: 'O empezá con la lista sugerida',
    sms: 'Con MacroDroid en tu teléfono',
  },
  progreso: (k: number) => `· ${k} de 3`,
  hechoCorto: 'Hecho',
  hecho: (paso: string) => `Hecho: ${paso}`,
  ocultar: 'Ocultar por ahora',
  recordatorio: (k: number) => `Primeros pasos: ${k} de 3`,
  mostrar: 'Mostrar en Inicio',
} as const;
