// Textos de los componentes de cuentas, bandeja y gráficos (05 §10.8; 06-identidad-visual 2.9 a 2.12 y 2.18).
import { glosario } from './glosario.ts';

export const cuentas = {
  tarjeta: {
    deuda: 'Deuda',
    saldoAFavor: 'Saldo a favor',
    sinDeuda: 'Sin deuda',
    deudaDeTarjeta: 'Deuda de tarjeta',
    teFaltaReservar: glosario.teFaltaReservar,
    reservadoDeMas: glosario.reservadoDeMas,
    credito: (red: string) => `${red} · crédito`,
    ultimos4: (digitos: string) => `•••• ${digitos}`,
    traerAlFrente: 'Traer al frente',
    ayuda: 'Tocá la tarjeta de atrás para traerla al frente.',
    usoDelLimite: 'Uso del límite de',
    corte: 'Corte',
    pago: 'Pago',
    sinIntereses: 'Sin intereses',
    limite: 'Límite',
  },
  cuenta: {
    saldo: 'Saldo',
    confirmado: 'Confirmado',
    diferencia: 'Diferencia con el estado de cuenta',
    cuota: 'Cuota',
    sinModelo: 'Sin modelo',
    capitalPendiente: 'Capital pendiente',
    valor: 'Valor',
    archivada: 'Archivada',
  },
  posicion: {
    activos: 'Activos',
    deudas: 'Deudas',
    efectivo: 'Efectivo',
    saldosAFavor: 'Saldos a favor',
    inversiones: 'Inversiones',
    porCobrar: glosario.porCobrar,
    tarjetas: 'Tarjetas',
    prestamos: 'Préstamos',
  },
} as const;
