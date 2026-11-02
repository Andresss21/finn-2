// Textos de los Primeros pasos de Inicio (FT-04; 06 §3.15, CF-18; 05 §12).
export const primerosPasos = {
  titulo: 'Primeros pasos',
  pasos: {
    cuenta: 'Crear una cuenta',
    categorias: 'Crear las categorías',
    sms: 'Conectar los SMS',
  },
  hecho: (paso: string) => `Hecho: ${paso}`,
  ocultar: 'Ocultar por ahora',
  recordatorio: (k: number) => `Primeros pasos: ${k} de 3`,
  mostrar: 'Mostrar en Inicio',
} as const;
