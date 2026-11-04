import { glosario } from './glosario';
// Textos del patrón de escritura (05 §4.7 y §4.8): los que produce el cliente; los del servidor llegan en `mensaje`.
export const formularios = {
  sinConexion: 'Estás sin conexión. No se envió nada; intentá de nuevo cuando vuelva la conexión.',
  sinConexionMotivo: 'Sin conexión',
  yaEstabaGuardado: 'Ya estaba guardado',
  noExiste: 'Esto ya no existe.',
  intentarDeNuevo: 'Intentar de nuevo',
  impactoCambio: 'El impacto cambió',
  versionNueva: 'Hay una versión nueva de Finn. Recargá para continuar.',
  recargar: 'Recargar',
  borradorRecuperado: 'Recuperamos lo que estabas escribiendo',
  descartarBorrador: 'Descartar borrador',
  usarValorActual: 'Usar el valor actual',
  incierto: 'No pudimos confirmar si se guardó. Volvé a intentarlo; no se duplicará.',
  huboCambios: 'Hubo cambios desde que abriste esto. Al guardar se verifica.',
} as const;

/** Las líneas del impacto de una operación con AV-01 (FT-27): `delta` ya viene formateado con su signo. */
export const impactoLineas = {
  listoParaAsignar: (delta: string) => `${glosario.listoParaAsignar} cambia ${delta}.`,
  disponible: (categoria: string, delta: string) =>
    `${glosario.disponible} de ${categoria} cambia ${delta}.`,
  teFaltaReservar: (tarjeta: string, delta: string) =>
    `${glosario.teFaltaReservar} para ${tarjeta} cambia ${delta}.`,
  reservaExcedente: (tarjeta: string, delta: string) =>
    `${glosario.reservadoDeMas} en ${tarjeta} cambia ${delta}.`,
  reduccion: (delta: string) =>
    `La reducción proyectada de ${glosario.listoParaAsignar} al cierre cambia ${delta}.`,
} as const;
