// Excepciones de la autorización (07 §19.1, DP-22, CH-56): lo único que puede no exigir AAL2 o su token. PRU-SEG-ACCESO-001
// descubre las Server Actions y las rutas por su cuenta: una exportación fuera de estas listas sin su exigencia hace fallar
// la prueba. Este archivo NO lleva 'use server'. Cambiarlo es de revisión obligatoria (08 §1.5, área seguridad).

/** Acceso previo a AAL2 (05 §9): `accionDeAcceso()`, con la exigencia de cada estado en su función de CP-11. */
export const ACCIONES_DE_ACCESO = {
  archivo: 'servidor/acciones/autenticacion.ts',
  nombres: ['ingresar', 'verificarFactor', 'iniciarInscripcion', 'completarInscripcion', 'salir'],
} as const;

/** Rutas públicas por diseño, relativas a `src/`: la del service worker (05 §8.1, CP-17). */
export const RUTAS_PUBLICAS: readonly string[] = ['app/serwist/[path]/route.ts'];
