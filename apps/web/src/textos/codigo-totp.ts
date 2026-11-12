// Textos del código de verificación en seis casillas (05 §9.4 y §9.5 [CH-241]; entrega 4, E2-2, ACC-05 y `13-acceso`).
export const codigoTotp = {
  tituloVerificar: 'Código de verificación',
  introVerificar: 'Escribí el código de 6 dígitos de tu app de autenticación.',
  /** El rótulo visible del grupo en Inscribir y Agregar factor (`13-acceso/inscribir`). */
  codigoDeLaApp: 'Código de la app',
  casilla: (n: number | string) => `Dígito ${String(n)} de 6`,
  /** Con menos de 6 dígitos al enviar (E2-2). */
  faltan: (n: number | string) =>
    n === 1
      ? 'Falta 1 dígito. Escribí los 6 del código que muestra tu app.'
      : `Faltan ${String(n)} dígitos. Escribí los 6 del código que muestra tu app.`,
} as const;
