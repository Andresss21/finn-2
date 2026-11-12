// Textos de Ajustes > Seguridad (FT-74; 05 §9.6; export de diseño, pantalla 11 «Seguridad»). Los errores son los de 05 §9.7.
export const seguridad = {
  titulo: 'Seguridad',
  factores: 'Factores',
  sesiones: 'Sesiones',
  alta: (fecha: string) => `Alta ${fecha}`,
  verificado: 'verificado',
  sinTerminar: 'Inscripción sin terminar',
  sinNombre: 'Factor',
  quitar: 'Quitar',
  agregar: 'Agregar un factor de respaldo',
  esteDispositivo: 'Este dispositivo',
  activaAhora: 'Activa ahora',
  cerrarOtras: 'Cerrar las otras sesiones',
  cerrandoOtras: 'Cerrando…',
  otrasCerradas: 'Cerraste las otras sesiones.',
  salir: 'Salir',
  saliendo: 'Saliendo…',
  tituloQuitar: 'Quitar un factor',
  preguntaQuitar: (nombre: string) =>
    `¿Quitar ${nombre}? Con ese factor ya no vas a poder ingresar.`,
  quitando: 'Quitando…',
  volver: 'Volver a Seguridad',
  // Quitar un factor (E2-8): hoja de confirmación con dos o más factores; el resultado queda en Seguridad.
  preguntaQuitarFactor: (nombre: string) => `¿Quitar ${nombre}?`,
  consecuenciaQuitar: (nombre: string, quedan: readonly string[]) =>
    `Ya no vas a poder ingresar con ${nombre}. ${quedan.length === 1 ? 'Te queda' : 'Te quedan'} ${quedan.join(' y ')}.`,
  cancelar: 'Cancelar',
  quitarNombre: (nombre: string) => `Quitar ${nombre}`,
  quitaste: (nombre: string) => `Quitaste ${nombre}.`,
  agregaste: (nombre: string) =>
    `Agregaste ${nombre}. Ya podés ingresar con cualquiera de los dos factores.`,
  intentarDeNuevo: 'Intentar de nuevo',
} as const;
