// Textos de la categoría de pago de tarjeta (FT-29; 05 §7.7, §12.3; 01 §5 AV-04 a AV-08). Voseo (05 §12.2).
// Los avisos llevan el monto en el medio: cada texto es un par [antes, después] y la pantalla pone el `Monto`.
import { glosario } from './glosario.ts';

export const categoriaPago = {
  titulo: 'Categoría de pago de tarjeta',
  deLaTarjeta: (tarjeta: string) => `Tarjeta ${tarjeta}`,
  principal: {
    teFaltaReservar: glosario.teFaltaReservar,
    alDia: 'Al día',
    alDiaTexto: 'No te falta reservar nada para esta tarjeta.',
    pagoReservado: 'Pago reservado',
  },
  // [CH-222 A8] La rejilla de la tarjeta hoy, arriba.
  rejilla: { deuda: 'Deuda', reservado: glosario.reservado, teFalta: 'Te falta' },
  avisos: {
    'AV-04': ['Pagaste', 'más de lo reservado; reducirá Listo para asignar al cierre'],
    'AV-05': [
      'Un cobro de',
      'se aplicó a la tarjeta sin reserva; reducirá Listo para asignar al cierre',
    ],
    'AV-06-saldo': [
      'La devolución de',
      'quedó como saldo a favor en tu tarjeta; reducirá Listo para asignar al cierre',
    ],
    'AV-06-deuda': [
      'La devolución de',
      'regresó a su categoría, pero ese dinero ya se había usado para pagar la tarjeta; reducirá Listo para asignar al cierre',
    ],
    'AV-08': ['Tenés', 'reservado de más para esta tarjeta'],
    excedente: ['Pago excedente de', 'en este período'],
  },
  numeros: {
    titulo: 'Números del período',
    asignado: glosario.asignado,
    actividad: 'Actividad',
    arrastre: glosario.arrastrado,
    disponible: glosario.disponible,
  },
  hoy: {
    titulo: 'La tarjeta hoy',
    deuda: 'Deuda',
    saldoAFavor: 'Saldo a favor',
    reservado: glosario.reservado,
    faltaReservar: glosario.teFaltaReservar,
    reservaExcedente: glosario.reservadoDeMas,
  },
  traslados: {
    titulo: 'Traslados por categoría',
    nota: 'Lo que cada categoría pasó a esta tarjeta por compras cubiertas.',
    vacio: 'Ninguna categoría trasladó dinero a esta tarjeta en este período.',
  },
  movimientos: {
    pagos: 'Pagos',
    pagosImplicitos: 'Pagos implícitos',
    devoluciones: 'Devoluciones',
    caso: { 'D-3': 'Con saldo a favor', 'D-4': 'Con deuda' },
  },
  alPagar: {
    titulo: 'Para no generar intereses',
    contado: 'Pago de contado',
    deudaAnterior: 'Deuda al corte anterior',
    cargosDelCiclo: 'Cargos del ciclo actual',
    yaPagado: 'Ya pagado en el ciclo',
    pagaAntesDel: (dia: string, mes: string) => `Pagá antes del ${dia}/${mes}`,
  },
  historial: {
    titulo: 'Períodos anteriores',
    periodo: 'Período',
    columnas: [glosario.asignado, glosario.disponible],
  },
  acciones: {
    etiqueta: 'Acciones de la tarjeta',
    reservar: 'Reservar',
    asignar: 'Asignar',
    pagar: 'Pagar tarjeta',
    pagarLaTarjeta: 'Pagar la tarjeta',
  },
  cerrado: 'Este período está cerrado: solo se puede mirar.',
  futuro: 'Período futuro: lo reservado se muestra solo en el período actual.',
} as const;
