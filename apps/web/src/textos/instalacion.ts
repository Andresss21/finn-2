// Textos de la instalación de la app en Ajustes (FT-05; 05 §8.7, FE-58). El nombre accesible de la acción y las
// instrucciones de iPhone salen de acá (FE-51).
export const instalacion = {
  titulo: 'Instalar Finn',
  accion: 'Instalar Finn en este dispositivo',
  ayudaAndroid: 'Se abre el diálogo de tu navegador para agregar Finn a la pantalla de inicio.',
  iosTitulo: 'Instalar Finn en tu iPhone',
  iosPasos: [
    'Tocá «Compartir» en la barra de Safari.',
    'Elegí «Agregar a inicio».',
    'Tocá «Agregar».',
  ],
} as const;
