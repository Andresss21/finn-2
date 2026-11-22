// Textos del marco y de la navegación (05 §3.3, §12.1; 06-identidad-visual §3 y §11). Los nombres accesibles de los
// enlaces llevan su contador (3.3): «Bandeja, 3 por revisar», «Notificaciones, 2 sin leer». `null` = sin dato (1.6).
export const navegacion = {
  saltar: 'Saltar al contenido',
  principal: 'Navegación principal',
  secundarias: 'Más secciones',
  masAcciones: 'Más acciones',
  masRotulo: 'Más',
  registrar: 'Registrar',
  marca: 'Finn',
  navegando: 'Abriendo la pantalla',
  sinConexion: 'Estás sin conexión',
  sinConexionNavegacion: 'Estás sin conexión. No se puede abrir esta pantalla.',
  // `/sin-conexion` (05 §8.5)
  sinConexionPagina: {
    titulo: 'Estás sin conexión',
    texto: 'Finn necesita internet para mostrarte tus números al día.',
    borrador: 'Lo que estabas registrando sigue guardado en esta pestaña.',
  },
  masDeNoventaYNueve: '99+',
  // Barra de una pantalla hija (06-identidad-visual §3.1)
  volverA: (seccion: string | null) => (seccion === null ? 'Volver' : `Volver a ${seccion}`),
  // Pie del centro de notificaciones (06-identidad-visual 2.17, P6-25)
  // [CH-296] El pie aprobado en P6-25 (06-features §5.3): los avisos `sms_*` también se listan en el centro (04 §11.2).
  notificacionesPie: 'Los movimientos por revisar se resuelven en la Bandeja.',
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
