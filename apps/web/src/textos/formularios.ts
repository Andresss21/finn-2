// Textos del patrón de escritura (05 §4.7 y §4.8): los que produce el cliente; los del servidor llegan en `mensaje`.
export const formularios = {
  sinConexion: 'Estás sin conexión. No se envió nada; intentá de nuevo cuando vuelva la conexión.',
  sinConexionMotivo: 'Sin conexión',
  yaEstabaGuardado: 'Ya estaba guardado',
  noExiste: 'Esto ya no existe.',
  intentarDeNuevo: 'Intentar de nuevo',
  impactoCambio: 'El impacto cambió',
  versionNueva: 'Hay una versión nueva',
  recargar: 'Recargar',
  usarValorActual: 'Usar el valor actual',
  incierto: 'No pudimos confirmar si se guardó. Volvé a intentarlo; no se duplicará.',
  huboCambios: 'Hubo cambios desde que abriste esto. Al guardar se verifica.',
} as const;
