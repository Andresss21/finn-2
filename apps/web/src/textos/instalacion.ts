// Textos de la instalación de la app en Ajustes (FT-05; 05 §8.7, FE-58; E5-17 de la entrega 4). El nombre accesible de la acción y
// las instrucciones de iPhone salen de acá (FE-51).
export const instalacion = {
  /** Android: la tarjeta de arriba de Ajustes. */
  titulo: 'Instalá Finn en este dispositivo',
  accion: 'Instalar Finn en este dispositivo',
  ayudaAndroid:
    'Se abre como una app, sin la barra del navegador, y queda en tu pantalla de inicio.',
  /** iPhone: los pasos de Safari (CA-05.2). */
  iosTitulo: 'Instalá Finn en este iPhone',
  iosAyuda: 'Se abre como una app, sin la barra del navegador, y así puede recibir notificaciones.',
  iosIntro: 'En iPhone se instala desde Safari:',
  iosPasos: [
    'Tocá Compartir, el cuadrado con la flecha, en la barra de Safari.',
    'Elegí «Agregar a inicio».',
    'Abrí Finn desde el ícono nuevo.',
  ],
} as const;
