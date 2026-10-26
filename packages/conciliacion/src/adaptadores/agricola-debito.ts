import type { Adaptador } from '../tipos';
import { extraerDebito } from './debito';

// ⚠ (S6-1): sin muestras reales (TU-14; el banco puede no ofrecer CSV). Estructura SINTÉTICA:
//   Detalle de Estado Bancario
//   Fecha de corte,DD/MM/AAAA
//   Saldo Final,<importe>
//   Fecha,Descripcion,Referencia de Transaccion,Cargos,Abonos
const COLUMNAS = ['Fecha', 'Descripcion', 'Referencia de Transaccion', 'Cargos', 'Abonos'];

export const agricolaDebito: Adaptador = {
  id: 'ba_debito',
  tipoCuenta: 'efectivo',
  detectar: (texto) =>
    texto.includes('Detalle de Estado Bancario') && texto.includes('Referencia de Transacci'),
  extraer: (filas) => extraerDebito(filas, 'ba_debito', COLUMNAS),
};
