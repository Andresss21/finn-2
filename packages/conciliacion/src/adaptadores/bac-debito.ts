import type { Adaptador } from '../tipos';
import { extraerDebito } from './debito';

// ⚠ (S6-1): sin muestras reales (TU-13). Estructura SINTÉTICA, se rehace con PRU-MAN-CONC-001:
//   Detalle de Estado Bancario
//   Fecha de corte,DD/MM/AAAA
//   Saldo Inicial,<importe>
//   Saldo Final,<importe>
//   Fecha,Descripcion,Referencia,Debito,Credito
const COLUMNAS = ['Fecha', 'Descripcion', 'Referencia', 'Debito', 'Credito'];

export const bacDebito: Adaptador = {
  id: 'bac_debito',
  tipoCuenta: 'efectivo',
  detectar: (texto) =>
    texto.includes('Detalle de Estado Bancario') && texto.includes('Saldo Inicial'),
  extraer: (filas) => extraerDebito(filas, 'bac_debito', COLUMNAS),
};
