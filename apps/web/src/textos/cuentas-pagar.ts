// Textos de `/cuentas/[cuentaId]/pagar` (FT-30; 06 FT-30; 05 §2.7, §12). Voseo (05 §12.2). Los montos llegan ya formateados desde el
// servidor (PF-3); los rechazos de negocio (`fecha_posterior_a_hoy`, `fecha_anterior_a_apertura`…) llegan compuestos en `mensaje`.
import { glosario } from './glosario.ts';

export const cuentasPagar = {
  tituloGenerico: 'Pagar tarjeta',
  titulo: (tarjeta: string) => `Pagar ${tarjeta}`,
  deuda: (monto: string) => `Deuda ${monto}`,
  desde: 'Desde',
  marcador: 'Elegí la cuenta',
  saldo: (monto: string) => `Saldo ${monto}`,
  saldoPreseleccionada: (monto: string) => `Saldo ${monto} · preseleccionada`,
  desglose: 'Desglose del ciclo',
  deudaAnterior: (corte: string) => `Deuda anterior (corte ${corte})`,
  cargosDelCiclo: 'Cargos del ciclo',
  yaPagado: 'Ya pagado',
  paraNoGenerarIntereses: 'Para no generar intereses',
  reservadoPara: (tarjeta: string) => `${glosario.reservado} para ${tarjeta}`,
  atajos: 'Monto rápido',
  todaLaDeuda: 'Toda la deuda',
  loReservado: `Lo ${glosario.reservado.toLowerCase()}`,
  monto: 'Monto',
  fecha: 'Fecha',
  elegirOrigen: 'Elegí desde qué cuenta pagás.',
  completar: 'Completá este campo.',
  pagar: 'Pagar',
  pagarMonto: (monto: string) => `Pagar ${monto}`,
  pagando: 'Pagando…',
  cancelar: 'Cancelar',
  revisar: 'Revisá el pago',
  confirmar: 'Confirmar',
  volverAEditar: 'Volver a editar',
  avisos: {
    'AV-01': 'La fecha es de un período cerrado: cambia el período activo.',
    'AV-10': (exceso: string, tarjeta: string) =>
      `Pagás ${exceso} más de lo reservado para ${tarjeta}: ${glosario.listoParaAsignar} se reducirá al cierre.`,
  },
  saldoAFavor: (monto: string, tarjeta: string) =>
    `Pagás más que la deuda: quedará saldo a favor de ${monto} en ${tarjeta}.`,
  archivada: 'Esta tarjeta está archivada. Desarchivala para registrar un pago.',
  tituloListo: 'Pago registrado',
  guardado: (monto: string, tarjeta: string) => `Pago guardado: ${monto} · ${tarjeta}`,
  avisoExcedente: (tarjeta: string) =>
    `Pagaste más de lo reservado para ${tarjeta}: ${glosario.listoParaAsignar} se reducirá al cierre.`,
  verCategoria: (tarjeta: string) => `Ver la categoría de pago de ${tarjeta}`,
  verTarjeta: (tarjeta: string) => `Ver ${tarjeta}`,
} as const;
