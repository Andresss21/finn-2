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
  sinDecidirAyuda:
    'Finn te pide el permiso solo cuando tocás el botón. Si no lo activás, los avisos se ven igual en Finn.',
  denegadoTitulo: 'Las notificaciones están bloqueadas',
  denegadoAyuda:
    'Para activarlas, habilitá las notificaciones de Finn en los ajustes de tu navegador o de tu teléfono, y volvé a abrir esta pantalla.',
  denegadoPasos: [
    'Abrí los ajustes del sitio desde el candado o el ícono junto a la dirección.',
    'En «Notificaciones», elegí «Permitir».',
    'Volvé a Finn y tocá «Activar notificaciones».',
  ],
  iosTitulo: 'Primero instalá Finn',
  iosAyuda:
    'En iPhone y iPad las notificaciones solo funcionan con Finn instalada en la pantalla de inicio. Instalala desde «Compartir» y «Agregar a inicio», abrí Finn desde ese ícono y volvé acá.',
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
    sinLeer: (n: number | null) => (n === null || n === 0 ? 'Sin leer' : `Sin leer · ${n}`),
    marcarTodo: 'Marcar todo como leído',
    marcando: 'Marcando…',
    todoLeido: 'Todo leído',
    nuevas: 'Nuevas',
    anteriores: 'Anteriores',
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
