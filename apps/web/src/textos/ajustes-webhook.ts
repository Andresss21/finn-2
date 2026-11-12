// Textos de `/ajustes/webhook` (FT-03; 05 §12; 04 §8.8). Los del servidor (errores) llegan ya compuestos en `mensaje`.
export const ajustesWebhook = {
  titulo: 'Conectar los SMS',
  sinToken: 'Todavía no conectaste tus SMS. Generá un token y pegalo en MacroDroid.',
  conToken: (fecha: string) => `Token generado el ${fecha}.`,
  /** [CH-227] Con el token configurado (A27). */
  conectado: 'Conectado',
  /** [CH-241 h] `cuando`: «hoy a las 12:41» o «el 04/02/2027 a las 04:07» (11-ajustes/conectar-sms). */
  conectadoConSms: (cuando: string) => `Conectado. El último SMS llegó ${cuando}.`,
  llegadaHoy: (hora: string) => `hoy a las ${hora}`,
  llegadaOtroDia: (fecha: string, hora: string) => `el ${fecha} a las ${hora}`,
  generar: 'Generar token',
  generando: 'Generando…',
  /** [CH-240] E5-18: la pantalla no muestra ningún sufijo ni «Copiar»; Finn guarda solo el SHA-256 del token (04 §8.8). */
  tarjetaToken: 'Token de MacroDroid',
  noGuardado:
    'Finn no guarda el token: solo lo muestra una vez, al generarlo. Si lo perdiste o cambiaste de teléfono, generá uno nuevo.',
  generarNuevo: 'Generar un token nuevo',
  cancelar: 'Cancelar',
  /** [CH-240] La hoja de `/ajustes/webhook/token` (E5-18, flujo corto). */
  hoja: {
    tituloCambiar: 'Cambiar el token',
    tituloPrimero: 'Generar el token',
    descripcion: 'Conectar los SMS',
    advertenciaTitulo: 'El token actual deja de funcionar',
    advertencia:
      'MacroDroid no va a poder mandar SMS a Finn hasta que pegues el token nuevo en su acción «HTTP Request». Hacelo con el teléfono a mano: el token nuevo se muestra completo una sola vez.',
    primero:
      'El token se muestra completo una sola vez. Hacelo con el teléfono a mano, para pegarlo enseguida en MacroDroid.',
    listoNuevo: 'Generaste un token nuevo. El anterior dejó de funcionar.',
    listoPrimero: 'Generaste tu token.',
    copialoAhora: 'Copialo ahora',
    ocultoAlCerrar:
      'Cuando cierres esta pantalla, el token se vuelve a ver oculto. Pegalo en MacroDroid y probá con «Probar acción».',
    listo: 'Listo',
  },
  tokenEtiqueta: 'Token del webhook',
  urlEtiqueta: 'URL de la acción HTTP',
  copiar: 'Copiar',
  copiado: 'Copiado',
  noSePudoCopiar: 'No se pudo copiar. Seleccionalo y copialo a mano.',
  instrucciones: 'Cómo configurar MacroDroid',
  disparador: ['Disparador', 'SMS recibido, filtrado por los remitentes de tus bancos.'],
  accion: ['Acción', 'HTTP Request.'],
  metodo: ['Método', 'POST'],
  tiempo: ['Tiempo de espera', '30 s'],
  reintentos: [
    'Reintentos',
    'Activá el reintento ante cualquier respuesta que no sea 2xx. Si la acción no lo ofrece, envolvela en un ciclo de hasta 3 reintentos con 30 s de espera.',
  ],
  cabeceras: 'Cabeceras',
  cabeceraAutorizacion: 'Authorization: Bearer <el token que copiaste>',
  cuerpo: 'Cuerpo',
  cuerpoJson: '{"texto":"[sms_message]","remitente":"[sms_number]"}',
  cuerpoTexto: '[sms_message]',
  contenidoJson: 'Content-Type: application/json',
  contenidoTexto: 'Content-Type: text/plain; charset=utf-8',
  remitenteTexto: 'X-Finn-Remitente: [sms_number]',
  pruebaTitulo: 'Probá en el teléfono',
  prueba:
    'Con "Probar acción" de MacroDroid, o con un SMS desde otro teléfono usando un remitente que agregues al filtro por un rato. Tiene que aparecer en la Bandeja como no reconocido.',
} as const;
