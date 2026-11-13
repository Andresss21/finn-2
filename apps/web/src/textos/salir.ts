// Textos de «Salir» a la vista y de la sesión vencida (05 §9.6 y §7.5 [CH-242]; entrega 4, «Entrega 3 · Salir a la vista» y E2-5).
import { salirFila } from './salir-fila.ts';

export const salir = {
  ...salirFila,
  esteDispositivo: 'En este dispositivo',
  correoEnDispositivo: (correo: string) => `${correo} · en este dispositivo`,
  cambiosSinEnviar: (n: number) =>
    n === 1 ? 'Tenés 1 cambio sin enviar' : `Tenés ${n} cambios sin enviar`,
  explicacion: (n: number) =>
    n === 1
      ? 'Es un borrador guardado solo en esta pestaña. Si salís, se borra.'
      : 'Son borradores guardados solo en esta pestaña. Si salís, se borran.',
  seguir: 'Seguir',
  quedarme: 'Quedarme',
  salirYBorrar: (n: number) => (n === 1 ? 'Salir y borrarlo' : 'Salir y borrarlos'),
  errorTitulo: 'No se pudo salir',
  errorTexto: 'Tus borradores siguen acá. Intentá de nuevo.',
  guardado: (hora: string) => `guardado ${hora}`,
  flujos: {
    gasto: 'Registrar gasto',
    registrar: 'Registrar',
    editar: 'Editar transacción',
    devolver: 'Devolver',
    revisar: 'Revisar movimiento',
    conciliar: 'Conciliar',
    cuenta: 'Cuenta',
    programada: 'Programada',
    formato: 'Formato bancario',
    plantilla: 'Plantilla de categorías',
    archivar: 'Archivar',
    fusionar: 'Fusionar',
    otro: 'Formulario sin enviar',
  },
  // E2-5: Ingresar después de una sesión vencida.
  sesionVencida: 'Tu sesión venció',
  sesionVencidaTexto: 'Ingresá de nuevo para seguir donde estabas.',
  borradorGuardado: 'Lo que estabas escribiendo quedó guardado en esta pestaña.',
} as const;
