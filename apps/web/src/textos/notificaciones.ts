// Textos de las notificaciones del dispositivo (FT-06; 05 §8.6, CP-5): la tarjeta de Inicio, `/ajustes/notificaciones` y las
// notificaciones push que muestra el service worker (FE-51).
export const notificaciones = {
  enlace: 'Notificaciones',
  titulo: 'Notificaciones',
  tarjetaTitulo: 'Activar notificaciones',
  tarjetaAyuda: 'Enterate al momento de tus SMS por revisar, tus pagos y el cierre del período.',
  activar: 'Activar notificaciones',
  activando: 'Activando…',
  descartar: 'Ahora no',
  activadasAqui: 'Las notificaciones están activas en este dispositivo.',
  /** [CH-240] E5-16: la tarjeta «Este dispositivo» de `/ajustes/notificaciones`. */
  esteDispositivoTitulo: 'Este dispositivo',
  sinDecidirAyuda:
    'Finn te pide el permiso solo cuando tocás el botón. Si no las activás, los avisos igual aparecen en la campana.',
  denegadoTitulo: 'Las notificaciones están bloqueadas en este navegador',
  denegadoAyuda: 'Finn no puede volver a pedir el permiso. Para activarlas:',
  denegadoPasos: [
    'Abrí los ajustes del sitio desde el candado, junto a la dirección.',
    'En «Notificaciones», elegí «Permitir».',
    'Volvé a Finn: esta pantalla se actualiza sola.',
  ],
  iosTitulo: 'En iPhone, primero instalá Finn',
  iosAyuda: 'Safari solo deja recibir notificaciones a las apps agregadas a la pantalla de inicio.',
  iosPasos: [
    'Tocá Compartir en la barra de Safari.',
    'Elegí «Agregar a inicio».',
    'Abrí Finn desde el ícono y volvé acá a activarlas.',
  ],
  notaPermiso:
    'Si el permiso está denegado, se cambia en los ajustes del navegador; Finn no puede pedirlo otra vez.',
  /** [CH-240] E5-17: la fila de Notificaciones del índice de Ajustes en un iPhone sin instalar. */
  filaIosSinInstalar: 'Sin activar: primero instalá Finn',
  noDisponible: 'Este navegador no permite notificaciones.',
  dispositivos: 'Dispositivos con notificaciones',
  sinDispositivos: 'Todavía no hay dispositivos con notificaciones.',
  esteDispositivo: 'Este dispositivo',
  agenteDesconocido: 'Dispositivo sin nombre',
  renovada: (fecha: string) => `Renovada el ${fecha}`,
  quitar: 'Quitar',
  quitarEtiqueta: (nombre: string) => `Quitar ${nombre}`,
  noSePudo: 'No se pudo completar. Probá de nuevo.',
  // Centro de notificaciones `/notificaciones` (FT-69; 05 §2.9)
  centro: {
    filtro: 'Mostrar',
    todas: 'Todas',
    sinLeer: (n: number | null) =>
      n === null ? 'Sin leer' : n === 0 ? 'Sin leer: 0' : `Sin leer · ${n}`,
    marcarTodo: 'Marcar todo como leído',
    marcando: 'Marcando…',
    todoLeido: 'Todo leído',
    nuevas: 'Nuevas',
    anteriores: 'Leídas',
    sinLeerMarca: 'Sin leer',
    yaNoExiste: 'Esto ya no existe',
    vacioTitulo: 'No tenés notificaciones',
    vacioTexto:
      'Acá vas a ver lo que Finn registró solo, tus pagos próximos y el cierre del período.',
    sinLeerVacioTitulo: 'Todo leído',
    sinLeerVacioTexto: 'No tenés notificaciones sin leer.',
    masAntiguas: 'Ver más antiguas',
    desdeElPrincipio: 'Volver a las más nuevas',
    retencion: 'Se guardan las notificaciones de los últimos 180 días.',
  },
  // Service worker (05 §8.6)
  push: {
    confirmar: 'Confirmar',
    rechazar: 'Rechazar',
    listo: 'Listo',
    genericoTitulo: 'Finn',
    genericoCuerpo: 'Tenés una notificación nueva.',
  },
} as const;
