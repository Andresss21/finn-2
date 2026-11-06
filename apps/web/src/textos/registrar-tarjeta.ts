// Textos de los tres flujos de FT-32 (05 §12). Los rechazos del servidor llegan ya compuestos en `mensaje`; el de AV-24 se arma con los valores del aviso.
import { glosario } from './glosario.ts';

export const registrarTarjeta = {
  flujos: {
    'entrada-tarjeta': {
      titulo: 'Entrada a una tarjeta',
      listo: 'Entrada registrada',
      guardar: 'Guardar entrada',
    },
    avance: { titulo: 'Avance de efectivo', listo: 'Avance registrado', guardar: 'Guardar avance' },
    'transferencia-deuda': {
      titulo: 'Pasar deuda entre tarjetas',
      listo: 'Deuda pasada',
      guardar: 'Pasar la deuda',
    },
  },
  tarjetaEntrada: 'Tarjeta que recibe',
  tarjetaAvance: 'Tarjeta que da el avance',
  cuentaAvance: 'Cuenta de efectivo que lo recibe',
  tarjetaOrigen: 'Tarjeta de origen de la deuda',
  tarjetaDestino: 'Tarjeta que toma la deuda',
  revisar: 'Revisá el cambio',
  entradaGuardada: (monto: string, tarjeta: string) => `Entrada guardada: ${monto} · ${tarjeta}`,
  avanceGuardado: (monto: string, tarjeta: string, cuenta: string) =>
    `Avance guardado: ${monto} · ${tarjeta} a ${cuenta}`,
  transferenciaDeudaGuardada: (monto: string, origen: string, destino: string) =>
    `Deuda pasada: ${monto} · ${origen} a ${destino}`,
  av24Titulo: `Cambió ${glosario.teFaltaReservar.toLowerCase()}`,
  av24Tarjeta: (tarjeta: string, antes: string, despues: string) =>
    `${tarjeta}: de ${antes} a ${despues}`,
  sin: {
    tarjetas: {
      titulo: 'Todavía no tenés una tarjeta',
      texto: 'Este movimiento es de una tarjeta de crédito. Creá una para registrarlo.',
    },
    efectivo: {
      titulo: 'Un avance necesita una cuenta de efectivo',
      texto: 'El dinero del avance entra a una cuenta de efectivo. Creá una para registrarlo.',
    },
    pocas: {
      titulo: 'Necesitás dos tarjetas',
      texto: 'Para pasar deuda de una tarjeta a otra hacen falta al menos dos.',
    },
  },
  tipos: {
    entrada: {
      titulo: 'Dinero que entra a una tarjeta',
      detalle: 'Un cashback o el pago de un tercero; baja lo que te falta reservar.',
    },
    avance: {
      titulo: 'Un avance de efectivo',
      detalle: 'Efectivo que sacás de la tarjeta; entra a una cuenta como otras entradas.',
    },
    deuda: {
      titulo: 'Pasar deuda de una tarjeta a otra',
      detalle: 'Mover deuda entre dos tarjetas.',
    },
  },
} as const;
