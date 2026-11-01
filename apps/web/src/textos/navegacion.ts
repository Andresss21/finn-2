// Textos del marco y de la navegación (05 §3.3, §12.1; 06-identidad-visual §3 y §11). Los nombres accesibles de los
// enlaces llevan su contador (3.3): «Bandeja, 3 por revisar», «Notificaciones, 2 sin leer». `null` = sin dato (1.6).
export const navegacion = {
  saltar: 'Saltar al contenido',
  principal: 'Navegación principal',
  secundarias: 'Más secciones',
  masRotulo: 'Más',
  registrar: 'Registrar',
  marca: 'Finn',
  navegando: 'Navegando',
  sinConexion: 'Estás sin conexión',
  sinConexionNavegacion: 'Estás sin conexión. No se puede abrir esta pantalla.',
  // `/sin-conexion` (05 §8.5)
  sinConexionPagina: {
    titulo: 'Estás sin conexión',
    texto: 'Finn necesita internet para mostrarte tus números al día.',
    borrador: 'Lo que estabas registrando sigue guardado en esta pestaña.',
  },
  masDeNoventaYNueve: '99+',
  secciones: {
    inicio: 'Inicio',
    presupuesto: 'Presupuesto',
    bandeja: 'Bandeja',
    actividad: 'Actividad',
    cuentas: 'Cuentas',
    reportes: 'Reportes',
    metas: 'Metas',
    programadas: 'Programadas',
    'por-cobrar': 'Por cobrar',
    reglas: 'Reglas',
    notificaciones: 'Notificaciones',
    ajustes: 'Ajustes',
  },
  bandeja: (n: number | null) => (n === null || n === 0 ? 'Bandeja' : `Bandeja, ${n} por revisar`),
  notificaciones: (n: number | null) =>
    n === null || n === 0 ? 'Notificaciones' : `Notificaciones, ${n} sin leer`,
} as const;
