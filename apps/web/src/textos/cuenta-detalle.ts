// Textos de `/cuentas/[cuentaId]` (FT-52; 05 §12). Las partes siguientes de la ficha agregan acá los de las acciones, las
// conciliaciones ("Estado de cuenta", "Verificación de saldo") y los bloques de cada tipo de cuenta.
import { glosario } from './glosario.ts';

export const cuentaDetalle = {
  titulo: 'Detalle de cuenta',
  volver: 'Volver a Cuentas',
  saldo: 'Saldo',
  saldoConfirmado: 'Saldo confirmado',
  movimientos: {
    titulo: 'Movimientos',
    vacio: 'Esta cuenta todavía no tiene movimientos',
    vacioTexto: 'Cuando registres algo con esta cuenta, lo vas a ver acá.',
    sinResultados: 'Ningún movimiento coincide con los filtros.',
    sinResultadosTexto: 'Probá con otro período, tipo o estado.',
    saldoDespues: 'Saldo después',
    efecto: 'Efecto en la cuenta',
    mas: 'Movimientos anteriores',
    alInicio: 'Volver a los más recientes',
  },
  filtros: {
    titulo: 'Filtros',
    tipo: 'Tipo',
    estado: 'Estado',
    todos: 'Todos',
    aplicar: 'Filtrar',
    quitar: 'Quitar filtros',
    tipos: {
      gasto: 'Gasto',
      ingreso: 'Ingreso',
      saldo_inicial: 'Saldo inicial',
      transferencia: 'Transferencia',
      pago_tarjeta: 'Pago de tarjeta',
      cuota_prestamo: 'Cuota de préstamo',
      abono_capital: 'Abono a capital',
      aporte_inversion: 'Aporte a inversión',
      desembolso_prestamo: 'Desembolso de préstamo',
      retiro_inversion: 'Retiro de inversión',
      avance_efectivo: 'Avance de efectivo',
      entrada_tarjeta: 'Entrada a tarjeta',
      transferencia_tarjetas: 'Transferencia entre tarjetas',
      cobro: 'Cobro',
      devolucion: 'Devolución',
      ajuste_inversion: 'Ajuste de inversión',
    },
    estados: {
      pendiente: glosario.pendiente,
      confirmada: glosario.confirmada,
      conciliada: glosario.conciliada,
    },
  },
} as const;
